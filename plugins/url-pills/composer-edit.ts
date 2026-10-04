import { findComposerUrls } from './urls';

export interface ComposerSource {
  readonly text: string;
  updateText(update: (current: string) => string): void;
}

export interface ComposerEdit {
  current(): boolean;
  apply(url: string): boolean;
}

/** Match a host decoration to its source range; ambiguous markup stays read-only. */
export function captureComposerEdit(element: HTMLElement, source: ComposerSource): ComposerEdit | null {
  const editor = element.closest('[contenteditable="true"]');
  if (!editor) return null;
  const text = source.text;
  const ranges = findComposerUrls(text, location.origin);
  const spans = Array.from(editor.querySelectorAll('.bb-url-pill-range'));
  const index = spans.indexOf(element);
  if (index < 0 || spans.length !== ranges.length
    || spans.some((span, i) => span.textContent !== text.slice(ranges[i].from, ranges[i].to))) return null;
  const { from, to } = ranges[index];
  return {
    current: () => source.text === text,
    apply(url) {
      let applied = false;
      source.updateText((current) => {
        if (current !== text) return current;
        applied = true;
        return current.slice(0, from) + url + current.slice(to);
      });
      return applied;
    },
  };
}
