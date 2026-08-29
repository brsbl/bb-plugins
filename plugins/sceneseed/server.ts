import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { registerSceneSeedCli } from "./cli.js";
import { rpcContract } from "./server/rpc-contract.js";
import {
  SceneSeedRuntime,
  submitSceneObjectParameters,
} from "./server/runtime.js";
import { createSceneSeedStore } from "./store.js";

export { rpcContract } from "./server/rpc-contract.js";

export default async function sceneSeedPlugin(bb: BbPluginApi): Promise<void> {
  bb.settings.define({
    rendererQuality: {
      type: "select",
      label: "Renderer quality",
      description:
        "Balanced favors smooth interaction; High favors denser shadows and effects.",
      options: ["balanced", "high"],
      default: "balanced",
    },
    defaultMotion: {
      type: "select",
      label: "Generated motion",
      description:
        "Allow the interpreter's bounded motion preset or keep new scenes still by default.",
      options: ["playful", "still"],
      default: "playful",
    },
    diagnostics: {
      type: "boolean",
      label: "Local diagnostics",
      description:
        "Show prompt-free renderer and queue counters. Scene and prompt contents are never included.",
      default: false,
    },
  });

  const store = createSceneSeedStore(bb.storage.database());
  const runtime = new SceneSeedRuntime(bb, store);

  bb.rpc.register(rpcContract, {
    listCanvases() {
      return {
        canvases: runtime.listCanvases(),
        disclosureAcknowledged: runtime.isDisclosureAcknowledged(),
      };
    },
    getCanvas({ canvasId }) {
      return { snapshot: runtime.getCanvasSnapshot(canvasId) };
    },
    createCanvas({ name }) {
      return { snapshot: runtime.createCanvas(name) };
    },
    async renameCanvas(input) {
      return { snapshot: await runtime.renameCanvas(input) };
    },
    acknowledgeDisclosure() {
      return runtime.acknowledgeDisclosure();
    },
    async createCard(input) {
      const result = await runtime.createCard(input);
      return { snapshot: result.snapshot, cardId: result.cardId };
    },
    placeCard(input) {
      return runtime.placeCard(input);
    },
    remixObject(input) {
      return runtime.remixObject(input);
    },
    beginRealization(input) {
      return runtime.beginRealization(input);
    },
    acknowledgeRealization(input) {
      return runtime.acknowledgeRealization(input);
    },
    async updateObjectTransform(input) {
      return { snapshot: await runtime.updateObjectTransform(input) };
    },
    duplicateObject(input) {
      return runtime.duplicateObject(input);
    },
    async cancelJob({ jobId }) {
      return { snapshot: await runtime.cancelJob(jobId) };
    },
    async removeObject(input) {
      return { snapshot: await runtime.removeObject(input) };
    },
    deleteCanvas(input) {
      return runtime.deleteCanvas(input);
    },
    clearAllCanvasData() {
      return runtime.clearAllCanvasData();
    },
  });

  bb.agents.registerTool({
    name: "submit_scene_object",
    description:
      "Render agent-authored Three.js source for the current SceneSeed prompt.",
    instructions:
      "For new work, submit exactly one JavaScript function body in source. THREE is already in scope; return { root, name, altText, camera?, movement?, shadow? }. Call at most twice: one submission and, only after actionable validation issues, one correction. Stop after one scene is accepted.",
    parameters: submitSceneObjectParameters,
    execute(params, context) {
      return runtime.submitSceneObject(params, context.threadId);
    },
  });

  bb.agents.configure((context) => {
    if (
      context.origin.pluginId !== bb.pluginId ||
      context.project.kind !== "personal"
    ) {
      return { tools: [], skills: [] };
    }
    return {
      tools: ["submit_scene_object"],
      skills: ["sceneseed-interpreter"],
      instructions:
        "This is a SceneSeed canvas interpreter thread. A progress-only turn requests four visualization notes and must not call tools. The immediately following build turn turns that same job into Three.js source using the sceneseed-interpreter skill and submits it with submit_scene_object. Use only the supplied job context and SceneSeed submit tool. Do not inspect unrelated files or context, use network access, or call unrelated tools. BB may still supply core/provider tools and shared instructions; this selection is not an exclusive capability allowlist.",
    };
  });

  runtime.registerLifecycle();
  registerSceneSeedCli(bb, runtime);
}
