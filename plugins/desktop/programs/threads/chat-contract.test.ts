// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CHAT_CONTRACT_PROBES, checkChatContract, inspectChatContract } from "./chat-contract";

// Real ThreadChat markup captured from bb; see the comment at the top of the fixture for how to refresh it.
const fixture = readFileSync(resolve(__dirname, "__fixtures__/thread-chat.html"), "utf8");
const css = readFileSync(resolve(__dirname, "../../app.css"), "utf8");
const contractStart = css.indexOf("/*\n * bb ThreadChat contract:");
const contractEnd = css.indexOf("/* End of the bb ThreadChat contract. */");
const contractCss = css.slice(contractStart, contractEnd);

function load(html = fixture) {
  document.body.innerHTML = html;
  const [live, archived, peer] = Array.from(document.querySelectorAll<HTMLElement>(".bbd-im-chat"));
  return { live, archived, peer };
}

/** Every element `selector` matches, after checking app.css's contract section still uses that exact selector. */
function matches(selector: string): Element[] {
  expect(contractCss).toContain(selector);
  return Array.from(document.querySelectorAll(selector));
}

const rowOf = (element: Element) => element.closest(CHAT_CONTRACT_PROBES.row)?.getAttribute("data-timeline-row-id") ?? "";
const isPerson = (element: Element) => rowOf(element).includes(":user-seed:");
const isAgent = (element: Element) => rowOf(element).includes(":assistant:");
const HIDDEN_ROWS = '.bbd-im-chat [data-timeline-row-id]:not(:has([data-message-column]), [data-timeline-row-id*=":user"], [data-timeline-row-id*=":op:warning:"], [data-timeline-row-id*=":error:"])';
const SYSTEM_LINES = '.bbd-im-chat [data-timeline-row-id]:not([data-timeline-row-id*=":user"]) > .rounded-md';
const QUOTED = '.bbd-im-chat [data-timeline-row-id*=":user"] > .rounded-md';

afterEach(() => {
  document.body.innerHTML = "";
});

