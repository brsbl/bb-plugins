import { Children, useCallback, useEffect, useRef, useState, type ReactNode, useId } from "react";
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

import { defaultDigestEmoji, digestEmoji } from "./identity.js";
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

function DigestIssue({ attributes, message }: PluginMessageDirectiveProps) {
  const rpc = useRpc<typeof rpcContract>();
  const id = attributes.id?.trim();
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
  if (!threadId || !issue || issue.threadId !== threadId) return null;
  return <IssueSummary key={issue.id} issue={issue} threadId={threadId} loadError={loadError} refresh={load} />;
}

function BriefCards({ brief, headline }: { brief: NonNullable<Issue["brief"]>; headline: string }) {
  const navigate = useBbNavigate();
  const open = (url: string) => { if (safeLink(url)) navigate.openUrl(url); };
  return <div className="digest-brief">
    {brief.items.length > 0 && <><h3>{brief.heading}</h3><ol className="digest-cards">
      {brief.items.map((item, index) => {
        const deadline = item.deadline?.trim();
        const repeatsHeadline = deadline && /^(?:due )?(today|this week)$/iu.test(deadline)
          && headline.toLowerCase().includes(deadline.replace(/^due /iu, "").toLowerCase());
        return <li className="digest-card" data-urgency={item.urgency ?? "later"} key={index}>
        <span className="digest-card-number" aria-hidden>{index + 1}</span>
        <div className="digest-card-content">
          <div className="digest-card-heading"><h4>{item.title}</h4>{item.context && <span className="digest-chip">{item.context}</span>}
            {deadline && !repeatsHeadline && <span className="digest-urgency">{deadline}</span>}</div>
          {item.text && <p>{item.text}</p>}
          <div className="digest-card-actions">
            {item.secondaryAction && <Button variant="ghost" onClick={() => open(item.secondaryAction!.url)}>{item.secondaryAction.label}</Button>}
            <Button variant="default" onClick={() => open(item.action.url)}>{item.action.label}</Button>
          </div>
        </div>
      </li>; })}
    </ol></>}
    {brief.later.length > 0 && <div className="digest-later"><h3>{brief.laterLabel}</h3><ul>{brief.later.map((item, index) => <li key={index}><span>{item.title}</span>{item.action && <Button variant="ghost" onClick={() => open(item.action!.url)}>{item.action.label}</Button>}</li>)}</ul></div>}
    {brief.tail && <details className="digest-more"><summary>{brief.tail.label}</summary><NewsletterText content={brief.tail.details} /></details>}
  </div>;
}

function IssueSummary({ issue, threadId, loadError, refresh }: {
  issue: Issue;
  threadId: string;
  loadError: boolean;
  refresh: () => Promise<void>;
}) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<"retry" | "reconnect" | null>(null);
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
        setNotice("Retrying this issue.");
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
      {issue.lede?.trim() && <NewsletterText className="digest-lede" content={issue.lede} />}
      {issue.state === "collecting" && <p className="digest-muted" role="status">Gathering your updates. This summary will update here.</p>}
      {issue.brief && issue.state === "ready" && <BriefCards brief={issue.brief} headline={issue.headline} />}
      {(!issue.brief || issue.state === "failed") && mainContent?.trim() && issue.state !== "collecting" && <NewsletterText className="digest-story" content={mainContent} />}
      {!issue.brief && moreContent.trim() && <details className="digest-more">
        <summary>More detail</summary>
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
  const [emoji, setEmoji] = useState(definition ? digestEmoji(definition) : defaultDigestEmoji(connection.id));
  const [name, setName] = useState(definition?.name ?? "");
  const [instructions, setInstructions] = useState(definition?.instructions ?? "");
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
    void onSave({ ...(definition ? { id: definition.id } : {}), connectionId: connection.id, name, emoji, instructions,
      schedule: publishOnly ? null : frequency === "custom" ? definition!.schedule : { cron: `${Number(minutes)} ${Number(hours)} * * ${frequency}`, timezone: definition?.schedule?.timezone ?? "America/Los_Angeles" } });
  }}>
    <div className="digest-identity-fields">
      <div><label htmlFor={`${formId}-emoji`}>Emoji</label><input id={`${formId}-emoji`} className="digest-emoji-input" required maxLength={32} value={emoji} onChange={(event) => setEmoji(event.target.value)} aria-describedby={`${formId}-emoji-hint`} /><span id={`${formId}-emoji-hint`} className="digest-sr-only">Choose one emoji.</span></div>
      <div><label htmlFor={`${formId}-name`}>Name</label><input id={`${formId}-name`} autoFocus required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Unread email" /></div>
    </div>
    <label htmlFor={`${formId}-prompt`}>What should it tell you?</label>
    <textarea id={`${formId}-prompt`} required maxLength={30000} rows={4} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder={`e.g. ${connection.id === "gmail" ? "Unread emails that need a reply, newest first. Skip newsletters and recruiting." : `The updates from ${connection.name} that need my attention.`}`} />
    {!publishOnly && <div className="digest-schedule-fields"><label htmlFor={`${formId}-days`}>When</label>
      <select id={`${formId}-days`} value={frequency} onChange={(event) => setFrequency(event.target.value)}>
        {!simpleSchedule && <option value="custom">Keep current schedule</option>}{DAYS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>
      {frequency !== "custom" && <><span>at</span><select aria-label="Time" value={time} onChange={(event) => setTime(event.target.value)}>{times.sort().map((value) => { const [h, m] = value.split(":"); const n = Number(h); return <option key={value} value={value}>{n % 12 || 12}:{m} {n < 12 ? "AM" : "PM"}</option>; })}</select><span>{definition?.schedule?.timezone && definition.schedule.timezone !== "America/Los_Angeles" ? definition.schedule.timezone : "PT"}</span></>}
    </div>}
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
        else setError("This digest didn’t return an issue. Reload Settings to check its status before trying again.");
      }
    } catch (error) {
      setError(error instanceof Error && error.message.trim() ? error.message : action === "toggle"
        ? `Couldn’t ${definition.enabled ? "pause" : "enable"} ${definition.name}. Try again.`
        : `Couldn’t start ${definition.name}. Check that bb is running and try again.`);
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
                <div className="digest-definition-top"><div className="digest-definition-title"><h5><span aria-hidden>{digestEmoji(definition)}</span> {definition.name}</h5>
                  {definition.schedule && <span className="digest-schedule-pill"><Icon name="Calendar" className="digest-schedule-icon" aria-hidden /> {scheduleLabel(definition.schedule)}</span>}</div>
                  {definition.schedule && <Switch aria-label={`${definition.name} schedule`} checked={definition.enabled} disabled={pending !== null} onCheckedChange={() => { void update(definition, "toggle"); }} />}
                </div>
                <p className="digest-prompt-preview">{definition.instructions}</p>
                <div className="digest-definition-footer">{!definition.schedule && <small>{definition.id === "x-scorecard" ? "Published by your X analytics thread" : "Published by another thread"}</small>}
                  {definition.schedule && <Button aria-label={`Run ${definition.name} now`} disabled={pending !== null} onClick={() => { void update(definition, "run"); }}>{createdId === definition.id ? "Run now to preview" : "Run now"}</Button>}
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
