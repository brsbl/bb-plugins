import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    values[key] = value;
    index += 1;
  }
  return values;
}

const args = parseArgs(process.argv.slice(2));
const outputDir = args.output;
const asOf = args["as-of"];
const detailStart = args["detail-start"];
const historyStart = args["history-start"] ?? "2015-01-01T00:00:00.000Z";
const guildId = args.guild;
const repository = args.repo;

if (!outputDir || !asOf || !detailStart || !guildId || !repository) {
  throw new Error(
    "Usage: node collect.mjs --output <run-dir> --as-of <ISO> --detail-start <ISO> --guild <id> --repo <owner/name> [--history-start <ISO>]",
  );
}
for (const [name, value] of Object.entries({ asOf, detailStart, historyStart })) {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`Invalid ${name}: ${value}`);
}
if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is not configured in the process environment");
}

const DISCORD_EPOCH = 1420070400000n;
const VIEW_CHANNEL = 1n << 10n;
const PUBLIC_PARENT_TYPES = new Set([0, 5, 15]);
const PUBLIC_THREAD_TYPE = 11;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const inRange = (value, start, end) => value && value >= start && value < end;
const snowflakeFor = (iso) =>
  ((BigInt(Date.parse(iso)) - DISCORD_EPOCH) << 22n).toString();

await mkdir(path.join(outputDir, "raw"), { recursive: true });

async function discordFetch(route) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(`https://discord.com/api/v10${route}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    });
    if (response.status === 429) {
      const body = await response.json();
      await sleep(Math.ceil((body.retry_after ?? 1) * 1000));
      continue;
    }
    if (response.status >= 500) {
      await sleep(500 * 2 ** attempt);
      continue;
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Discord ${response.status} ${route}: ${body.slice(0, 300)}`);
    }
    return response.json();
  }
  throw new Error(`Discord retries exhausted: ${route}`);
}

function publicToEveryone(channel, everyonePermissions) {
  let permissions = everyonePermissions;
  const overwrite = (channel.permission_overwrites ?? []).find(
    (item) => item.type === 0 && item.id === guildId,
  );
  if (overwrite) {
    permissions &= ~BigInt(overwrite.deny ?? "0");
    permissions |= BigInt(overwrite.allow ?? "0");
  }
  return (permissions & VIEW_CHANNEL) !== 0n;
}

function sanitizeDiscordMessage(message, channelId, parentId = null) {
  return {
    id: message.id,
    channelId,
    parentId,
    authorId: message.author?.id ?? null,
    authorUsername: message.author?.username ?? null,
    authorGlobalName: message.author?.global_name ?? null,
    authorBot: Boolean(message.author?.bot),
    timestamp: message.timestamp,
    editedTimestamp: message.edited_timestamp,
    content: message.content ?? "",
    type: message.type,
    flags: message.flags ?? 0,
    attachments: (message.attachments ?? []).map((item) => ({
      id: item.id,
      filename: item.filename,
      contentType: item.content_type ?? null,
      url: item.url,
    })),
    embeds: (message.embeds ?? []).map((item) => ({
      type: item.type ?? null,
      title: item.title ?? null,
      description: item.description ?? null,
      url: item.url ?? null,
    })),
    reactions: (message.reactions ?? []).map((item) => ({
      count: item.count,
      emoji: item.emoji?.name ?? null,
      emojiId: item.emoji?.id ?? null,
    })),
    reference: message.message_reference
      ? {
          messageId: message.message_reference.message_id ?? null,
          channelId: message.message_reference.channel_id ?? null,
          guildId: message.message_reference.guild_id ?? null,
        }
      : null,
    url: `https://discord.com/channels/${guildId}/${channelId}/${message.id}`,
  };
}

