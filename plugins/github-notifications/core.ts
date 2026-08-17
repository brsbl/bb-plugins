export type ResourceKind = "issue" | "pr";
export type ActivityKind = "comment" | "mention";

export interface GithubNotificationRow {
  id: string;
  latestCommentUrl: string | null;
  reason: string;
  repository: string;
  subjectType: string;
  subjectUrl: string;
  title: string;
  unread: boolean;
  updatedAt: string;
}

interface GithubActor {
  avatarUrl?: unknown;
  login?: unknown;
}

export interface GithubCommentNode {
  author?: GithubActor | null;
  body?: unknown;
  bodyText?: unknown;
  createdAt?: unknown;
  databaseId?: unknown;
}

export interface GithubResourceNode {
  author?: GithubActor | null;
  comments?: { nodes?: unknown } | null;
  number?: unknown;
  reviewThreads?: { nodes?: unknown } | null;
  title?: unknown;
  updatedAt?: unknown;
  url?: unknown;
}

export interface GithubNotificationItem {
  id: string;
  activity: string;
  activityKind: ActivityKind;
  actor: string | null;
  avatarUrl: string | null;
  eventKey?: string | null;
  number: number;
  repo: string;
  resolved: boolean;
  resourceKind: ResourceKind;
  title: string;
  unread: boolean;
  updatedAt: string;
  url: string;
}

