import { useMemo, useState } from "react";

import type { SceneObjectV2 } from "../../scene-contract.js";
import {
  SceneRenderer,
  type SceneRenderObject,
  type SceneRenderProbeEvent,
  type SceneTintToken,
} from "../../scene-renderer.js";
import "../../app.css";
import galleryJson from "../generated/prompt-gallery-scenes.json?raw";
import "./prompt-gallery.css";

type GalleryCategory =
  | "Plugin prototype"
  | "Product UI / screen"
  | "Early product idea";

interface GalleryEntry {
  readonly id: string;
  readonly index: number;
  readonly title: string;
  readonly category: GalleryCategory;
  readonly prompt: string;
  readonly tint: SceneTintToken | null;
  readonly deterministic: boolean;
  readonly sourceBytes: number;
  readonly scene: SceneObjectV2;
}

interface GalleryData {
  readonly viewport: { readonly width: number; readonly height: number };
  readonly count: number;
  readonly entries: readonly GalleryEntry[];
  readonly failures: readonly unknown[];
}

const screenshotRoot = "/prompt-gallery";
const categories: readonly GalleryCategory[] = [
  "Plugin prototype",
  "Product UI / screen",
  "Early product idea",
];

const galleryData = JSON.parse(galleryJson) as GalleryData;

function currentPromptId(): string | null {
  return new URLSearchParams(window.location.search).get("prompt-id");
}

function CaptureStory() {
  const promptId = currentPromptId();
  const entry = useMemo(
    () =>
      galleryData.entries.find((candidate) => candidate.id === promptId) ??
      galleryData.entries[0],
    [promptId],
  );
  const [renderStatus, setRenderStatus] = useState<"waiting" | "ready" | "failed">(
    "waiting",
  );

  if (!entry) {
    return <main className="prompt-gallery-loading">Loading prompt fixture…</main>;
  }
  const renderObject: SceneRenderObject = {
    scene: entry.scene,
    revisionKey: `prompt-gallery-${entry.id}`,
  };
  const onRenderProbe = (event: SceneRenderProbeEvent) => {
    setRenderStatus(event.status === "ready" ? "ready" : "failed");
  };
  return (
    <main
      className="prompt-gallery-capture"
      data-gallery-ready={renderStatus === "ready" ? "true" : "false"}
      data-render-status={renderStatus}
      data-prompt-id={entry.id}
    >
      <header>
        <div>
          <span>{String(entry.index).padStart(2, "0")} / 50</span>
          <span>{entry.category}</span>
        </div>
        <h1>{entry.title}</h1>
        <p>{entry.prompt}</p>
      </header>
      <section aria-label={`${entry.title} generated prototype`}>
        <SceneRenderer
          className="prompt-gallery-renderer"
          objects={[renderObject]}
          sceneTint={entry.tint}
          onRenderProbe={onRenderProbe}
          reducedMotion
          enableOrbitControls={false}
        />
      </section>
      <footer>
        <span>Protofetti procedural brush</span>
        <span>{entry.scene.stats.vertices} vertices</span>
        <span>{entry.scene.stats.objects} marks</span>
        <span>{entry.deterministic ? "Deterministic" : "Non-deterministic"}</span>
      </footer>
    </main>
  );
}

function GalleryStory() {
  const data = galleryData;
  return (
    <main
      className="prompt-gallery-index"
      data-gallery-ready={data.entries.length === 50 ? "true" : "false"}
    >
      <header>
        <p>Protofetti stress test</p>
        <h1>50 prompt-driven prototype sketches</h1>
        <span>
          Production compiler and renderer · {data.viewport.width}×{data.viewport.height}
          captures · {data.failures.length} generation failures
        </span>
      </header>
      {categories.map((category) => {
        const entries = data.entries.filter((entry) => entry.category === category);
        return (
          <section key={category}>
            <header>
              <h2>{category}</h2>
              <span>{entries.length} prompts</span>
            </header>
            <div className="prompt-gallery-grid">
              {entries.map((entry) => {
                const filename = `${String(entry.index).padStart(2, "0")}-${entry.id}.png`;
                return (
                  <article key={entry.id} data-prompt-id={entry.id}>
                    <a
                      href={`?story=diorama--prompt-gallery--capture&prompt-id=${entry.id}&mode=preview&theme=light`}
                      aria-label={`Open ${entry.title} capture`}
                    >
                      <img
                        src={`${screenshotRoot}/${filename}`}
                        alt={`${entry.title} generated prototype screenshot`}
                        width="1440"
                        height="900"
                        loading="eager"
                      />
                    </a>
                    <div>
                      <span>{String(entry.index).padStart(2, "0")}</span>
                      <span>{entry.category}</span>
                    </div>
                    <h3>{entry.title}</h3>
                    <p>{entry.prompt}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}

export default {
  // Preserve the established review URL while the visible product name is Protofetti.
  title: "Diorama / Prompt gallery",
};

export const Gallery = () => <GalleryStory />;
Gallery.storyName = "Gallery";

export const Capture = () => <CaptureStory />;
Capture.storyName = "Capture";
