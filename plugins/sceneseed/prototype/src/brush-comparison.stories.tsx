import { useState } from "react";

import {
  BRUSH_COMPARISON_CRITERIA,
  createBrushComparisonFixtures,
  type BrushFixtureId,
} from "../../brush-fixtures.js";
import {
  SceneRenderer,
  type SceneRenderObject,
} from "../../scene-renderer.js";
import "../../app.css";
import "./brush-comparison.css";

const fixtures = createBrushComparisonFixtures();

function Comparison({ initialId }: { initialId: BrushFixtureId }) {
  const [id, setId] = useState(initialId);
  const fixture = fixtures.find((candidate) => candidate.id === id)!;
  const before: SceneRenderObject = {
    scene: fixture.before,
    revisionKey: `${fixture.id}-before`,
  };
  const after: SceneRenderObject = {
    scene: fixture.after,
    revisionKey: `${fixture.id}-after`,
  };

  return (
    <main className="brush-evaluation">
      <header>
        <p>Procedural brush evaluation</p>
        <h1>{fixture.prompt}</h1>
        <span>
          Same prompt and presentation settings. Compare {BRUSH_COMPARISON_CRITERIA.join(", ")}.
        </span>
      </header>
      <nav aria-label="Representative prompts">
        {fixtures.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            aria-pressed={candidate.id === id}
            onClick={() => setId(candidate.id)}
          >
            {candidate.id.replaceAll("-", " ")}
          </button>
        ))}
      </nav>
      <div className="brush-evaluation-grid">
        <section>
          <div>
            <strong>Before</strong>
            <span>Geometric primitives</span>
          </div>
          <SceneRenderer
            className="brush-evaluation-renderer"
            objects={[before]}
            reducedMotion
            enableOrbitControls={false}
          />
        </section>
        <section>
          <div>
            <strong>After</strong>
            <span>Procedural pencil brush</span>
          </div>
          <SceneRenderer
            className="brush-evaluation-renderer"
            objects={[after]}
            reducedMotion
            enableOrbitControls={false}
          />
        </section>
      </div>
    </main>
  );
}

export default {
  title: "Protofetti / Procedural brush",
};

export const ReferenceComparison = () => (
  <Comparison initialId="seated-traveler" />
);
ReferenceComparison.storyName = "Reference comparison";

export const RainJar = () => <Comparison initialId="rain-jar" />;
RainJar.storyName = "Rain jar";

export const PocketRadio = () => <Comparison initialId="pocket-radio" />;
PocketRadio.storyName = "Pocket radio";
