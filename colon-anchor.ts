// Keep the character's live Range before the picker takes keyboard focus.
// Radix owns positioning, including scroll tracking and viewport collisions.
export function captureColonAnchor(composer: Element | null) {
  const selection = composer?.ownerDocument.getSelection();
  if (!composer || !selection?.isCollapsed || !selection.rangeCount) return null;
  const caret = selection.getRangeAt(0);
  const node = caret.endContainer;
  const offset = caret.endOffset;
  const editor = node.parentElement?.closest('[contenteditable="true"]');
  if (!editor || !composer.contains(editor) || node.nodeType !== Node.TEXT_NODE || node.textContent?.[offset - 1] !== ":") return null;

  const range = caret.cloneRange();
  range.setStart(node, offset - 1);
  return { contextElement: editor, getBoundingClientRect: () => range.getBoundingClientRect() };
}