describe("bb ThreadChat contract", () => {
  it("keeps every rule that restyles bb's chat in app.css's contract section", () => {
    expect(contractStart).toBeGreaterThan(0);
    expect(contractEnd).toBeGreaterThan(contractStart);
    expect(css.slice(0, contractStart) + css.slice(contractEnd)).not.toContain(".bbd-im-chat");
  });

  it("finds bb's real markup intact in a live turn and an archived thread", () => {
    const { live, archived } = load();
    expect(live.dataset.archived).toBe("false");
    expect(archived.dataset.archived).toBe("true");
    expect(checkChatContract(live)).toBe("ok");
    expect(inspectChatContract(archived)).toEqual({ contract: "ok", failed: [] });
  });

  it("shows only what was said: messages and user rows stay, tool calls and thoughts hide", () => {
    load();
    const hidden = matches('.bbd-im-chat [data-timeline-row-id]:not(:has([data-message-column]), [data-timeline-row-id*=":user"], [data-timeline-row-id*=":op:warning:"], [data-timeline-row-id*=":error:"])');
    const shown = Array.from(document.querySelectorAll(CHAT_CONTRACT_PROBES.row)).filter((row) => !hidden.includes(row));
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden.some((row) => rowOf(row).includes(":work-summary:") || rowOf(row).includes(":op:reasoning:"))).toBe(true);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((row) => isPerson(row) || isAgent(row))).toBe(true);
    expect(document.querySelectorAll(CHAT_CONTRACT_PROBES.message).length).toBe(shown.filter((row) => row.querySelector(CHAT_CONTRACT_PROBES.message)).length);
  });

  it("keeps error and warning rows visible", () => {
    const { live } = load();
    const items = live.querySelector(CHAT_CONTRACT_PROBES.row)!.parentElement!;
    for (const id of ["thr_fixture:error:30", "thr_fixture:op:warning:1", "thr_fixture:op:error:2"]) {
      items.insertAdjacentHTML("beforeend", `<div data-timeline-row-id="${id}"><div class="rounded-md"><div class="group/timeline-row">notice</div></div></div>`);
    }
    const hidden = matches('.bbd-im-chat [data-timeline-row-id]:not(:has([data-message-column]), [data-timeline-row-id*=":user"], [data-timeline-row-id*=":op:warning:"], [data-timeline-row-id*=":error:"])');
    expect(hidden.map(rowOf).filter((id) => id.includes("error") || id.includes("warning"))).toEqual([]);
  });

  it("labels speakers on both kinds of message, with Me: only on a person's", () => {
    load();
    const speakers = matches('.bbd-im-chat [data-message-column]:is([class~="group/message"], :has(> [class~="group/message"]))');
    const people = matches('.bbd-im-chat [data-message-column]:has(> [class~="group/message"])');
    expect(speakers).toHaveLength(document.querySelectorAll(CHAT_CONTRACT_PROBES.message).length);
    expect(speakers.filter(isAgent)).toHaveLength(2);
    expect(people).toHaveLength(3);
    expect(people.every(isPerson)).toBe(true);
  });

  it("lifts only the steer label above its message", () => {
    load();
    const labels = matches(".bbd-im-chat [data-message-column] > .ml-auto > .mb-1:first-child");
    expect(labels.map((label) => label.textContent)).toEqual(["Steer"]);
    expect(matches(".bbd-im-chat [data-message-column]:has(> .ml-auto > .mb-1:first-child)")).toEqual([labels[0].closest(CHAT_CONTRACT_PROBES.message)]);
  });

  it("draws tool and thought rows as system lines, never a message", () => {
    load();
    const lines = matches(SYSTEM_LINES);
    expect(lines.map((line) => line.textContent?.trim())).toEqual(["Explored 2 lists 1 error", "Explored 1 list", "Thought"]);
    for (const line of lines) {
      expect(isPerson(line) || isAgent(line)).toBe(false);
      expect(line.querySelector(CHAT_CONTRACT_PROBES.message)).toBeNull();
    }
  });

  it("keeps bb's layout for a message from another agent or bb, with the message set like the transcript", () => {
    const { peer } = load();
    expect(checkChatContract(peer)).toBe("ok");
    // bb draws these as user rows without a message column: GeneratedConversationMessage.
    const rows = Array.from(document.querySelectorAll(CHAT_CONTRACT_PROBES.row)).filter((row) => rowOf(row).includes(":user") && row.querySelector(CHAT_CONTRACT_PROBES.message) === null);
    expect(rows.map(rowOf)).toEqual(["thr_fixture_peer:user-seed:52", "thr_fixture_peer:user-seed:74", "thr_fixture_peer:user-seed:129", "thr_fixture_lead:user-seed:29"]);
    expect(rows.every((row) => peer.contains(row))).toBe(true);
    expect(matches(HIDDEN_ROWS).filter((row) => rows.includes(row))).toEqual([]);
    // The tool and thought system-line rules never reach these rows; their header gets its own system-line rule.
    for (const selector of [SYSTEM_LINES, `${SYSTEM_LINES} :is(.text-sm, .text-muted-foreground, .text-subtle-foreground)`]) {
      expect(matches(selector).filter((element) => rows.some((row) => row.contains(element)))).toEqual([]);
    }
    const headers = matches(`${QUOTED} > .group\\/timeline-row`);
    expect(headers.map((header) => header.querySelector("span[title]")?.textContent)).toEqual([
      "Message from Release checklist lead",
      "Message from Release checklist lead",
      "Message from Release checklist lead",
      "Release notes check finished",
    ]);
    // The message body, collapsed or expanded, keeps bb's markdown and takes the transcript's type.
    const bodies = matches(`${QUOTED} > .relative`);
    expect(bodies).toHaveLength(4);
    expect(bodies.every((body) => body.querySelector("[data-markdown-preview]") !== null)).toBe(true);
    expect(matches(`${QUOTED} > .relative a:not([data-prompt-mention-resource])`).map((link) => link.getAttribute("href"))).toEqual(["https://example.com/notes"]);
    expect(matches(`${QUOTED} > .relative [data-prompt-mention-resource]`).map((pill) => pill.textContent)).toEqual(["Release notes check"]);
  });

  it("sets the gap between messages on the transcript's row list", () => {
    load();
    const lists = matches('.bbd-im-chat [data-timeline-row-list="top-level"]');
    expect(lists).toHaveLength(3);
    const columns = Array.from(document.querySelectorAll(CHAT_CONTRACT_PROBES.message));
    expect(columns.every((column) => lists.some((list) => list.contains(column)))).toBe(true);
  });

  it("lays every message's action row over its last line, a person's and the agent's", () => {
    load();
    const columns = Array.from(document.querySelectorAll(CHAT_CONTRACT_PROBES.message));
    const slots = matches(".bbd-im-chat [data-message-column] .relative.w-full.h-5");
    expect(slots).toHaveLength(columns.length);
    expect(slots.filter(isAgent).length).toBeGreaterThan(0);
    expect(slots.filter(isPerson).length).toBeGreaterThan(0);
    // The slot follows the message text, so pulling it up puts it over the last line.
    for (const slot of slots) expect(slot.previousElementSibling?.querySelector("[data-markdown-preview]")).not.toBeNull();
    const rows = matches(".bbd-im-chat [data-message-column] .relative.w-full.h-5 > .absolute.top-0");
    expect(rows).toHaveLength(columns.length);
    for (const row of rows) expect(row.querySelector('button[aria-label="Copy message"]')).not.toBeNull();
  });

  it("shows the fade behind the actions exactly when bb reveals them", () => {
    load();
    const rows = Array.from(document.querySelectorAll(".bbd-im-chat [data-message-column] .relative.w-full.h-5 > .absolute.top-0"));
    // bb reveals the buttons on hover or focus inside the message's group/message, or while the row's menu is open.
    for (const button of rows.flatMap((row) => Array.from(row.querySelectorAll("button:not(.hidden)")))) {
      expect(button.classList).toContain("opacity-0");
      expect(button.classList).toContain("group-hover/message:opacity-100");
      expect(button.classList).toContain("group-focus-within/message:opacity-100");
    }
    for (const row of rows) expect(row.classList).toContain("data-[menu-open]:[&_button]:opacity-100");
    const revealed = '.bbd-im-chat [class~="group/message"]:is(:hover, :focus-within) .relative.w-full.h-5 > .absolute.top-0::before';
    expect(contractCss).toContain(revealed);
    expect(Array.from(document.querySelectorAll(revealed.replace(":is(:hover, :focus-within)", "").replace("::before", "")))).toEqual(rows);
    const menuOpen = ".bbd-im-chat [data-message-column] .relative.w-full.h-5 > [data-menu-open]";
    expect(contractCss).toContain(`${menuOpen}::before`);
    rows[0].setAttribute("data-menu-open", "");
    expect(Array.from(document.querySelectorAll(menuOpen))).toEqual([rows[0]]);
  });

  it("styles bb's live Working... line outside the rows", () => {
    const { live } = load();
    const working = matches(".bbd-im-chat .mt-4.min-h-7:has(> .animate-shine)");
    expect(working.map((line) => line.textContent)).toEqual(["Working...", "Working..."]);
    expect(live.contains(working[0])).toBe(true);
    expect(working.some((line) => line.closest(CHAT_CONTRACT_PROBES.row) !== null)).toBe(false);
  });

  it("restyles the composer and hides it only in the archived thread", () => {
    const { live, archived } = load();
    const footers = matches(".bbd-im-chat .sticky.bottom-0 > .relative").map((slot) => slot.parentElement);
    expect(footers).toEqual(Array.from(document.querySelectorAll(CHAT_CONTRACT_PROBES.footer)));
    for (const footer of footers) expect(footer?.querySelector(`${CHAT_CONTRACT_PROBES.promptbox} [contenteditable]`)).not.toBeNull();
    expect(matches(".bbd-im-chat .sticky.bottom-0 > .relative > .px-4")).toHaveLength(2);
    expect(matches(".bbd-im-chat .sticky.bottom-0 > .relative > .pointer-events-none").every((fade) => fade.hasAttribute("data-overflow-fade"))).toBe(true);
    expect(matches('.bbd-im-chat[data-archived="true"] [data-scroll-footer]')).toEqual([archived.querySelector(CHAT_CONTRACT_PROBES.footer)]);
    expect(live.querySelector(CHAT_CONTRACT_PROBES.footer)).not.toBeNull();
    const send = matches('.bbd-im-chat [data-promptbox] button[data-promptbox-submit-action]:is([type="submit"], [aria-label="Stop run"])');
    expect(send).toHaveLength(2);
    expect(send.every((button) => button.closest(CHAT_CONTRACT_PROBES.promptbox) !== null)).toBe(true);
  });

  it("reports a mismatch when bb renames its row and message markers", () => {
    const renamed = fixture.replaceAll("data-timeline-row-id=", "data-timeline-row-key=").replaceAll("data-message-column=", "data-message-body=");
    const { live, archived } = load(renamed);
    expect(checkChatContract(live)).toBe("mismatch");
    expect(inspectChatContract(archived)).toEqual({ contract: "mismatch", failed: [CHAT_CONTRACT_PROBES.row, CHAT_CONTRACT_PROBES.message] });
  });

  it("reports a mismatch when the message box loses its markers", () => {
    const { archived } = load(fixture.replaceAll("data-scroll-footer=", "data-sticky-footer=").replaceAll("data-promptbox=", "data-composer="));
    expect(inspectChatContract(archived)).toEqual({ contract: "mismatch", failed: [CHAT_CONTRACT_PROBES.footer, CHAT_CONTRACT_PROBES.promptbox] });
  });

  it("waits while bb is still loading the transcript", () => {
    document.body.innerHTML = '<div class="bbd-im-chat"><div aria-busy="true"><div class="animate-pulse"></div></div></div>';
    expect(checkChatContract(document.body.firstElementChild as Element)).toBe("pending");
    const { archived } = load();
    archived.querySelectorAll(CHAT_CONTRACT_PROBES.row).forEach((row) => row.remove());
    expect(checkChatContract(archived)).toBe("pending");
  });
});