async function fetchDiscordMessages(channelId, parentId = null) {
  const collected = [];
  let before = snowflakeFor(asOf);
  for (;;) {
    const page = await discordFetch(
      `/channels/${channelId}/messages?limit=100&before=${before}`,
    );
    if (page.length === 0) break;
    for (const message of page) {
      if (inRange(message.timestamp, historyStart, asOf)) {
        collected.push(sanitizeDiscordMessage(message, channelId, parentId));
      }
    }
    const oldest = page.reduce((left, right) =>
      BigInt(left.id) < BigInt(right.id) ? left : right,
    );
    if (oldest.timestamp < historyStart) break;
    before = oldest.id;
  }
  return collected.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

async function collectDiscord() {
  const guild = await discordFetch(`/guilds/${guildId}?with_counts=true`);
  const channels = await discordFetch(`/guilds/${guildId}/channels`);
  const everyoneRole = (guild.roles ?? []).find((role) => role.id === guildId);
  if (!everyoneRole) throw new Error("Discord @everyone role was not returned");
  const everyonePermissions = BigInt(everyoneRole.permissions ?? "0");

  const manifest = channels
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
    .map((channel) => {
      const isPublic = publicToEveryone(channel, everyonePermissions);
      const included = isPublic && PUBLIC_PARENT_TYPES.has(channel.type);
      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: channel.parent_id ?? null,
        publicToEveryone: isPublic,
        included,
        reason: included
          ? "Public text, announcement, or forum channel"
          : isPublic
            ? "Public non-message channel"
            : "Not public to @everyone",
      };
    });

  const includedParents = manifest.filter((item) => item.included);
  const parentIds = new Set(includedParents.map((item) => item.id));
  const directMessageChannels = includedParents.filter((item) => [0, 5].includes(item.type));
  const coverage = [];
  const threadsById = new Map();

  try {
    const active = await discordFetch(`/guilds/${guildId}/threads/active`);
    for (const thread of active.threads ?? []) {
      if (thread.type === PUBLIC_THREAD_TYPE && parentIds.has(thread.parent_id)) {
        threadsById.set(thread.id, thread);
      }
    }
  } catch (error) {
    coverage.push({ source: "discord-active-threads", error: String(error) });
  }

  for (const parent of includedParents) {
    let before = asOf;
    for (;;) {
      try {
        const page = await discordFetch(
          `/channels/${parent.id}/threads/archived/public?limit=100&before=${encodeURIComponent(before)}`,
        );
        for (const thread of page.threads ?? []) {
          if (thread.type === PUBLIC_THREAD_TYPE) threadsById.set(thread.id, thread);
        }
        if (!page.has_more || (page.threads ?? []).length === 0) break;
        const archiveTimes = (page.threads ?? [])
          .map((thread) => thread.thread_metadata?.archive_timestamp)
          .filter(Boolean)
          .sort();
        if (archiveTimes.length === 0 || archiveTimes[0] < historyStart) break;
        before = archiveTimes[0];
      } catch (error) {
        coverage.push({
          source: "discord-archived-threads",
          channelId: parent.id,
          error: String(error),
        });
        break;
      }
    }
  }

  const messages = [];
  for (const channel of directMessageChannels) {
    try {
      messages.push(...(await fetchDiscordMessages(channel.id)));
    } catch (error) {
      coverage.push({
        source: "discord-channel-messages",
        channelId: channel.id,
        error: String(error),
      });
    }
  }

  const threads = [];
  for (const thread of threadsById.values()) {
    threads.push({
      id: thread.id,
      parentId: thread.parent_id,
      name: thread.name,
      ownerId: thread.owner_id ?? null,
      createdAt: thread.thread_metadata?.create_timestamp ?? null,
      archived: Boolean(thread.thread_metadata?.archived),
      archiveTimestamp: thread.thread_metadata?.archive_timestamp ?? null,
      messageCount: thread.message_count ?? null,
    });
    try {
      messages.push(...(await fetchDiscordMessages(thread.id, thread.parent_id)));
    } catch (error) {
      coverage.push({
        source: "discord-thread-messages",
        channelId: thread.id,
        parentId: thread.parent_id,
        error: String(error),
      });
    }
  }

  return {
    guild: {
      id: guild.id,
      name: guild.name,
      approximateMemberCount: guild.approximate_member_count ?? null,
    },
    manifest,
    threads: threads.sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? "")),
    messages: messages.sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
    coverage,
  };
}

