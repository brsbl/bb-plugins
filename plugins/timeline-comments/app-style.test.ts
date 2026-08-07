import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./app.css", import.meta.url), "utf8");

describe("timeline comments visual contract", () => {
  it("uses one compact scale across comment surfaces", () => {
    expect(css).toMatch(/\.bb-comments-marker \{[\s\S]*width: 28px;[\s\S]*height: 28px;/u);
    expect(css).toMatch(/\.bb-comments-marker svg \{[\s\S]*width: 16px;[\s\S]*height: 16px;/u);
    expect(css).toMatch(/\.bb-comments-composer-action \{[\s\S]*width: 24px;[\s\S]*height: 24px;/u);
    expect(css).toContain("width: 288px;");
    expect(css).toMatch(/\.bb-comments-comment \{[\s\S]*padding: 6px 9px;/u);
    expect(css).toMatch(/\.bb-comments-comment-body \{[\s\S]*font-size: 12px;/u);
    expect(css).toMatch(/\.bb-comments-message-header strong \{[\s\S]*font-size: 10px;/u);
    expect(css).toMatch(/\.bb-comments-panel \{[\s\S]*font-size: 12px;/u);
    expect(css).toMatch(/\.bb-comments-row-summary \{[\s\S]*padding: 7px 9px;/u);
  });

  it("keeps the new-comment composer compact until content needs more room", () => {
    expect(css).toMatch(/\.bb-comments-composer \{[\s\S]*width: 240px;[\s\S]*min-height: 34px;/u);
    expect(css).toMatch(/\.bb-comments-textarea \{[\s\S]*min-height: 20px;/u);
    expect(css).toMatch(
      /\.bb-comments-composer\[data-multiline="true"\] \{[\s\S]*padding-bottom: 26px;/u,
    );
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
      /\.bb-comments-composer-action:focus-visible,[\s\S]*color-mix\(in oklab, var\(--foreground\) 15%, transparent\)/u,
    );
  });
});
