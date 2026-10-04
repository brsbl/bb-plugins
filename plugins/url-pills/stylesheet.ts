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
  cursor: pointer;
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
[data-bb-url-pill-inspector], [data-bb-url-pill-menu] {
  position: fixed;
  z-index: 10000;
  box-sizing: border-box;
  border: 1px solid var(--border, #8883);
  border-radius: 12px;
  background: var(--popover, var(--background, #fff));
  color: var(--popover-foreground, var(--foreground, #222));
  box-shadow: 0 2px 8px #00000012;
  font: 12px/1.5 var(--font-sans, system-ui, sans-serif);
}
[data-bb-url-pill-inspector] { width: min(288px, calc(100vw - 24px)); padding: 6px 8px; }
[data-bb-url-pill-row] { display: flex; align-items: center; gap: 4px; min-height: 24px; }
[data-bb-url-pill-inspector] input {
  box-sizing: border-box; flex: 1; min-width: 0; height: 24px;
  padding: 2px 4px 2px 0; border: 0; outline: none;
  background: transparent; color: inherit; font: inherit;
}
[data-bb-url-pill-inspector] button {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 24px; height: 24px; padding: 4px; color: var(--muted-foreground, #737373); cursor: pointer;
}
[data-bb-url-pill-inspector] button { border: 0; border-radius: 6px; background: transparent; }
[data-bb-url-pill-menu] { min-width: 160px; padding: 4px; border-radius: 8px; }
[data-bb-url-pill-menu] button {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px;
  border: 0; border-radius: 4px; background: transparent; color: inherit; font: inherit;
  text-align: left; cursor: pointer;
}
[data-bb-url-pill-inspector] button:hover, [data-bb-url-pill-menu] button:hover,
[data-bb-url-pill-menu] button:focus { background: var(--accent, #8882); color: var(--foreground); }
[data-bb-url-pill-inspector] svg, [data-bb-url-pill-menu] svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
[data-bb-url-pill-inspector] button:focus-visible, [data-bb-url-pill-menu] button:focus-visible { outline: 2px solid var(--ring, #748dff); outline-offset: 1px; }
[data-bb-url-pill-inspector] [role=status]:empty { display: none; }
[data-bb-url-pill-inspector] [role=status] { margin-top: 4px; color: var(--muted-foreground); }

`;

/** CSS strings, unlike JSON strings, require hexadecimal escapes for controls. */
export function cssString(value: string): string {
  return '"' + value.replace(/["\\\u0000-\u001f\u007f]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `) + '"';
}
