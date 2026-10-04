import { Children, useCallback, useEffect, useRef, useState, useLayoutEffect, useSyncExternalStore, type ReactNode, useId } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  definePluginApp,
  experimental_Icon as Icon,
  useBbNavigate,
  useComposer,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type PluginMessageDirectiveProps,
} from "@get-bb/plugin-sdk/app";

import type { rpcContract } from "./contracts.js";
import type { Connection, DigestDefinition, Issue, SaveDigest } from "./model.js";
import { Button } from "./components/ui/button.js";
import { Switch } from "./components/ui/switch.js";
import "./app.css";

type Overview = {
  definitions: DigestDefinition[];
  connections: Connection[];
  actionCardsAvailable: boolean;
  organizerReady: boolean;
  startingIds?: string[];
  runErrors?: Record<string, string>;
};

function richText(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const parts: ReactNode[] = [];
    let offset = 0;
    for (const match of child.matchAll(/==([^=\n]+)==|:(chip|gain)\[([^\]\n]+)\]/gu)) {
      parts.push(child.slice(offset, match.index));
      parts.push(match[1] !== undefined
        ? <mark key={match.index}>{match[1]}</mark>
        : <span key={match.index} className={`digest-${match[2]}`}>{match[3]}</span>);
      offset = match.index + match[0].length;
    }
    parts.push(child.slice(offset));
    return parts;
  });
}

function safeLink(value: string): string {
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? value : "";
  } catch {
    return "";
  }
}

function NewsletterLink({ children, href }: { children?: ReactNode; href?: string }) {
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer">{richText(children)}</a>
    : <span>{richText(children)}</span>;
}

function NewsletterHeading({ children }: { children?: ReactNode }) {
  const text = Children.toArray(children).filter((child) => typeof child === "string").join("");
  return <h3 className={/^(the rest|in brief|coming up)$/iu.test(text) ? "digest-routine-heading" : undefined}>{richText(children)}</h3>;
}

const newsletterComponents: Components = {
  a: NewsletterLink,
  p: ({ children, node }) => {
    const actions = !!node?.children.length && node.children.every((part) =>
      part.type === "text" ? /^[\s·|]*$/u.test(part.value) : part.type === "element" && (
        part.tagName === "a" || (part.tagName === "strong" && part.children.every((child) => child.type === "element" && child.tagName === "a"))
      ));
    return <p className={actions ? "digest-item-actions" : undefined}>{richText(children)}</p>;
  },
  strong: ({ children }) => <strong>{richText(children)}</strong>,
  em: ({ children }) => <em>{richText(children)}</em>,
  del: ({ children }) => <del>{richText(children)}</del>,
  li: ({ children }) => <li>{richText(children)}</li>,
  blockquote: ({ children }) => <blockquote>{richText(children)}</blockquote>,
  h1: NewsletterHeading,
  h2: NewsletterHeading,
  h3: NewsletterHeading,
  h4: NewsletterHeading,
  h5: NewsletterHeading,
  h6: NewsletterHeading,
  td: ({ children }) => <td>{richText(children)}</td>,
  th: ({ children }) => <th>{richText(children)}</th>,
};

