import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./app.css", import.meta.url), "utf8");

describe("timeline comments visual contract", () => {
  it("uses one compact scale across Moss comment components", () => {
    expect(css).toMatch(/\.bb-comments-marker \{[\s\S]*width: 24px;[\s\S]*height: 24px;/u);
    expect(css).toMatch(/\.bb-comments-marker svg \{[\s\S]*width: 15px;[\s\S]*height: 15px;/u);
    expect(css).toMatch(/\.bb-comments-composer-action \{[\s\S]*width: 28px;[\s\S]*height: 28px;/u);
    expect(css).toMatch(/\.bb-comments-composer-action-icon \{[\s\S]*width: 16px;[\s\S]*height: 16px;/u);
    expect(css).toContain("width: 264px;");
    expect(css).toMatch(/\.bb-comments-comment \{[\s\S]*padding: 0;/u);
    expect(css).toMatch(/\.bb-comments-comment-body \{[\s\S]*font-family: inherit;[\s\S]*font-size: inherit;/u);
    expect(css).toMatch(/\.bb-comments-message-header strong \{[\s\S]*font-size: 9px;/u);
    expect(css).toMatch(/\.bb-comments-panel \{[\s\S]*font-size: 13px;/u);
    expect(css).toMatch(/\.bb-comments-row-summary \{[\s\S]*padding: 7px 9px;/u);
  });

  it("uses BB body typography for comment copy and inputs", () => {
    expect(css).toMatch(/\.bb-comments-composer,[\s\S]*\.bb-comments-popover \{[\s\S]*font-family: inherit;[\s\S]*font-size: 13px;/u);
    expect(css).toMatch(/\.bb-comments-reply-input \{[\s\S]*font-family: inherit;[\s\S]*font-size: inherit;/u);
    expect(css).toMatch(/\.bb-comments-row-body \{[\s\S]*font-family: inherit;[\s\S]*font-size: inherit;/u);
    expect(css).toMatch(/\.bb-comments-panel-comment p \{[\s\S]*font-family: inherit;[\s\S]*font-size: inherit;/u);
  });

  it("shows the composer action tooltip on hover and keyboard focus", () => {
    expect(css).toMatch(/\.bb-comments-composer-action-tooltip \{[\s\S]*z-index: 60;[\s\S]*background: var\(--primary\);/u);
    expect(css).not.toMatch(/\.bb-comments-composer-action-tooltip \{[^}]*position: absolute;/u);
  });

  it("keeps the new-comment composer compact until content needs more room", () => {
    expect(css).toMatch(/\.bb-comments-composer \{[\s\S]*width: 216px;[\s\S]*min-height: 30px;/u);
    expect(css).toMatch(/\.bb-comments-mention-input\[data-mention-input-expanded="false"\] \{[\s\S]*height: 30px;/u);
    expect(css).toMatch(/\.bb-comments-input-row \{[\s\S]*min-height: 24px;/u);
    expect(css).toMatch(/\.bb-comments-context-control \{[\s\S]*width: 18px;/u);
  });

  it("uses Moss-style incremental edit and footer transitions", () => {
    expect(css).toMatch(
      /\.bb-comments-reply \{[\s\S]*grid-template-rows: 1fr;[\s\S]*cubic-bezier\(0\.22, 1, 0\.36, 1\);/u,
    );
    expect(css).toMatch(
      /\.bb-comments-reply\[data-editing="true"\] \{[\s\S]*grid-template-rows: 0fr;/u,
    );
    expect(css).toMatch(
      /\.bb-comments-edit-footer-host \{[\s\S]*opacity 150ms ease-out;/u,
    );
    expect(css).toMatch(
      /\.bb-comments-compact-actions,[\s\S]*\.bb-comments-expanded-actions \{[\s\S]*opacity 150ms ease-out;/u,
    );
    expect(css).toMatch(
      /\.bb-comments-reply\[data-last-editing="true"\] \.bb-comments-reply-inner \{[\s\S]*height: 31px;/u,
    );
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses BB input tokens for comment input states", () => {
    expect(css).toMatch(
      /\.bb-comments-mention-input \{[\s\S]*border: 1px solid var\(--input, var\(--border\)\);[\s\S]*background: var\(--background\);/u,
    );
    expect(css).toMatch(
      /\.bb-comments-mention-input:focus-within \{[\s\S]*border-color: var\(--ring\);[\s\S]*0 0 0 1px var\(--ring\);/u,
    );
    expect(css).toMatch(
      /\.bb-comments-mention-input:has\(\.bb-comments-error\) \{[\s\S]*var\(--destructive-text/u,
    );
    expect(css).toMatch(
      /\.bb-comments-mention-input\[aria-busy="true"\] \.bb-comments-input-surface,[\s\S]*var\(--surface-recessed\) 55%/u,
    );
    expect(css).toMatch(
      /\.bb-comments-mention-input textarea:focus,[\s\S]*outline: none;[\s\S]*box-shadow: none;/u,
    );
    expect(css).toMatch(
      /\.bb-comments-composer-action:focus-visible,[\s\S]*color-mix\(in oklab, var\(--foreground\) 15%, transparent\)/u,
    );
  });

  it("keeps the pre-restyle submit control unchanged", () => {
    expect(css).toMatch(
      /\.bb-comments-submit-shortcut \{\n  position: static;\n  display: flex;\n  min-width: 27px;\n  height: 18px;[\s\S]*?  cursor: pointer;\n\}/u,
    );
    expect(css).toMatch(
      /\.bb-comments-submit-shortcut:hover:not\(:disabled\) \{\n  background: var\(--surface-recessed\);\n  color: var\(--foreground\);\n\}/u,
    );
    expect(css).toMatch(
      /\.bb-comments-submit-shortcut:disabled \{\n  cursor: default;\n  opacity: 0\.3;\n\}/u,
    );
  });
});
