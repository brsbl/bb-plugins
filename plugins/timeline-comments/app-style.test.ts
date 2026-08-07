import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./app.css", import.meta.url), "utf8");

describe("timeline comments visual contract", () => {
  it("uses one compact scale across Moss comment components", () => {
    expect(css).toMatch(/\.bb-comments-marker \{[\s\S]*width: 24px;[\s\S]*height: 24px;/u);
    expect(css).toMatch(/\.bb-comments-marker svg \{[\s\S]*width: 15px;[\s\S]*height: 15px;/u);
    expect(css).toMatch(/\.bb-comments-composer-action \{[\s\S]*width: 22px;[\s\S]*height: 22px;/u);
    expect(css).toContain("width: 264px;");
    expect(css).toMatch(/\.bb-comments-comment \{[\s\S]*padding: 0;/u);
    expect(css).toMatch(/\.bb-comments-comment-body \{[\s\S]*font-size: 10\.5px;/u);
    expect(css).toMatch(/\.bb-comments-message-header strong \{[\s\S]*font-size: 9px;/u);
    expect(css).toMatch(/\.bb-comments-panel \{[\s\S]*font-size: 11px;/u);
    expect(css).toMatch(/\.bb-comments-row-summary \{[\s\S]*padding: 7px 9px;/u);
  });

  it("keeps the new-comment composer compact until content needs more room", () => {
    expect(css).toMatch(/\.bb-comments-composer \{[\s\S]*width: 216px;[\s\S]*min-height: 30px;/u);
    expect(css).toMatch(/\.bb-comments-input-row \{[\s\S]*min-height: 30px;/u);
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
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses a neutral ink focus treatment instead of the host accent ring", () => {
    expect(css).not.toContain("var(--ring)");
    expect(css).toMatch(
      /\.bb-comments-textarea:focus-visible,[\s\S]*outline: none !important;[\s\S]*box-shadow: none !important;/u,
    );
    expect(css).toMatch(
      /\.bb-comments-inline-composer:focus-within \{[\s\S]*outline: none;[\s\S]*box-shadow: none;/u,
    );
    expect(css).toMatch(
      /\.bb-comments-composer-action:focus-visible,[\s\S]*color-mix\(in oklab, var\(--foreground\) 15%, transparent\)/u,
    );
  });
});
