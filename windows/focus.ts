/** Whether keys are going to a text field outside `within`, such as bb's composer. */
export function typingElsewhere(within: Element | null): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || within?.contains(active) === true) return false;
  return (
    active.isContentEditable ||
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement
  );
}

/**
 * Whether a program's window-wide shortcut such as F2 should act: its window is the focused one and the keys are not
 * meant for a text field elsewhere, since bb's composer keeps focus while a window is on top.
 */
export function windowOwnsKeys(element: Element | null): boolean {
  return element?.closest(".bbd-window")?.getAttribute("data-focused") === "true" && !typingElsewhere(element);
}