function ghApi(endpoint) {
  const output = execFileSync("gh", ["api", "--paginate", "--slurp", endpoint], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  return JSON.parse(output).flat();
}

function issueNumberFromUrl(url) {
  return Number(url.match(/\/issues\/(\d+)$/)?.[1] ?? 0);
}

function sanitizeIssue(issue) {
  return {
    id: issue.id,
    nodeId: issue.node_id,
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    state: issue.state,
    stateReason: issue.state_reason ?? null,
    locked: issue.locked,
    userId: issue.user?.id ?? null,
    username: issue.user?.login ?? null,
    userType: issue.user?.type ?? null,
    authorAssociation: issue.author_association ?? null,
    labels: (issue.labels ?? []).map((label) =>
      typeof label === "string" ? label : label.name,
    ),
    assignees: (issue.assignees ?? []).map((assignee) => assignee.login),
    milestone: issue.milestone?.title ?? null,
    commentsCount: issue.comments,
    reactions: issue.reactions ?? null,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
    htmlUrl: issue.html_url,
  };
}

function sanitizeComment(comment) {
  return {
    id: comment.id,
    nodeId: comment.node_id,
    issueNumber: issueNumberFromUrl(comment.issue_url),
    body: comment.body ?? "",
    userId: comment.user?.id ?? null,
    username: comment.user?.login ?? null,
    userType: comment.user?.type ?? null,
    authorAssociation: comment.author_association ?? null,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    reactions: comment.reactions ?? null,
    htmlUrl: comment.html_url,
  };
}

function sanitizeTimeline(event, issueNumber) {
  return {
    id: event.id ?? event.node_id ?? null,
    issueNumber,
    event: event.event,
    createdAt: event.created_at ?? event.submitted_at ?? null,
    actorId: event.actor?.id ?? event.user?.id ?? null,
    actorUsername: event.actor?.login ?? event.user?.login ?? null,
    label: event.label?.name ?? null,
    commitId: event.commit_id ?? null,
    sourceIssueNumber: event.source?.issue?.number ?? null,
  };
}

function sanitizeReaction(reaction, targetType, targetId, issueNumber) {
  return {
    id: reaction.id,
    targetType,
    targetId,
    issueNumber,
    userId: reaction.user?.id ?? null,
    username: reaction.user?.login ?? null,
    userType: reaction.user?.type ?? null,
    content: reaction.content,
    createdAt: reaction.created_at,
  };
}

async function collectGitHub() {
  const rawIssues = ghApi(`repos/${repository}/issues?state=all&per_page=100`);
  const issues = rawIssues.filter((issue) => !issue.pull_request).map(sanitizeIssue);
  const issueNumbers = new Set(issues.map((issue) => issue.number));
  const comments = ghApi(`repos/${repository}/issues/comments?per_page=100`)
    .map(sanitizeComment)
    .filter((comment) => issueNumbers.has(comment.issueNumber));
  const timeline = [];
  const reactions = [];
  const coverage = [];

  const timelineCandidates = issues.filter(
    (issue) => issue.createdAt < asOf && issue.updatedAt >= detailStart,
  );
  for (const issue of timelineCandidates) {
    try {
      timeline.push(
        ...ghApi(`repos/${repository}/issues/${issue.number}/timeline?per_page=100`).map(
          (event) => sanitizeTimeline(event, issue.number),
        ),
      );
    } catch (error) {
      coverage.push({ source: "github-timeline", issueNumber: issue.number, error: String(error) });
    }
  }

  for (const issue of issues.filter((item) => (item.reactions?.total_count ?? 0) > 0)) {
    try {
      reactions.push(
        ...ghApi(`repos/${repository}/issues/${issue.number}/reactions?per_page=100`).map(
          (reaction) => sanitizeReaction(reaction, "issue", issue.id, issue.number),
        ),
      );
    } catch (error) {
      coverage.push({
        source: "github-issue-reactions",
        issueNumber: issue.number,
        error: String(error),
      });
    }
  }

  for (const comment of comments.filter((item) => (item.reactions?.total_count ?? 0) > 0)) {
    try {
      reactions.push(
        ...ghApi(`repos/${repository}/issues/comments/${comment.id}/reactions?per_page=100`).map(
          (reaction) => sanitizeReaction(reaction, "comment", comment.id, comment.issueNumber),
        ),
      );
    } catch (error) {
      coverage.push({
        source: "github-comment-reactions",
        commentId: comment.id,
        issueNumber: comment.issueNumber,
        error: String(error),
      });
    }
  }

  return { repository, issues, comments, timeline, reactions, coverage };
}

const run = {
  runId: path.basename(outputDir),
  generatedAt: new Date().toISOString(),
  collectorVersion: "2.0.0-draft",
  asOf,
  detailStart,
  historyStart,
  windowSemantics: "[start,end)",
};

const discord = await collectDiscord();
await writeFile(
  path.join(outputDir, "raw", "discord.json"),
  `${JSON.stringify({ ...run, ...discord }, null, 2)}\n`,
);

const github = await collectGitHub();
await writeFile(
  path.join(outputDir, "raw", "github.json"),
  `${JSON.stringify({ ...run, ...github }, null, 2)}\n`,
);

const summary = {
  ...run,
  discord: {
    channels: discord.manifest.length,
    includedChannels: discord.manifest.filter((item) => item.included).length,
    threads: discord.threads.length,
    messages: discord.messages.length,
    coverageFailures: discord.coverage.length,
  },
  github: {
    issues: github.issues.length,
    comments: github.comments.length,
    timelineEvents: github.timeline.length,
    reactions: github.reactions.length,
    coverageFailures: github.coverage.length,
  },
};
await writeFile(
  path.join(outputDir, "raw", "collection-summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log(JSON.stringify(summary));
