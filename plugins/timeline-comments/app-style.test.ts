import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./app.css", import.meta.url), "utf8");

describe("timeline comments visual contract", () => {
  it("adapts Moss comment hierarchy to BB thread typography", () => {
    expect(css).toContain("width: 352px;");
    expect(css).toMatch(/\.bb-comments-comment \{[\s\S]*padding: 8px 12px;/u);
    expect(css).toMatch(/\.bb-comments-comment-body \{[\s\S]*font-size: 13px;/u);
    expect(css).toMatch(/\.bb-comments-message-header strong \{[\s\S]*font-size: 11px;/u);
  });

  it("keeps the new-comment composer compact until content needs more room", () => {
    expect(css).toMatch(/\.bb-comments-composer \{[\s\S]*min-height: 40px;/u);
    expect(css).toMatch(/\.bb-comments-textarea \{[\s\S]*min-height: 24px;/u);
    expect(css).toMatch(
      /\.bb-comments-composer\[data-multiline="true"\] \{[\s\S]*padding-bottom: 32px;/u,
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
