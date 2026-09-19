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
      "Render agent-authored sketch source for the current Protofetti prompt.",
    instructions:
      "For new work, submit exactly one JavaScript function body in source. THREE and the bounded procedural BRUSH API are already in scope; use BRUSH for the visible drawing and THREE only for grouping. Every BRUSH stroke returns a Group: attach it with root.add(brush.stroke(...)); a bare brush.stroke(...) call leaves root empty. Return { root, name, altText, camera?, movement?, shadow? }. Call at most twice: one submission and, only after actionable validation issues, one correction. Stop after one scene is accepted.",
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
        "This is a Protofetti canvas interpreter thread. A progress-only turn requests four visualization notes and must not call tools. The immediately following build turn turns that same job into procedural sketch source using the sceneseed-interpreter skill and submits it with submit_scene_object. Use only the supplied job context and Protofetti submit tool. Do not inspect unrelated files or context, use network access, or call unrelated tools. BB may still supply core/provider tools and shared instructions; this selection is not an exclusive capability allowlist.",
    };
  });

  runtime.registerLifecycle();
  registerSceneSeedCli(bb, runtime);
}
