/**
 * The Instant Message window restyles bb's ThreadChat through its private markup: the "bb ThreadChat contract"
 * section of app.css. bb can change that markup in any release, so the window checks a few stable markers of it
 * and, when they are gone, drops the restyle and shows bb's own chat instead of half-styled AIM lines.
 */

export type ChatContract = "ok" | "mismatch" | "pending";

/**
 * Markers bb renders for each structure the contract rules restyle, as of get-bb/bb 1e2cee69ad. A marker is only
 * required once the structure it names is on screen: rows and message columns once the transcript shows a message,
 * the footer, prompt box and its submit button once there is a message box.
 */
export const CHAT_CONTRACT_PROBES = {
  /** Every transcript row: `TimelineRowItemWrapper` in thread/timeline/ThreadTimelineRows.tsx. */
  row: "[data-timeline-row-id]",
  /** A person's or the agent's message: thread/timeline/ConversationMessageContent.tsx. */
  message: "[data-message-column]",
  /** The slot pinned below the transcript that holds the composer: ui/bottom-anchored-scroll-body.tsx. */
  footer: "[data-scroll-footer]",
  /** The message box: promptbox/PromptBoxInternal.tsx. */
  promptbox: "[data-promptbox]",
  /** The outer composer owns a stack of queued editors followed by its own input. */
  shell: "[data-promptbox-shell]",
  anchor: "[data-follow-up-composer-anchor]",
  /** The message box's Send, Stop run or voice input button, which the window's strip Send drives: PromptBoxInternal.tsx. */
  submit: "button[data-promptbox-submit-action]",
} as const;

/** bb's Send or Stop run button in the window's message box (not an inline message editor's). */
export const COMPOSER_SUBMIT = `${CHAT_CONTRACT_PROBES.footer} ${CHAT_CONTRACT_PROBES.shell}:not(${CHAT_CONTRACT_PROBES.shell} ${CHAT_CONTRACT_PROBES.shell}) > ${CHAT_CONTRACT_PROBES.anchor} ${CHAT_CONTRACT_PROBES.promptbox} ${CHAT_CONTRACT_PROBES.submit}`;

/** What bb's submit button offers right now, for the strip's Send to mirror. */
export type ComposerSend = { action: "send" | "stop"; disabled: boolean; title: string };

export function readComposerSend(button: HTMLButtonElement): ComposerSend {
  const label = button.getAttribute("aria-label") ?? "";
  if (label === "Stop run") return { action: "stop", disabled: button.disabled, title: label };
  // The slot shows voice input instead (touch screens, empty draft): there is nothing to send yet.
  if (button.type !== "submit") return { action: "send", disabled: true, title: "" };
  return { action: "send", disabled: button.disabled, title: label };
}

/** Standard HTML, so it still finds the message box and message text when bb's own markers are gone. */
const EDITOR = "[contenteditable], textarea";
const PROSE_TAGS = ["p", "li", "pre"];

export function checkChatContract(root: Element): ChatContract {
  return inspectChatContract(root).contract;
}

/** The contract and the probes that failed, for the window's one warning. */
export function inspectChatContract(root: Element): { contract: ChatContract; failed: string[] } {
  const failed: string[] = [];
  // bb's composer follows the transcript, so the last editor is it rather than an inline message editor.
  const editors = root.querySelectorAll(EDITOR);
  const composer = editors.item(editors.length - 1);
  if (composer !== null) {
    for (const probe of [CHAT_CONTRACT_PROBES.footer, CHAT_CONTRACT_PROBES.promptbox, CHAT_CONTRACT_PROBES.shell, CHAT_CONTRACT_PROBES.anchor]) {
      if (composer.closest(probe) === null) failed.push(probe);
    }
    const promptbox = composer.closest(CHAT_CONTRACT_PROBES.promptbox);
    if (promptbox !== null && promptbox.querySelector(CHAT_CONTRACT_PROBES.submit) === null) failed.push(CHAT_CONTRACT_PROBES.submit);
  }
  // Loading skeletons and status lines carry no prose; a message does. bb only renders the rows on screen, so a long
  // thread can show nothing but an expanded Thought or tool row: that prose needs a row, not a message column.
  const prose = findProse(root);
  if (prose.any && root.querySelector(CHAT_CONTRACT_PROBES.row) === null) failed.push(CHAT_CONTRACT_PROBES.row);
  if (prose.message && root.querySelector(CHAT_CONTRACT_PROBES.message) === null) failed.push(CHAT_CONTRACT_PROBES.message);
  if (failed.length > 0) return { contract: "mismatch", failed };
  return { contract: prose.any ? "ok" : "pending", failed };
}

/** Whether the transcript shows prose, and whether any of it sits outside an expandable row's body (a message). */
function findProse(root: Element): { any: boolean; message: boolean } {
  const outside = `${EDITOR}, ${CHAT_CONTRACT_PROBES.footer}`;
  let any = false;
  for (const tag of PROSE_TAGS) {
    // Live collections, so a long transcript stops at its first message paragraph.
    for (const element of root.getElementsByTagName(tag)) {
      if (element.closest(outside) !== null) continue;
      any = true;
      // Thought and tool bodies sit in bb's disclosure panel (ui/disclosure.tsx); messages don't.
      if (element.closest(".rounded-md") === null) return { any, message: true };
    }
  }
  return { any, message: false };
}