function NewsletterText({ content, className = "" }: { content: string; className?: string }) {
  return <div className={`digest-rich ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={newsletterComponents}
      skipHtml
      allowedElements={["p", "br", "strong", "em", "del", "a", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "code", "pre", "hr", "table", "thead", "tbody", "tr", "td", "th"]}
      urlTransform={safeLink}
    >{content}</ReactMarkdown>
  </div>;
}

function useReconnectRefresh(refresh: () => void) {
  const connection = useRealtimeConnectionState();
  const previous = useRef(connection);
  useEffect(() => {
    if (connection === "connected" && previous.current !== "connected") refresh();
    previous.current = connection;
  }, [connection, refresh]);
}

// A retried issue can have several historical directives plus a recovery banner.
// Keep one mounted presentation, preferring a timeline directive over the banner.
const issuePlacements = new Map<string, Map<symbol, number>>();
const placementListeners = new Set<() => void>();
const subscribePlacements = (listener: () => void) => { placementListeners.add(listener); return () => { placementListeners.delete(listener); }; };
function useIssuePlacement(threadId: string | null, issueId: string | undefined, priority = 0) {
  const [token] = useState(() => Symbol());
  const key = threadId && issueId ? `${threadId}:${issueId}` : null;
  useLayoutEffect(() => {
    if (!key) return;
    const owners = issuePlacements.get(key) ?? new Map<symbol, number>();
    issuePlacements.set(key, owners);
    owners.set(token, priority);
    placementListeners.forEach((listener) => listener());
    return () => {
      owners.delete(token);
      if (!owners.size) issuePlacements.delete(key);
      placementListeners.forEach((listener) => listener());
    };
  }, [key, token, priority]);
  return useSyncExternalStore(subscribePlacements, () => {
    if (!key) return false;
    const owners = issuePlacements.get(key);
    let winner: symbol | undefined;
    let best = Infinity;
    owners?.forEach((rank, owner) => { if (rank < best) { winner = owner; best = rank; } });
    return winner === token;
  }, () => false);
}

function DigestIssue({ attributes, message }: PluginMessageDirectiveProps) {
  const rpc = useRpc<typeof rpcContract>();
  const id = attributes.id?.trim();
  const visible = useIssuePlacement(message.threadId, id);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loadError, setLoadError] = useState(false);
  const generation = useRef(0);

  const load = useCallback(async () => {
    if (!id) return;
    const request = ++generation.current;
    try {
      const next = await rpc.call("getIssue", { threadId: message.threadId, id });
      if (generation.current !== request) return;
      setIssue(next);
      setLoadError(false);
    } catch {
      if (generation.current === request) setLoadError(true);
    }
  }, [id, message.threadId, rpc]);

  useEffect(() => {
    setIssue(null);
    setLoadError(false);
    void load();
    return () => { generation.current += 1; };
  }, [load]);
  useRealtime("issues", () => { void load(); });
  useReconnectRefresh(load);

  if (!id) {
    return <div className="digest-issue" role="alert">This digest is missing its issue reference. Ask the publishing thread to publish it again.</div>;
  }
  if (!visible) return null;
  if (!issue) {
    return (
      <div className="digest-issue">
        {loadError ? <>
          <p role="alert">This issue couldn’t be loaded. Check that bb is running and try again.</p>
          <button type="button" className="digest-text-action digest-text-primary" onClick={() => { void load(); }}>Retry</button>
        </> : <p className="digest-muted" role="status">Loading digest…</p>}
      </div>
    );
  }
  return <IssueSummary key={issue.id} issue={issue} threadId={message.threadId} loadError={loadError} refresh={load} />;
}

function RecoveryBanner() {
  const rpc = useRpc<typeof rpcContract>();
  const composer = useComposer();
  const threadId = composer.scope.kind === "thread" ? composer.scope.threadId : null;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loadError, setLoadError] = useState(false);
  const visible = useIssuePlacement(threadId, issue?.id, 1);
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!threadId) return;
    const request = ++generation.current;
    try {
      const result = await rpc.call("recoveryIssue", { threadId });
      if (generation.current !== request) return;
      setIssue(result);
      setLoadError(false);
    } catch {
      if (generation.current === request) setLoadError(true);
    }
  }, [rpc, threadId]);
  useEffect(() => {
    setIssue(null);
    setLoadError(false);
    void load();
    return () => { generation.current += 1; };
  }, [load]);
  useRealtime("issues", () => { void load(); });
  useReconnectRefresh(load);
  if (!visible || !threadId || !issue || issue.threadId !== threadId) return null;
  return <IssueSummary key={issue.id} issue={issue} threadId={threadId} loadError={loadError} refresh={load} />;
}

type Brief = NonNullable<Issue["brief"]>;
type Tone = NonNullable<Brief["tone"]>;
type EmailRow = NonNullable<Brief["all"]>["items"][number];

function headingTone(brief: Brief): Tone {
  return brief.tone ?? (/needs you|attention/iu.test(brief.heading) ? "warning" : "neutral");
}

function CountLabel({ label, count, parse = true }: { label: string; count?: number; parse?: boolean }) {
  const match = parse ? label.match(/^(.*?)\s*\((\d+)\)$/u) ?? label.match(/^(.*?)\s+(\d+)$/u) : null;
  const leading = parse ? label.match(/^(\d+)\s+(.+)$/u) : null;
  const text = match ? match[1]!.trim() : leading ? leading[2]! : label;
  const value = count ?? (match ? Number(match[2]) : leading ? Number(leading[1]) : undefined);
  return <>{leading && value !== undefined && <><span className="digest-count">{value}</span>{" "}</>}<span>{text}</span>{!leading && value !== undefined && <>{" "}<span className="digest-count">{value}</span></>}</>;
}

function SectionIcon({ tone = "neutral" }: { tone?: Tone }) {
  return <Icon name={tone === "success" ? "CircleCheck" : tone === "danger" ? "ShieldAlert" : tone === "warning" ? "AlertTriangle" : "Mail"} className="digest-section-icon" aria-hidden />;
}

function emailParts(item: EmailRow) {
  const separator = item.title.indexOf(" · ");
  return {
    sender: item.sender ?? (separator > 0 ? item.title.slice(0, separator) : ""),
    subject: item.subject ?? (separator > 0 ? item.title.slice(separator + 3) : item.title),
  };
}

function EmailList({ items }: { items: EmailRow[] }) {
  const navigate = useBbNavigate();
  const groups = new Map<string, EmailRow[]>();
  for (const item of items) {
    const sender = emailParts(item).sender.toLocaleLowerCase();
    if (sender) {
      const group = groups.get(sender);
      if (group) group.push(item);
      else groups.set(sender, [item]);
    }
  }
  const shown = new Set<string>();
  const row = (item: EmailRow, grouped = false) => {
    const { sender, subject } = emailParts(item);
    return <a className="digest-email-row" data-sender={Boolean(sender) && !grouped} href={safeLink(item.url)}
      title={[sender, subject, item.text].filter(Boolean).join(" · ")}
      aria-label={[sender, subject, item.text].filter(Boolean).join(" · ")}
      onClick={(event) => { event.preventDefault(); if (safeLink(item.url)) navigate.openUrl(item.url); }}>
      {sender && !grouped && <span className="digest-email-sender">{sender}</span>}
      <span className="digest-email-subject">{subject}</span>
      {item.text && <span className="digest-email-detail">{item.text}</span>}
    </a>;
  };
  return <ul className="digest-email-list">{items.map((item, index) => {
    const { sender } = emailParts(item);
    const key = sender.toLocaleLowerCase();
    const group = groups.get(key);
    if (group && group.length >= 3) {
      if (shown.has(key)) return null;
      shown.add(key);
      return <li key={index}><details className="digest-sender-group"><summary aria-label={`${sender}, ${group.length} emails`}>
        <Icon name="ChevronRight" className="digest-chevron" aria-hidden /><CountLabel label={sender} count={group.length} parse={false} />
      </summary><ul>{group.map((mail, child) => <li key={child}>{row(mail, true)}</li>)}</ul></details></li>;
    }
    return <li key={index}>{row(item)}</li>;
  })}</ul>;
}

function BriefCards({ brief, headline, prefix }: { brief: NonNullable<Issue["brief"]>; headline: string; prefix: string }) {
  const navigate = useBbNavigate();
  const open = (url: string) => { if (safeLink(url)) navigate.openUrl(url); };
  const tone = headingTone(brief);
  return <div className="digest-brief">
    {brief.items.length > 0 && <><h3 id={`${prefix}-items`} className="digest-section-heading" data-tone={tone} tabIndex={-1}><SectionIcon tone={tone} /><CountLabel label={brief.heading} count={brief.items.length} /></h3><ol className="digest-cards">
      {brief.items.map((item, index) => {
        const deadline = item.deadline?.trim();
        const repeatsHeadline = deadline && /^(?:due )?(today|this week)$/iu.test(deadline)
          && headline.toLowerCase().includes(deadline.replace(/^due /iu, "").toLowerCase());
        return <li className="digest-card" data-urgency={item.urgency ?? "later"} data-tone={item.tone ?? tone} key={index}>
        <span className="digest-card-number" aria-hidden>{index + 1}</span>
        <div className="digest-card-content">
          <div className="digest-card-heading"><h4>{item.title}</h4>{item.context && <span className="digest-chip">{item.context}</span>}
            {deadline && !repeatsHeadline && <span className="digest-urgency">{deadline}</span>}</div>
          {item.text && <p title={item.text}>{item.text}</p>}
          <div className="digest-card-actions">
            {item.secondaryAction && <Button variant="ghost" onClick={() => open(item.secondaryAction!.url)}>{item.secondaryAction.label}</Button>}
            <Button variant="default" onClick={() => open(item.action.url)}>{item.action.label}</Button>
          </div>
        </div>
      </li>; })}
    </ol></>}
    {brief.later.length > 0 && <div className="digest-later"><h3 id={`${prefix}-later`} className="digest-section-heading" data-tone="neutral" tabIndex={-1}><SectionIcon /><CountLabel label={brief.laterLabel} count={brief.later.length} /></h3><ul>{brief.later.map((item, index) => <li key={index}><span>{item.title}</span>{item.action && <Button variant="ghost" onClick={() => open(item.action!.url)}>{item.action.label}</Button>}</li>)}</ul></div>}
    {brief.tail && <details className="digest-more" id={`${prefix}-tail`} data-tone="neutral"><summary>
      <Icon name="ChevronRight" className="digest-chevron" aria-hidden /><SectionIcon /><CountLabel label={brief.tail.label} count={brief.tail.items?.length} />
    </summary>{brief.tail.items?.length ? <EmailList items={brief.tail.items} /> : <NewsletterText content={brief.tail.details} />}</details>}
    {brief.all && <details className="digest-more" id={`${prefix}-all`} data-tone="neutral"><summary>
      <Icon name="ChevronRight" className="digest-chevron" aria-hidden /><SectionIcon /><CountLabel label={brief.all.label} count={brief.all.items.length} />
    </summary><EmailList items={brief.all.items} /></details>}
  </div>;
}

function EmailReadStatus({ issue }: { issue: Issue }) {
  if (!issue.emailReads?.length || issue.state === "collecting") return null;
  const uncertain = issue.emailReads.filter((read) => read.wasUnread && read.afterReading === "keep-unread" && read.status !== "restored-unread");
  if (uncertain.length) return <div className="digest-read-warning" role="alert">
    <p>Couldn’t confirm {uncertain.length === 1 ? "1 email is" : `${uncertain.length} emails are`} unread again. Check these in Gmail and mark them unread if needed.</p>
    <ul>{uncertain.map((read) => <li key={read.messageId}>{read.url ? <NewsletterLink href={safeLink(read.url)}>{read.title ?? "Review email"}</NewsletterLink> : read.title ?? "Email with an unconfirmed unread state"}</li>)}</ul>
  </div>;
  const kept = issue.emailReads.filter((read) => read.status === "restored-unread").length;
  const left = issue.emailReads.filter((read) => read.status === "left-read").length;
  const unchanged = issue.emailReads.filter((read) => read.status === "unchanged-read").length;
  return <p className="digest-read-status">{[kept && `${kept} restored to unread`, left && `${left} left read`, unchanged && `${unchanged} already read`].filter(Boolean).join(" · ")}</p>;
}

function IssueSummary({ issue: savedIssue, threadId, loadError, refresh }: {
  issue: Issue;
  threadId: string;
  loadError: boolean;
  refresh: () => Promise<void>;
}) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const prefix = useId();
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<"retry" | "reconnect" | null>(null);
  const issue = pending === "retry" ? { ...savedIssue, state: "collecting" as const, headline: "Preparing your digest", lede: "" } : savedIssue;
  const [mainContent, ...extraContent] = issue.details.split(/\r?\n[ \t]*<!-- more -->[ \t]*\r?\n/u);
  const moreContent = extraContent.join("\n\n");
  const recover = async (action: "retry" | "reconnect") => {
    if (pending) return;
    setPending(action);
    setActionError(null);
    setNotice(null);
    try {
      const input = { threadId, id: issue.id };
      if (action === "reconnect") {
        const result = await rpc.call("reconnect", input);
        setNotice(result.message);
      } else {
        const result = await rpc.call("retry", input);
        navigate.toThread(result.threadId);
        await refresh();
      }
    } catch (error) {
      setActionError(error instanceof Error && error.message.trim() ? error.message : action === "reconnect"
        ? "Couldn’t open your connection. Check that bb is running, then try Reconnect again."
        : "Couldn’t retry this digest. Check that bb is running, then try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <article className="digest-issue" aria-label="Digest summary" data-state={issue.state}>
      <h2 className="digest-headline">{issue.state === "failed" && <Icon name="AlertTriangle" className="digest-warning-icon" aria-hidden />}<span>{issue.headline}</span></h2>
      {issue.brief?.summaryLinks?.length && issue.state === "ready" ? <div className="digest-lede digest-summary-links">{issue.brief.summaryLinks.map((link, index) => <span key={index}>
        {index > 0 && <span aria-hidden> · </span>}{"section" in link ? <a aria-label={link.label} data-tone={link.section === "items" ? headingTone(issue.brief!) : "neutral"} href={`#${prefix}-${link.section}`} onClick={(event) => {
          event.preventDefault();
          const target = document.getElementById(`${prefix}-${link.section}`);
          if (target instanceof HTMLDetailsElement) target.open = true;
          const focus = target?.querySelector("summary") ?? target;
          focus?.scrollIntoView?.({ block: "nearest" });
          (focus as HTMLElement | null)?.focus();
        }}><CountLabel label={link.label} /></a> : <span><CountLabel label={link.label} /></span>}
      </span>)}</div> : issue.lede?.trim() && <NewsletterText className="digest-lede" content={issue.lede} />}
      {issue.state === "collecting" && <p className="digest-muted" role="status">Gathering your updates. This summary will update here.</p>}
      {issue.brief && issue.state === "ready" && <BriefCards brief={issue.brief} headline={issue.headline} prefix={prefix} />}
      <EmailReadStatus issue={issue} />
      {(!issue.brief || issue.state === "failed") && mainContent?.trim() && issue.state !== "collecting" && <NewsletterText className="digest-story" content={mainContent} />}
      {!issue.brief && moreContent.trim() && <details className="digest-more">
        <summary><Icon name="ChevronRight" className="digest-chevron" aria-hidden /><SectionIcon />More detail</summary>
        <NewsletterText content={moreContent} />
      </details>}
      {issue.state === "failed" && <div className="digest-recovery">
        {issue.recovery === "upgrade" && <p>Update bb on your desktop and connected server to 0.45.0 or later, then retry. Your existing browser sign-ins can be reused after the update.</p>}
        <div className="digest-controls">
          {issue.recovery === "reconnect" && <button type="button" className="digest-button digest-button-default" disabled={pending !== null} onClick={() => { void recover("reconnect"); }}>
            {pending === "reconnect" ? "Opening…" : "Reconnect"}
          </button>}
          <button type="button" className={`digest-button ${issue.recovery === "reconnect" ? "digest-button-ghost" : "digest-button-default"}`} disabled={pending !== null} onClick={() => { void recover("retry"); }}>
            {pending === "retry" ? "Retrying…" : "Retry"}
          </button>
        </div>
      </div>}
      {actionError && <p className="digest-error" role="alert">{actionError}</p>}
      {notice && <p className="digest-muted" role="status">{notice}</p>}
      {loadError && <div className="digest-refresh-error" role="alert">
        <span>Couldn’t refresh this issue. The last saved summary is shown.</span>
        <button type="button" className="digest-text-action digest-text-primary" onClick={() => { void refresh(); }}>Retry</button>
      </div>}
    </article>
  );
}

