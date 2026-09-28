import { randomUUID } from "node:crypto";

import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  CONTROL_SPECS,
  MAX_PARAMS,
  MAX_SOURCE_LENGTH,
  PARAM_ID_PATTERN,
  SHADER_CONTRACT,
  type ControlKey,
  type Controls,
} from "./contract.js";
import { parseDailyOptions } from "./daily.js";
import { createOperations } from "./operations.js";
import { describeContext, describeVisibility } from "./reports.js";
import {
  ambientRpcContract,
  controlsSchema,
  dailyUpdateSchema,
  formatIssues,
  hexColor,
  paletteSchema,
  rippleKindSchema,
  sceneNameSchema,
  sceneRequestSchema,
  type AmbientState,
} from "./rpc.js";

export { applyValues } from "./operations.js";
export { describeContext, describeVisibility } from "./reports.js";
export { sceneNameSchema, sceneRequestSchema } from "./rpc.js";
export type { AmbientState, CaptureRequest, DailyScene } from "./rpc.js";
export {
  DAILY_CONCEPTS,
  cronHour,
  dailyConcept,
  dailyCron,
  dailyPrompt,
  localMoment,
  parseDailyOptions,
} from "./daily.js";

const RETIRED_CONTROLS = new Set(["detail", "quality"]);

function describeControls(controls: Controls): string {
  const ranges = CONTROL_SPECS.map((spec) => `${spec.label} ${spec.format(controls[spec.key])}`);
  return `${controls.enabled ? "on" : "off"}; ${ranges.join(", ")}`;
}

function describeScene(state: AmbientState, options: { source: boolean }): string {
  const { scene, controls } = state;
  const params = scene.params
    .map(
      (entry) =>
        `  ${entry.id} = ${entry.value}  (${entry.label}; ${entry.min}..${entry.max}, step ${entry.step})`,
    )
    .join("\n");
  return [
    `Scene: ${scene.name}`,
    `Palette: ${scene.palette.join(" ")}`,
    `Params:\n${params || "  (none)"}`,
    `Controls: ${describeControls(controls)}`,
    ...(options.source ? [`Source:\n${scene.source}`] : []),
  ].join("\n");
}

/** The agent-facing names for the display controls, generated from the one spec table. */
const controlInputSchema = z
  .object({
    enabled: z.boolean(),
    ...Object.fromEntries(
      CONTROL_SPECS.map((spec) => [
        spec.name,
        controlsSchema.shape[spec.key].describe(`${spec.describe} (${spec.min}..${spec.max}, default ${spec.default})`),
      ]),
    ),
  })
  .partial()
  .strict();

function controlsFromInput(input: Record<string, unknown>): Partial<Controls> {
  const controls: Partial<Controls> = {};
  if (typeof input.enabled === "boolean") controls.enabled = input.enabled;
  for (const spec of CONTROL_SPECS) {
    const value = input[spec.name];
    if (typeof value === "number") controls[spec.key] = value;
  }
  return controls;
}

const CLI_CONTROL_KEYS = new Map<string, ControlKey>(
  CONTROL_SPECS.flatMap((spec) => [spec.name, ...spec.aliases].map((name) => [name, spec.key] as const)),
);

const CLI_CONTROL_NAMES = CONTROL_SPECS.map((spec) => spec.name).join("|");

export function parseSetPairs(pairs: readonly string[]): {
  values: Record<string, number>;
  controls: Partial<Controls>;
} {
  const values: Record<string, number> = {};
  const controls: Partial<Controls> = {};
  for (const pair of pairs) {
    const match = /^([a-z][a-z0-9_]*)=(-?\d+(?:\.\d+)?)(%?)$/.exec(pair);
    if (!match) throw new Error(`expected <param>=<number>, got ${JSON.stringify(pair)}`);
    const [, key, number, percent] = match;
    if (RETIRED_CONTROLS.has(key!)) {
      throw new Error("Detail is set per device, in the Display section of the Ambient panel");
    }
    const control = CLI_CONTROL_KEYS.get(key!);
    const value = Number(number) / (percent ? 100 : 1);
    if (control) {
      controls[control] = value;
    } else {
      values[key!] = value;
    }
  }
  return { values, controls };
}

