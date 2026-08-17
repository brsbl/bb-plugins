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

  it("leaves comment input focus indication to the browser", () => {
    expect(css).not.toContain("outline: none !important;");
    expect(css).not.toMatch(
      /\.bb-comments-textarea,[\s\S]*?\.bb-comments-panel textarea \{[^}]*outline:\s*none;/u,
    );
    expect(css).not.toContain(".bb-comments-mention-input:has(");
    expect(css).not.toMatch(
      /\.bb-comments-panel textarea:focus-visible \{[^}]*outline:/u,
    );
    expect(css).toMatch(
      /\.bb-comments-composer-action:focus-visible,[\s\S]*color-mix\(in oklab, var\(--foreground\) 15%, transparent\)/u,
    );
  });
});