function scheduleLabel(schedule: DigestDefinition["schedule"]): string {
  if (!schedule) return "Published by another thread";
  const [minute, hour, day, month, weekday, extra] = schedule.cron.trim().split(/\s+/u);
  const zone = schedule.timezone === "America/Los_Angeles" ? "PT" : schedule.timezone;
  if (!extra && /^\d+$/u.test(minute ?? "") && /^\d+$/u.test(hour ?? "") && day === "*" && month === "*") {
    const days: Record<string, string> = { "*": "Daily", "1-5": "Weekdays", "0": "Sundays", "1": "Mondays", "2": "Tuesdays", "3": "Wednesdays", "4": "Thursdays", "5": "Fridays", "6": "Saturdays", "7": "Sundays" };
    if (weekday && days[weekday] && Number(hour) < 24 && Number(minute) < 60) {
      const hourNumber = Number(hour);
      const minutes = Number(minute) === 0 ? "" : `:${minute!.padStart(2, "0")}`;
      return `${days[weekday]} · ${hourNumber % 12 || 12}${minutes}${hourNumber < 12 ? "am" : "pm"} ${zone}`;
    }
  }
  return `${schedule.cron} · ${zone}`;
}

const DAYS = [["1-5", "Weekdays"], ["*", "Every day"], ["1", "Mondays"], ["2", "Tuesdays"], ["3", "Wednesdays"], ["4", "Thursdays"], ["5", "Fridays"], ["6", "Saturdays"], ["0", "Sundays"]];