function messageOf(caught: unknown): string {
  if (caught instanceof z.ZodError) return formatIssues(caught);
  return caught instanceof Error ? caught.message : String(caught);
}

export default function plugin(bb: BbPluginApi): void {
  const ops = createOperations(bb);

  async function libraryLines(): Promise<string[]> {
    return (await ops.library()).map(
      (entry) => `${entry.id}  ${entry.name}${entry.builtIn ? "  (built-in)" : ""}`,
    );
  }

  bb.rpc.register(ambientRpcContract, {
    state: () => ops.readState(),
    setValues: ({ values }) => ops.editScene({ values }),
    setPalette: ({ palette }) => ops.editScene({ palette }),
    setControls: (controls) => ops.setControls(controls),
    loadScene: ({ id }) => ops.loadScene(id),
    resetScene: ({ id }) => ops.resetScene(id),
    async saveScene({ name }) {
      return { id: await ops.saveScene(name) };
    },
    async deleteScene({ id }) {
      return { deleted: await ops.deleteScene(id) };
    },
    async library() {
      return { entries: await ops.library() };
    },
    async reportCompile({ sceneRevision, ok, log }) {
      return { accepted: await ops.reportCompile(sceneRevision, { ok, ...(log === undefined ? {} : { log }) }) };
    },
    submitCapture({ requestId, context, ...report }) {
      return { accepted: ops.submitCapture(requestId, { ...report, context: context ?? null }) };
    },
    daily: () => ops.readDaily(),
    setDaily: (update) => ops.updateDaily(update),
    async paintNow() {
      return { threadId: await ops.spawnPainter() };
    },
    async paintRequest({ request }) {
      return { threadId: await ops.spawnPainter(request) };
    },
    heartbeat() {
      ops.heartbeat();
      return { ok: true };
    },
  });

  bb.agents.registerTool({
    name: "ambient",
    description:
      "Read, rewrite, and look at the Ambient scene: the live GLSL background bb paints behind its UI, driven by what the user's agents are doing. The user tunes it with sliders generated from the params you declare.",
    instructions:
      "When the user asks to change bb's ambient background, call ambient action=get first for the shader contract and current source, then action=set, then action=look to see the result before describing it. Expose the knobs a person would want to play with as params rather than hard-coding them. To make the background subtler or bolder without rewriting the scene, use action=set with controls.visibility. When the user describes a new scene they want, call action=brief with request set to their words and follow the instructions it returns.",
    presentation: {
      label: { pending: "Painting the ambient scene", completed: "Painted the ambient scene" },
    },
    parameters: z.object({
      action: z
        .enum(["get", "set", "look", "library", "load", "save", "delete", "brief"])
        .describe(
          "get: shader contract + current scene. set: replace any of name/source/params/palette, nudge values, or change controls. look: capture the scene behind bb's real UI as the user sees it, plus the raw scene, with readability and visibility checks. library/load/save/delete: manage saved scenes. brief: step-by-step instructions for painting a new scene; pass request to paint what the user described, or omit it for today's daily concept.",
        ),
      name: sceneNameSchema.optional().describe("scene name (set, save); on set, omit it to edit the open scene, or pass a new name to start a new scene"),
      source: z
        .string()
        .max(MAX_SOURCE_LENGTH)
        .optional()
        .describe("GLSL defining vec3 scene(vec2 uv, vec2 p); see action=get"),
      params: z
        .array(
          z.object({
            id: z.string().regex(PARAM_ID_PATTERN),
            label: z.string().min(1).max(40),
            min: z.number(),
            max: z.number(),
            step: z.number().positive().optional(),
            value: z.number(),
          }),
        )
        .max(MAX_PARAMS)
        .optional()
        .describe("full slider list; each becomes uniform float p_<id>"),
      values: z
        .record(z.string(), z.number())
        .optional()
        .describe("set existing param values by id"),
      palette: z.array(hexColor).length(4).optional().describe("four #rrggbb colors"),
      controls: controlInputSchema
        .optional()
        .describe("user display controls; render resolution is set per device and is not available here"),
      ripple: rippleKindSchema
        .optional()
        .describe("look: fire a test ripple of this kind just before capturing"),
      id: z.string().optional().describe("scene id or name for action=load and action=delete"),
      request: sceneRequestSchema
        .optional()
        .describe("brief: the user's own description of the scene to paint, in their words"),
    }),
    async execute(input) {
      const error = (text: string) => ({
        content: [{ type: "text" as const, text }],
        isError: true,
      });
      try {
        switch (input.action) {
          case "get":
            return `${SHADER_CONTRACT}\n\n---\n${describeScene(await ops.readState(), { source: true })}`;
          case "library":
            return (await libraryLines()).join("\n");
          case "brief":
            return ops.brief(new Date(), input.request);
          case "load": {
            if (!input.id) return error("action=load needs an id");
            return `Loaded ${(await ops.loadScene(input.id)).scene.name}.`;
          }
          case "save":
            return `Saved as ${await ops.saveScene(input.name)}.`;
          case "delete": {
            if (!input.id) return error("action=delete needs an id");
            return (await ops.deleteScene(input.id))
              ? `Deleted ${input.id}.`
              : error(`no saved scene ${JSON.stringify(input.id)}; built-in scenes cannot be deleted`);
          }
          case "look": {
            const report = await ops.capture({ requestId: randomUUID(), ripple: input.ripple ?? null });
            if (!report) {
              return error("No visible bb window answered. The user needs bb open in the foreground with Ambient enabled.");
            }
            const { working, waiting } = report.summary;
            const png = (dataUrl: string) => ({
              type: "image" as const,
              data: dataUrl.slice("data:image/png;base64,".length),
              mimeType: "image/png",
            });
            return {
              content: [
                ...(report.context ? [png(report.context.dataUrl)] : []),
                png(report.dataUrl),
                {
                  type: "text" as const,
                  text: [
                    report.context
                      ? describeContext(report.context.report)
                      : "Captured the raw scene only; this bb window could not draw its UI over it.",
                    `Live agents: ${working} working, ${waiting} waiting. ${describeVisibility(report.visibility, report.dark)}`,
                  ].join("\n"),
                },
              ],
            };
          }
          case "set": {
            const structural = input.source !== undefined || input.params !== undefined;
            const next = await ops.editScene({
              ...(input.name === undefined ? {} : { name: input.name }),
              ...(input.source === undefined ? {} : { source: input.source }),
              ...(input.params === undefined ? {} : { params: input.params }),
              ...(input.palette === undefined ? {} : { palette: paletteSchema.parse(input.palette) }),
              ...(input.values === undefined ? {} : { values: input.values }),
              controls: controlsFromInput(input.controls ?? {}),
            });
            return structural
              ? `Compiled and live: ${next.scene.name} with ${next.scene.params.length} sliders.`
              : `Updated ${next.scene.name}. Controls: ${describeControls(next.controls)}.`;
          }
        }
      } catch (caught) {
        return error(messageOf(caught));
      }
    },
  });

  bb.cli.register({
    name: "ambient",
    summary: "Control bb's generative ambient background",
    commands: [
      { name: "status", summary: "Show the active scene, its params, and controls", usage: "bb ambient status" },
      { name: "list", summary: "List built-in and saved scenes", usage: "bb ambient list" },
      { name: "load", summary: "Make a built-in or saved scene active", usage: "bb ambient load <id-or-name>" },
      { name: "reset", summary: "Restore a scene's original version: a built-in's shader, sliders, colors, and default display settings, or a saved scene as first saved", usage: "bb ambient reset <scene-id>" },
      {
        name: "set",
        summary: `Set scene params or the ${CONTROL_SPECS.map((spec) => spec.label).join(", ")} controls`,
        usage: `bb ambient set <param|${CLI_CONTROL_NAMES}>=<value>[%] [...]`,
      },
      { name: "palette", summary: "Set the scene's four colors", usage: "bb ambient palette <#rrggbb> <#rrggbb> <#rrggbb> <#rrggbb>" },
      { name: "save", summary: "Save the active scene to the library", usage: "bb ambient save [name]" },
      { name: "delete", summary: "Remove a saved scene from the library", usage: "bb ambient delete <id>" },
      { name: "on", summary: "Turn the background on", usage: "bb ambient on" },
      { name: "off", summary: "Turn the background off", usage: "bb ambient off" },
      {
        name: "paint",
        summary: "Start a thread where an agent paints the scene you describe",
        usage: "bb ambient paint <description>",
      },
      {
        name: "daily",
        summary: "Have an agent paint a new scene every morning",
        usage: "bb ambient daily <status|on [hour] [time-zone]|off|now>",
      },
    ],
    async run(argv) {
      const [command, ...rest] = argv;
      const argument = rest.join(" ").trim();
      const ok = (stdout: string) => ({ exitCode: 0, stdout: `${stdout}\n` });
      try {
        switch (command) {
          case "status":
            return ok(describeScene(await ops.readState(), { source: false }));
          case "list":
            return ok((await libraryLines()).join("\n"));
          case "load":
            if (!argument) throw new Error("usage: bb ambient load <id-or-name>");
            return ok(`loaded ${(await ops.loadScene(argument)).scene.name}`);
          case "set": {
            if (rest.length === 0) throw new Error(`usage: bb ambient set <param|${CLI_CONTROL_NAMES}>=<value>[%] [...]`);
            const { values, controls } = parseSetPairs(rest);
            const next = await ops.editScene({ values, controls });
            const applied = next.scene.params
              .filter((entry) => Object.hasOwn(values, entry.id))
              .map((entry) => `${entry.id}=${entry.value}`);
            if (Object.keys(controls).length > 0) applied.push(describeControls(next.controls));
            return ok(applied.join("\n"));
          }
          case "palette": {
            const palette = paletteSchema.parse(rest);
            await ops.editScene({ palette });
            return ok(`palette ${palette.join(" ")}`);
          }
          case "save":
            return ok(`saved as ${await ops.saveScene(argument ? sceneNameSchema.parse(argument) : undefined)}`);
          case "delete":
            if (!argument) throw new Error("usage: bb ambient delete <id>");
            if (!(await ops.deleteScene(argument))) {
              throw new Error(`no saved scene ${JSON.stringify(argument)}; built-in scenes cannot be deleted`);
            }
            return ok(`deleted ${argument}`);
          case "on":
          case "off":
            await ops.setControls({ enabled: command === "on" });
            return ok(`ambient ${command}`);
          case "reset":
            if (!argument) throw new Error("usage: bb ambient reset <scene-id>");
            return ok(`reset ${(await ops.resetScene(argument)).scene.name}`);
          case "paint":
            return ok(`painting in ${await ops.spawnPainter(sceneRequestSchema.parse(argument))}`);
          case "daily": {
            const [action = "status", ...options] = rest;
            if (action === "now") return ok(`painting in ${await ops.spawnPainter()}`);
            if (action === "on" || action === "off") {
              await ops.updateDaily(
                dailyUpdateSchema.parse({ enabled: action === "on", ...parseDailyOptions(options) }),
              );
            } else if (action !== "status") {
              throw new Error("usage: bb ambient daily <status|on [hour] [time-zone]|off|now>");
            }
            const daily = await ops.readDaily();
            const schedule = daily.enabled
              ? `on, after ${daily.hour}:00 ${daily.timeZone} (bb automation ${daily.automationId})`
              : "off";
            const next = daily.enabled && daily.nextRunAt ? new Date(daily.nextRunAt).toISOString() : "none";
            return ok(`daily scene: ${schedule}\nnext run: ${next}`);
          }
        }
        return {
          exitCode: 1,
          stderr: "usage: bb ambient <status|list|load|set|palette|save|delete|on|off|reset|paint|daily>\n",
        };
      } catch (caught) {
        return { exitCode: 1, stderr: `${messageOf(caught)}\n` };
      }
    },
  });

  bb.log.info("Ambient loaded");
}
