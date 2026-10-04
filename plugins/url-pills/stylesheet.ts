const generic = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/></svg>');

/** The same geometry paints timeline anchors and stylesheet-only composer ranges. */
export function pillStyles(selectors: readonly string[], labelContent: string): string {
  if (!selectors.length) return '';
  const selector = selectors.join(',\n');
  const before = selectors.map((value) => `${value}::before`).join(',\n');
  const after = selectors.map((value) => `${value}::after`).join(',\n');
  return `
${selector} {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  max-width: min(320px, 100%);
  padding: 1px 7px 1px 25px;
  border: 1px solid var(--pill-surface-border, var(--border));
  border-radius: 999px;
  background: var(--pill-surface, var(--surface-recessed));
  color: var(--pill-foreground, var(--foreground));
  font-size: 0;
  line-height: 18px;
  vertical-align: -5px;
  white-space: nowrap;
  text-decoration: none;
  overflow: hidden;
}
${before} {
  content: "";
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background: var(--bb-url-pill-icon, var(--pill-icon, var(--foreground))) center / contain no-repeat;
  background-color: var(--bb-url-pill-icon-background, var(--pill-icon, var(--foreground)));
  border-radius: 3px;
  mask: var(--bb-url-pill-mask, url("data:image/svg+xml,${generic}")) center / contain no-repeat;
}
${after} {
  /* Empty alternate text keeps generated labels out of accessible names. */
  content: ${labelContent} / "";
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
  font: 12px/18px var(--font-sans, system-ui, sans-serif);
}
`;
}

export const STYLESHEET = pillStyles(['[data-bb-url-pill]:not([data-bb-url-pill-expanded])'], 'attr(data-bb-url-pill-label)') + `
a[data-bb-url-pill]:hover { background: var(--accent, #8882); }
a[data-bb-url-pill]:focus-visible { outline: 2px solid var(--ring, #748dff); outline-offset: 2px; }
[data-bb-url-pill-inspector] {
  position: fixed;
  z-index: 10000;
  box-sizing: border-box;
  width: min(440px, calc(100vw - 24px));
  padding: 14px;
  border: 1px solid var(--border, #8885);
  border-radius: 10px;
  background: var(--popover, var(--background, #fff));
  color: var(--popover-foreground, var(--foreground, #222));
  box-shadow: 0 8px 32px #0003;
  font: 13px/1.5 var(--font-sans, system-ui, sans-serif);
}
[data-bb-url-pill-inspector] label { display: block; margin-bottom: 6px; font-weight: 500; }
[data-bb-url-pill-inspector] textarea {
  box-sizing: border-box; width: 100%; min-height: 70px; max-height: 35vh; resize: vertical;
  padding: 8px; border: 1px solid var(--border, #8885); border-radius: 5px;
  background: var(--background, #fff); color: inherit; font: 12px/1.5 ui-monospace, monospace;
}
[data-bb-url-pill-inspector] button {
  margin: 8px 8px 0 0; padding: 5px 10px; border: 1px solid var(--border, #8885);
  border-radius: 5px; background: var(--background, #fff); color: inherit; cursor: pointer; font: inherit;
}
[data-bb-url-pill-inspector] :focus-visible { outline: 2px solid var(--ring, #748dff); outline-offset: 2px; }
[data-bb-url-pill-inspector] [role=status] { margin-top: 8px; }
`;

/** CSS strings, unlike JSON strings, require hexadecimal escapes for controls. */
export function cssString(value: string): string {
  return '"' + value.replace(/["\\\u0000-\u001f\u007f]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `) + '"';
}