export interface GraphqlLookup {
  alias: string;
  number: number;
  owner: string;
  repoName: string;
  resourceKind: ResourceKind;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseNumberFromSubjectUrl(url: string): number | null {
  const match = url.match(/\/(?:issues|pulls)\/(\d+)$/u);
  if (match === null) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function isCommentActivity(reason: string, latestCommentUrl: string | null): boolean {
  if (reason === "comment" || reason === "mention" || reason === "team_mention") {
    return true;
  }
  return (
    reason === "author" &&
    latestCommentUrl !== null &&
    /\/comments\/\d+$/u.test(latestCommentUrl)
  );
}

export function parseNotificationRows(raw: unknown): GithubNotificationRow[] {
  if (!Array.isArray(raw)) {
    throw new Error("GitHub returned an invalid notifications response.");
  }
  return raw.flatMap((entry) => {
    if (
      !isRecord(entry) ||
      !isRecord(entry.repository) ||
      !isRecord(entry.subject)
    ) {
      return [];
    }
    const id = stringValue(entry.id);
    const reason = stringValue(entry.reason);
    const latestCommentUrl = stringValue(entry.subject.latest_comment_url);
    const repository = stringValue(entry.repository.full_name);
    const subjectType = stringValue(entry.subject.type);
    const subjectUrl = stringValue(entry.subject.url);
    const title = stringValue(entry.subject.title);
    const updatedAt = stringValue(entry.updated_at);
    if (
      id === null ||
      reason === null ||
      repository === null ||
      subjectUrl === null ||
      title === null ||
      updatedAt === null ||
      !isCommentActivity(reason, latestCommentUrl) ||
      (subjectType !== "Issue" && subjectType !== "PullRequest")
    ) {
      return [];
    }
    return [
      {
        id,
        latestCommentUrl,
        reason,
        repository,
        subjectType,
        subjectUrl,
        title,
        unread: entry.unread === true,
        updatedAt,
      },
    ];
  });
}

function buildLookups(
  rows: GithubNotificationRow[],
  indexOffset: number,
): GraphqlLookup[] {
  return rows.flatMap((row, index): GraphqlLookup[] => {
    const [owner, repoName, ...rest] = row.repository.split("/");
    const number = parseNumberFromSubjectUrl(row.subjectUrl);
    if (!owner || !repoName || rest.length > 0 || number === null) return [];
    return [
      {
        alias: `notification${index + indexOffset}`,
        number,
        owner,
        repoName,
        resourceKind: row.subjectType === "PullRequest" ? "pr" : "issue",
      },
    ];
  });
}

export function buildOwnershipQuery(
  rows: GithubNotificationRow[],
  indexOffset = 0,
): {
  query: string;
  lookups: GraphqlLookup[];
} {
  const lookups = buildLookups(rows, indexOffset);
  const fields = lookups.map((lookup) => {
    const resourceField =
      lookup.resourceKind === "pr" ? "pullRequest" : "issue";
    return `${lookup.alias}: repository(owner: ${JSON.stringify(lookup.owner)}, name: ${JSON.stringify(lookup.repoName)}) {
      resource: ${resourceField}(number: ${lookup.number}) {
        author { login }
        number
        title
        url
      }
    }`;
  });
  return {
    lookups,
    query: `query GithubNotifications { viewer { login } ${fields.join("\n")} }`,
  };
}

function latestCommentDatabaseId(url: string | null): number | null {
  if (url === null) return null;
  const match = url.match(/\/comments\/(\d+)$/u);
  if (match === null) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function buildActivityQuery(args: {
  lookups: GraphqlLookup[];
  rows: GithubNotificationRow[];
}): string {
  const fields = args.lookups.map((lookup) => {
    const resourceField =
      lookup.resourceKind === "pr" ? "pullRequest" : "issue";
    return `${lookup.alias}: repository(owner: ${JSON.stringify(lookup.owner)}, name: ${JSON.stringify(lookup.repoName)}) {
      resource: ${resourceField}(number: ${lookup.number}) {
        comments(last: 20) { nodes { author { login avatarUrl } body createdAt databaseId } }
      }
    }`;
  });
  return `query GithubNotificationActivity { ${fields.join("\n")} }`;
}

export function selectOwnedLookups(args: {
  data: Record<string, unknown>;
  lookups: GraphqlLookup[];
}): { login: string; lookups: GraphqlLookup[] } {
  const viewer = isRecord(args.data.viewer)
    ? stringValue(args.data.viewer.login)
    : null;
  if (viewer === null)
    throw new Error("GitHub did not return the signed-in account.");
  return {
    login: viewer,
    lookups: args.lookups.filter((lookup) => {
      const repositoryNode = args.data[lookup.alias];
      return (
        isRecord(repositoryNode) &&
        isRecord(repositoryNode.resource) &&
        stringValue(
          (repositoryNode.resource as GithubResourceNode).author?.login,
        ) === viewer
      );
    }),
  };
}

interface ActivityCandidate {
  actor: string;
  at: string;
  avatarUrl: string | null;
  eventKey: string;
  kind: ActivityKind;
  label: string;
  matchesLatestComment: boolean;
}

function dateValue(value: unknown): string | null {
  const candidate = stringValue(value);
  if (candidate === null || !Number.isFinite(Date.parse(candidate)))
    return null;
  return candidate;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function includesMention(
  body: string,
  viewer: string,
  reason: string,
): boolean {
  const mentionableBody = body
    .replace(/<!--[\s\S]*?-->/gu, "")
    .replace(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, "")
    .replace(/(`+)[\s\S]*?\1/gu, "")
    .split(/\r?\n/u)
    .reduce<{
      fence: { character: string; length: number } | null;
      lines: string[];
      quoteContinuation: boolean;
    }>(
      (state, line) => {
        const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/u)?.[1];
        if (state.fence !== null) {
          if (
            fence !== undefined &&
            fence[0] === state.fence.character &&
            fence.length >= state.fence.length
          ) {
            state.fence = null;
          }
          return state;
        }
        if (fence !== undefined) {
          state.fence = { character: fence[0]!, length: fence.length };
          return state;
        }
        if (/^\s{0,3}>/u.test(line)) {
          state.quoteContinuation = line.replace(/^\s{0,3}>\s?/u, "").length > 0;
          return state;
        }
        if (state.quoteContinuation) {
          if (line.trim().length === 0) state.quoteContinuation = false;
          return state;
        }
        if (/^(?: {4}|\t)/u.test(line)) return state;
        state.lines.push(line);
        return state;
      },
      { fence: null, lines: [], quoteContinuation: false },
    )
    .lines.join("\n");
  const directMention = new RegExp(
    `(^|[^A-Za-z0-9-])@${escapeRegExp(viewer)}(?![A-Za-z0-9-])`,
    "iu",
  );
  if (directMention.test(mentionableBody)) return true;
  if (reason !== "team_mention") return false;
  return /(^|[^A-Za-z0-9-])@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?(?![A-Za-z0-9_-])/iu.test(
    mentionableBody,
  );
}

function candidatesFromComments(
  rawNodes: unknown,
  viewer: string,
  row: GithubNotificationRow,
): ActivityCandidate[] {
  if (!Array.isArray(rawNodes)) return [];
  return rawNodes.flatMap((entry): ActivityCandidate[] => {
    if (!isRecord(entry)) return [];
    const comment = entry as GithubCommentNode;
    const actor = stringValue(comment.author?.login);
    const avatarUrl = stringValue(comment.author?.avatarUrl);
    const at = dateValue(comment.createdAt);
    if (actor === null || at === null || actor === viewer) return [];
    const body =
      typeof comment.body === "string"
        ? comment.body
        : typeof comment.bodyText === "string"
          ? comment.bodyText
          : "";
    const databaseId =
      typeof comment.databaseId === "number" &&
      Number.isSafeInteger(comment.databaseId)
        ? comment.databaseId
        : null;
    const expectedMentionId = latestCommentDatabaseId(row.latestCommentUrl);
    const mention = includesMention(body, viewer, row.reason);
    return [
      {
        actor,
        at,
        avatarUrl,
        eventKey:
          databaseId === null
            ? `comment:${at}:${actor}`
            : `comment:${databaseId}`,
        kind: mention ? "mention" : "comment",
        label: mention ? "Mention" : "New comment",
        matchesLatestComment:
          expectedMentionId !== null && databaseId === expectedMentionId,
      },
    ];
  });
}

function commentCandidates(
  node: GithubResourceNode,
  viewer: string,
  row: GithubNotificationRow,
): ActivityCandidate[] {
  const issueComments = candidatesFromComments(
    node.comments?.nodes,
    viewer,
    row,
  );
  const threadNodes = node.reviewThreads?.nodes;
  if (!Array.isArray(threadNodes)) return issueComments;
  const reviewComments = threadNodes.flatMap((thread) =>
    isRecord(thread) && isRecord(thread.comments)
      ? candidatesFromComments(thread.comments.nodes, viewer, row)
      : [],
  );
  return [...issueComments, ...reviewComments];
}

export function projectOwnedNotifications(args: {
  data: Record<string, unknown>;
  lookups: GraphqlLookup[];
  rows: GithubNotificationRow[];
}): { items: GithubNotificationItem[]; login: string } {
  const viewer = isRecord(args.data.viewer)
    ? stringValue(args.data.viewer.login)
    : null;
  if (viewer === null)
    throw new Error("GitHub did not return the signed-in account.");
  const lookupByAlias = new Map(
    args.lookups.map((lookup) => [lookup.alias, lookup]),
  );
  const items: GithubNotificationItem[] = [];
  for (const [alias, lookup] of lookupByAlias) {
    const repositoryNode = args.data[alias];
    if (!isRecord(repositoryNode) || !isRecord(repositoryNode.resource))
      continue;
    const resource = repositoryNode.resource as GithubResourceNode;
    if (stringValue(resource.author?.login) !== viewer) continue;
    const rowIndex = Number(alias.replace("notification", ""));
    const row = args.rows[rowIndex];
    if (row === undefined) continue;
    const candidates = commentCandidates(resource, viewer, row).sort(
      (left, right) => Date.parse(right.at) - Date.parse(left.at),
    );
    const activity =
      candidates.find((candidate) => candidate.matchesLatestComment) ??
      candidates[0];
    if (activity === undefined) continue;
    const number =
      typeof resource.number === "number" ? resource.number : lookup.number;
    const title = stringValue(resource.title) ?? row.title;
    const url = stringValue(resource.url);
    if (!Number.isSafeInteger(number) || number <= 0 || url === null) continue;
    items.push({
      id: row.id,
      activity: activity.label,
      activityKind: activity.kind,
      actor: activity.actor || null,
      avatarUrl: activity.avatarUrl,
      eventKey: activity.eventKey,
      number,
      repo: row.repository,
      resolved: false,
      resourceKind: lookup.resourceKind,
      title,
      unread: row.unread,
      updatedAt: activity.at,
      url,
    });
  }
  items.sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
  return { items, login: viewer };
}
