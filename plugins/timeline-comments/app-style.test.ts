import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./app.css", import.meta.url), "utf8");

describe("timeline comments visual contract", () => {
  it("matches Moss comment scale and spacing", () => {
    expect(css).toContain("width: 352px;");
    expect(css).toMatch(/\.bb-comments-comment \{[\s\S]*padding: 8px 12px;/u);
    expect(css).toMatch(/\.bb-comments-comment-body \{[\s\S]*font-size: 14px;/u);
    expect(css).toMatch(/\.bb-comments-message-header strong \{[\s\S]*font-size: 12px;/u);
  });

  it("uses a neutral ink focus treatment instead of the host accent ring", () => {
    expect(css).not.toContain("var(--ring)");
    expect(css).toMatch(
      /\.bb-comments-composer-action:focus-visible,[\s\S]*color-mix\(in oklab, var\(--foreground\) 15%, transparent\)/u,
    );
  });
});
