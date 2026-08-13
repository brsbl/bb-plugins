export type ResourceKind = "issue" | "pr";
export type ActivityKind =
  | "approved"
  | "changes-requested"
  | "comment"
  | "mention"
  | "review";

export interface GithubNotificationRow {
  id: string;
  reason: string;
  repository: string;
  subjectType: string;
  subjectUrl: string;
  title: string;
  unread: boolean;
  updatedAt: string;
}

interface GithubActor {
  login?: unknown;
}

export interface GithubCommentNode {
  author?: GithubActor | null;
  bodyText?: unknown;
  createdAt?: unknown;
}

export interface GithubReviewNode {
  author?: GithubActor | null;
  state?: unknown;
  submittedAt?: unknown;
}

export interface GithubResourceNode {
  author?: GithubActor | null;
  comments?: { nodes?: unknown } | null;
  number?: unknown;
  reviews?: { nodes?: unknown } | null;
  title?: unknown;
  updatedAt?: unknown;
  url?: unknown;
}

export interface GithubNotificationItem {
  id: string;
  activity: string;
  activityKind: ActivityKind;
  actor: string | null;
  number: number;
  repo: string;
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

export function parseNotificationRows(raw: unknown): GithubNotificationRow[] {
  if (!Array.isArray(raw)) {
    throw new Error("GitHub returned an invalid notifications response.");
  }
  return raw.flatMap((entry) => {
    if (!isRecord(entry) || !isRecord(entry.repository) || !isRecord(entry.subject)) {
      return [];
    }
    const id = stringValue(entry.id);
    const reason = stringValue(entry.reason);
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
      (subjectType !== "Issue" && subjectType !== "PullRequest")
    ) {
      return [];
    }
    return [{
      id,
      reason,
      repository,
      subjectType,
      subjectUrl,
      title,
      unread: entry.unread === true,
      updatedAt,
    }];
  });
}

export function buildGraphqlQuery(rows: GithubNotificationRow[]): {
  query: string;
  lookups: GraphqlLookup[];
} {
  const lookups = rows.flatMap((row, index): GraphqlLookup[] => {
    const [owner, repoName, ...rest] = row.repository.split("/");
    const number = parseNumberFromSubjectUrl(row.subjectUrl);
    if (!owner || !repoName || rest.length > 0 || number === null) return [];
    return [{
      alias: `notification${index}`,
      number,
      owner,
      repoName,
      resourceKind: row.subjectType === "PullRequest" ? "pr" : "issue",
    }];
  });
  const fields = lookups.map((lookup) => {
    const resourceField = lookup.resourceKind === "pr" ? "pullRequest" : "issue";
    const reviews = lookup.resourceKind === "pr"
      ? "reviews(last: 20) { nodes { author { login } state submittedAt } }"
      : "";
    return `${lookup.alias}: repository(owner: ${JSON.stringify(lookup.owner)}, name: ${JSON.stringify(lookup.repoName)}) {
      resource: ${resourceField}(number: ${lookup.number}) {
        author { login }
        number
        title
        updatedAt
        url
        comments(last: 20) { nodes { author { login } bodyText createdAt } }
        ${reviews}
      }
    }`;
  });
  return {
    lookups,
    query: `query GithubNotifications { viewer { login } ${fields.join("\n")} }`,
  };
}

interface ActivityCandidate {
  actor: string;
  at: string;
  kind: ActivityKind;
  label: string;
}

function dateValue(value: unknown): string | null {
  const candidate = stringValue(value);
  if (candidate === null || !Number.isFinite(Date.parse(candidate))) return null;
  return candidate;
}

function includesMention(body: string, viewer: string): boolean {
  return body.toLocaleLowerCase().includes(`@${viewer.toLocaleLowerCase()}`);
}

function commentCandidates(
  node: GithubResourceNode,
  viewer: string,
  reason: string,
): ActivityCandidate[] {
  const rawNodes = node.comments?.nodes;
  if (!Array.isArray(rawNodes)) return [];
  return rawNodes.flatMap((entry): ActivityCandidate[] => {
    if (!isRecord(entry)) return [];
    const comment = entry as GithubCommentNode;
    const actor = stringValue(comment.author?.login);
    const at = dateValue(comment.createdAt);
    if (actor === null || at === null || actor === viewer) return [];
    const body = typeof comment.bodyText === "string" ? comment.bodyText : "";
    const mention = reason === "mention" || reason === "team_mention" || includesMention(body, viewer);
    return [{
      actor,
      at,
      kind: mention ? "mention" : "comment",
      label: mention ? "Mention" : "New comment",
    }];
  });
}

function reviewCandidates(
  node: GithubResourceNode,
  viewer: string,
): ActivityCandidate[] {
  const rawNodes = node.reviews?.nodes;
  if (!Array.isArray(rawNodes)) return [];
  return rawNodes.flatMap((entry): ActivityCandidate[] => {
    if (!isRecord(entry)) return [];
    const review = entry as GithubReviewNode;
    const actor = stringValue(review.author?.login);
    const at = dateValue(review.submittedAt);
    const state = stringValue(review.state)?.toLocaleUpperCase();
    if (actor === null || at === null || actor === viewer) return [];
    if (state === "APPROVED") {
      return [{ actor, at, kind: "approved", label: "Approved" }];
    }
    if (state === "CHANGES_REQUESTED") {
      return [{ actor, at, kind: "changes-requested", label: "Changes requested" }];
    }
    return [{ actor, at, kind: "review", label: "New review" }];
  });
}

export function projectOwnedNotifications(args: {
  data: Record<string, unknown>;
  lookups: GraphqlLookup[];
  rows: GithubNotificationRow[];
}): { items: GithubNotificationItem[]; login: string } {
  const viewer = isRecord(args.data.viewer)
    ? stringValue(args.data.viewer.login)
    : null;
  if (viewer === null) throw new Error("GitHub did not return the signed-in account.");
  const lookupByAlias = new Map(args.lookups.map((lookup) => [lookup.alias, lookup]));
  const items: GithubNotificationItem[] = [];
  for (const [alias, lookup] of lookupByAlias) {
    const repositoryNode = args.data[alias];
    if (!isRecord(repositoryNode) || !isRecord(repositoryNode.resource)) continue;
    const resource = repositoryNode.resource as GithubResourceNode;
    if (stringValue(resource.author?.login) !== viewer) continue;
    const rowIndex = Number(alias.replace("notification", ""));
    const row = args.rows[rowIndex];
    if (row === undefined) continue;
    const candidates = [
      ...commentCandidates(resource, viewer, row.reason),
      ...reviewCandidates(resource, viewer),
    ].sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
    let activity = candidates[0];
    if (
      activity === undefined &&
      (row.reason === "mention" || row.reason === "team_mention")
    ) {
      activity = {
        actor: "",
        at: row.updatedAt,
        kind: "mention",
        label: "Mention",
      };
    }
    if (activity === undefined) continue;
    const number = typeof resource.number === "number" ? resource.number : lookup.number;
    const title = stringValue(resource.title) ?? row.title;
    const url = stringValue(resource.url);
    if (!Number.isSafeInteger(number) || number <= 0 || url === null) continue;
    items.push({
      id: row.id,
      activity: activity.label,
      activityKind: activity.kind,
      actor: activity.actor || null,
      number,
      repo: row.repository,
      resourceKind: lookup.resourceKind,
      title,
      unread: row.unread,
      updatedAt: activity.at,
      url,
    });
  }
  items.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  return { items, login: viewer };
}
