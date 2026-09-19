import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createBrushComparisonFixtures } from "./brush-fixtures.js";
import { SceneRenderer } from "./scene-renderer.js";

describe("SceneRenderer accessibility", () => {
  it("associates the current generated-scene description with the canvas", () => {
    const fixtures = createBrushComparisonFixtures();
    const first = fixtures[0]!.after;
    const replacement = fixtures[1]!.after;

    const firstMarkup = renderToStaticMarkup(
      <SceneRenderer objects={[{ scene: first }]} reducedMotion />,
    );
    const replacementMarkup = renderToStaticMarkup(
      <SceneRenderer objects={[{ scene: replacement }]} reducedMotion />,
    );

    expect(firstMarkup).toContain("aria-describedby=");
    expect(firstMarkup).toContain(first.altText);
    expect(replacementMarkup).toContain(replacement.altText);
    expect(replacementMarkup).not.toContain(first.altText);
  });
});