function DigestForm({ connection, definition, pending, onCancel, onSave }: {
  connection: Connection; definition?: DigestDefinition; pending: boolean; onCancel: () => void;
  onSave: (input: SaveDigest) => Promise<void>;
}) {
  const formId = useId();
  const rpc = useRpc<typeof rpcContract>();
  const [execution, setExecution] = useState(definition?.execution ?? null);
  const [options, setOptions] = useState<{ projects: Array<{ id: string; name: string; kind: string }>; hosts: Array<{ id: string; name: string }>; environments: Array<{ id: string; name: string; projectId: string; hostId: string | null }> } | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const loadExecution = () => { void rpc.call("executionOptions", {}).then(setOptions).catch(() => setExecutionError("Couldn’t load computers and workspaces. Close and reopen this form to try again.")); };
  const [name, setName] = useState(definition?.name ?? "");
  const [instructions, setInstructions] = useState(definition?.instructions ?? "");
  const [afterReading, setAfterReading] = useState<NonNullable<DigestDefinition["afterReading"]>>(definition?.afterReading ?? "keep-unread");
  const [minute = "0", hour = "10", day = "*", month = "*", weekday = "1-5"] = definition?.schedule?.cron.split(/\s+/u) ?? [];
  const simpleSchedule = day === "*" && month === "*" && DAYS.some(([value]) => value === weekday) && /^\d+$/u.test(hour) && /^\d+$/u.test(minute);
  const [frequency, setFrequency] = useState(simpleSchedule ? weekday : "custom");
  const [time, setTime] = useState(`${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  const publishOnly = !!definition && !definition.schedule;
  const times = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);
  if (!times.includes(time)) times.push(time);
  return <form className="digest-form" onSubmit={(event) => {
    event.preventDefault();
    const [hours, minutes] = time.split(":");
    void onSave({ ...(definition ? { id: definition.id } : {}), connectionId: connection.id, name, instructions, ...(execution || definition?.execution ? { execution } : {}),
      ...(connection.id === "gmail" ? { afterReading } : {}),
      schedule: publishOnly ? null : frequency === "custom" ? definition!.schedule : { cron: `${Number(minutes)} ${Number(hours)} * * ${frequency}`, timezone: definition?.schedule?.timezone ?? "America/Los_Angeles" } });
  }}>
    <label htmlFor={`${formId}-name`}>Name</label>
    <input id={`${formId}-name`} autoFocus required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Unread email" />
    <label htmlFor={`${formId}-prompt`}>What should it tell you?</label>
    <textarea id={`${formId}-prompt`} required maxLength={30000} rows={4} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder={`e.g. ${connection.id === "gmail" ? "Unread emails that need a reply, newest first. Skip newsletters and recruiting." : `The updates from ${connection.name} that need my attention.`}`} />
    {!publishOnly && <div className="digest-schedule-fields"><label htmlFor={`${formId}-days`}>When</label>
      <select id={`${formId}-days`} value={frequency} onChange={(event) => setFrequency(event.target.value)}>
        {!simpleSchedule && <option value="custom">Keep current schedule</option>}{DAYS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>
      {frequency !== "custom" && <><span>at</span><select aria-label="Time" value={time} onChange={(event) => setTime(event.target.value)}>{times.sort().map((value) => { const [h, m] = value.split(":"); const n = Number(h); return <option key={value} value={value}>{n % 12 || 12}:{m} {n < 12 ? "AM" : "PM"}</option>; })}</select><span>{definition?.schedule?.timezone && definition.schedule.timezone !== "America/Los_Angeles" ? definition.schedule.timezone : "PT"}</span></>}
    </div>}
    {connection.id === "gmail" && <><label htmlFor={`${formId}-after-reading`}>After reading</label>
      <select id={`${formId}-after-reading`} value={afterReading} onChange={(event) => setAfterReading(event.target.value as typeof afterReading)}>
        <option value="keep-unread">Keep unread (default)</option><option value="mark-read">Mark as read</option>
      </select><p className="digest-muted">Reads the full email and needed thread context. Keep unread restores messages that were unread before the run; already-read mail stays read.</p></>}
    <details className="digest-execution" onToggle={(event) => { if (event.currentTarget.open && !options) loadExecution(); }}>
      <summary>Where it runs</summary>
      <p className="digest-muted">Uses a Personal workspace on the computer with your browser sign-ins.</p>
      {executionError && <p className="digest-error" role="alert">{executionError}</p>}
      {options && <>
        <label htmlFor={`${formId}-project`}>Workspace</label>
        <select id={`${formId}-project`} value={execution?.projectId ?? ""} onChange={(event) => setExecution(event.target.value ? { projectId: event.target.value, hostId: execution?.hostId ?? connection.browserHostId ?? "" } : null)}>
          <option value="">Personal workspace (recommended)</option>
          {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        {execution && <>
          <label htmlFor={`${formId}-computer`}>Computer</label>
          <select id={`${formId}-computer`} required value={execution.hostId} onChange={(event) => setExecution({ projectId: execution.projectId, hostId: event.target.value })}>
            <option value="" disabled>Choose a computer</option>{options.hosts.map((host) => <option key={host.id} value={host.id}>{host.name}</option>)}
          </select>
          <label htmlFor={`${formId}-environment`}>Folder</label>
          <select id={`${formId}-environment`} value={execution.environmentId ?? ""} onChange={(event) => setExecution({ projectId: execution.projectId, hostId: execution.hostId, ...(event.target.value ? { environmentId: event.target.value } : {}) })}>
            <option value="">{options.projects.find((project) => project.id === execution.projectId)?.kind === "personal" ? "New Personal workspace" : "Project folder on this computer"}</option>
            {options.environments.filter((environment) => environment.projectId === execution.projectId && environment.hostId === execution.hostId).map((environment) => <option key={environment.id} value={environment.id}>{environment.name}</option>)}
          </select>
        </>}
      </>}
    </details>
    <div className="digest-form-actions"><Button variant="ghost" disabled={pending} onClick={onCancel}>Cancel</Button><Button variant="default" type="submit" disabled={pending}>{pending ? "Saving…" : definition ? "Save changes" : "Create digest"}</Button></div>
  </form>;
}

function DigestsSettings() {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ siteId: string; digestId?: string } | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [checkingSites, setCheckingSites] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean | null>(null);
  const generation = useRef(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    try {
      const result = await rpc.call("overview", {});
      if (generation.current !== request) return;
      setOverview(result);
      setError(null);
    } catch {
      if (generation.current === request) setError("Couldn’t load Digests settings. Check that bb is running and try again.");
    } finally {
      if (generation.current === request) setLoading(false);
    }
  }, [rpc]);
  useEffect(() => {
    let active = true;
    void load();
    void rpc.call("settingsPreferences", {}).then((preferences) => {
      if (active) setBannerDismissed(preferences.importBannerDismissed);
    }).catch(() => { if (active) setBannerDismissed(false); });
    // Short visits do no browser work. The service coalesces rapid reopenings.
    const timer = setTimeout(() => {
      setCheckingSites(true);
      void rpc.call("checkSettingsConnections", {}).then(async (connections) => {
        if (!active) return;
        await load();
        if (!active) return;
        const problem = connections.find((connection) => ["unavailable", "upgrade-required"].includes(connection.status));
        if (problem?.detail) setError(problem.detail);
      }).catch((error: unknown) => {
        if (active) setError(error instanceof Error ? error.message : "Couldn’t check your sites. Reopen Settings to try again.");
      }).finally(() => { if (active) setCheckingSites(false); });
    }, 300);
    return () => { active = false; clearTimeout(timer); generation.current += 1; };
  }, [load, rpc]);
  useRealtime("issues", () => { void load(); });
  useReconnectRefresh(load);

  const startingKey = overview?.startingIds?.join(",") ?? "";
  useEffect(() => {
    if (!startingKey) return;
    let active = true;
    const timer = setTimeout(() => {
      void Promise.all(startingKey.split(",").map(async (id) => {
        try {
          const result = await rpc.call("runStatus", { id });
          if (mounted.current && result.threadId) navigate.toThread(result.threadId);
        } catch { /* The persisted card error is loaded below. */ }
      })).finally(() => { if (active) void load(); });
    }, 1000);
    return () => { active = false; clearTimeout(timer); };
  }, [startingKey, overview, rpc, navigate, load]);

  const update = async (definition: DigestDefinition, action: "toggle" | "run") => {
    if (pending) return;
    setPending(definition.id);
    setError(null);
    setNotice(null);
    try {
      if (action === "toggle") {
        const updated = await rpc.call("setEnabled", { id: definition.id, enabled: !definition.enabled });
        setOverview((current) => current && { ...current, definitions: current.definitions.map((item) => item.id === updated.id ? updated : item) });
      } else {
        const result = await rpc.call("run", { id: definition.id });
        if (result.threadId) navigate.toThread(result.threadId);
        else if (result.pending) await load();
        else setError("Couldn’t start this digest. Retry from its card.");
      }
    } catch (error) {
      const message = error instanceof Error && error.message.trim() ? error.message : `Couldn’t start ${definition.name}. Check that bb is running and try again.`;
      if (action === "run") {
        await load();
        setOverview((current) => current && { ...current, runErrors: { ...current.runErrors, [definition.id]: current.runErrors?.[definition.id] ?? `Couldn’t reach bb to start ${definition.name}. Check your connection, then Retry.` } });
      } else setError(message);
    } finally {
      setPending(null);
    }
  };

  const dismissBanner = async () => {
    try {
      await rpc.call("dismissImportBanner", {});
      setBannerDismissed(true);
    } catch { setError("Couldn’t save your preference. Try dismissing the banner again."); }
  };
  const save = async (input: SaveDigest) => {
    if (pending) return;
    setPending("save"); setError(null); setNotice(null);
    try {
      const definition = await rpc.call("saveDigest", input);
      setEditing(null);
      if (!input.id) { setCreatedId(definition.id); setNotice(`${definition.name} is on. Run it now to preview your first issue.`); }
      await load();
    } catch (error) { await load(); setError(error instanceof Error ? error.message : "Couldn’t save this digest. Try again."); }
    finally { setPending(null); }
  };
  const sites = overview?.connections.filter((site) => site.status === "signed-in" || overview.definitions.some((definition) => definition.connectionIds.includes(site.id))) ?? [];

  return (
    <section className="digest-settings" aria-label="Digests">
      {error && <div className="digest-refresh-error" role="alert"><span>{error}</span><button type="button" className="digest-button" disabled={loading} onClick={() => { void load(); }}>Retry</button></div>}
      {notice && <p className="digest-muted" role="status">{notice}</p>}
      {!overview && !error && <p className="digest-muted" role="status">Loading Digests…</p>}
      {overview && <>
        <div className="digest-group-header"><h3>Your sites</h3><a className="digest-import-link" href="/settings/browser">Import logins →</a></div>
        {bannerDismissed === false && <div className="digest-import">
          <div><p>Digests read the sites you’re signed into in bb’s browser.</p>
          <a href="/settings/browser">Import logins in Browser settings →</a></div>
          <Button variant="ghost" aria-label="Dismiss login banner" onClick={() => { void dismissBanner(); }}><Icon name="X" aria-hidden /></Button>
        </div>}
        {checkingSites && <p className="digest-checking digest-muted" role="status">Checking sign-ins…</p>}
        <div className="digest-sites">{sites.map((site) => {
          const definitions = overview.definitions.filter((definition) => definition.connectionIds.includes(site.id));
          const signedOut = ["signed-out", "expired"].includes(site.status);
          return <section className="digest-site" key={site.id} aria-label={site.name}>
            <div className="digest-site-header"><div><h4>{site.name}</h4><span className="digest-site-account" data-status={site.status}>
              {site.status === "signed-in" ? site.accountName || "Signed in" : signedOut ? "Signed out" : site.status === "unknown" ? "Not checked" : "Browser unavailable"}
              {signedOut && <> · <a href="/settings/browser">Reconnect</a></>}
            </span></div><Button variant="ghost" disabled={pending !== null || editing !== null} onClick={() => setEditing({ siteId: site.id })}>+ Add digest</Button></div>
            {editing?.siteId === site.id && !editing.digestId && <DigestForm connection={site} pending={pending !== null} onCancel={() => setEditing(null)} onSave={save} />}
            <ul className="digest-nested-list">{definitions.map((definition) => <li className="digest-nested-item" key={definition.id}>
              {editing?.digestId === definition.id ? <DigestForm connection={site} definition={definition} pending={pending !== null} onCancel={() => setEditing(null)} onSave={save} /> : <div className="digest-definition">
                <button className="digest-edit" disabled={editing !== null || pending !== null} onClick={() => setEditing({ siteId: site.id, digestId: definition.id })} aria-label={`Edit ${definition.name}`} />
                <div className="digest-definition-top"><h5>{definition.name}</h5>
                  {definition.schedule && <Switch aria-label={`${definition.name} schedule`} checked={definition.enabled} disabled={pending !== null} onCheckedChange={() => { void update(definition, "toggle"); }} />}
                </div>
                <p className="digest-prompt-preview">{definition.instructions}</p>
                {overview.startingIds?.includes(definition.id) && <p className="digest-muted" role="status">Starting this issue…</p>}
                {!overview.startingIds?.includes(definition.id) && overview.runErrors?.[definition.id] && <div className="digest-run-error" role="alert"><span>{overview.runErrors[definition.id]}</span><Button disabled={pending !== null} onClick={() => { void update(definition, "run"); }}>Retry</Button></div>}
                <div className="digest-definition-footer">{definition.schedule
                  ? <span className="digest-schedule-label"><Icon name="Calendar" className="digest-schedule-icon" aria-hidden /> {scheduleLabel(definition.schedule)}</span>
                  : <small>{definition.id === "x-scorecard" ? "Published by your X analytics thread" : "Published by another thread"}</small>}
                  {definition.schedule && <Button aria-label={`Run ${definition.name} now`} disabled={pending !== null || overview.startingIds?.includes(definition.id)} onClick={() => { void update(definition, "run"); }}>{createdId === definition.id ? "Run now to preview" : "Run now"}</Button>}
                </div>
              </div>}
            </li>)}</ul>
            {definitions.length === 0 && editing?.siteId !== site.id && <p className="digest-no-digests digest-muted">No digests yet</p>}
          </section>;
        })}</div>
      </>}
    </section>
  );
}

export default definePluginApp((app) => {
  app.slots.messageDirective({ id: "digest-issue", component: DigestIssue });
  app.slots.settingsSection({ id: "digests", component: DigestsSettings });
  app.composer.customize({
    id: "digest-recovery",
    banners: [{ id: "failed-issue", chrome: "bare", component: RecoveryBanner }],
  });
});
