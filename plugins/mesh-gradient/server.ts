import { createHash, randomUUID } from "node:crypto";

import { defineRpcContract, type BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

import {
  DEFAULT_POINTS,
  EDIT_MAX_POINTS,
  MAX_POINTS,
  MAX_RADIUS,
  MESH_STYLE_NAMES,
  MIN_POINTS,
  MIN_RADIUS,
  generateFromColor,
  generateMeshGradient,
  nameFor,
  normalizeSeed,
  randomSeed,
  toCss,
  toCssLayers,
  toSvg,
  type MeshGradientSpec,
  type MeshPoint,
} from "./gradient.js";

const SAVED_PREFIX = "saved/";
const REALTIME_CHANNEL = "gradients";

export const meshPointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  hue: z.number().min(0).max(360),
  saturation: z.number().min(0).max(100),
  lightness: z.number().min(0).max(100),
  radius: z.number().min(MIN_RADIUS / 2).max(MAX_RADIUS),
});

export const savedGradientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  seed: z.number().int().nonnegative(),
  style: z.enum(MESH_STYLE_NAMES),
  edited: z.boolean(),
  points: z.array(meshPointSchema).min(1).max(EDIT_MAX_POINTS),
  customColor: z
    .string()
    .regex(/^#?[0-9a-fA-F]{6}$/)
    .optional(),
  createdAt: z.number().int().nonnegative(),
});

export type SavedGradient = z.infer<typeof savedGradientSchema>;

/** Pre-editor records stored only the generator inputs; points regenerate. */
const legacySavedGradientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  seed: z.number().int().nonnegative(),
  pointCount: z.number().int().min(MIN_POINTS).max(MAX_POINTS),
  style: z.enum(MESH_STYLE_NAMES),
  createdAt: z.number().int().nonnegative(),
});

const saveInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    seed: z.number().int().nonnegative(),
    style: z.enum(MESH_STYLE_NAMES),
    edited: z.boolean(),
    points: z.array(meshPointSchema).min(1).max(EDIT_MAX_POINTS),
    customColor: z
      .string()
      .regex(/^#?[0-9a-fA-F]{6}$/)
      .optional(),
  })
  .strict();

export const meshGradientRpcContract = defineRpcContract({
  listSaved: {
    input: z.null(),
    output: z.object({ gradients: z.array(savedGradientSchema) }),
  },
  saveGradient: {
    input: saveInputSchema,
    output: z.object({
      gradient: savedGradientSchema,
      alreadySaved: z.boolean(),
    }),
  },
  deleteGradient: {
    input: z.object({ id: z.string().min(1) }).strict(),
    output: z.object({ deleted: z.boolean() }),
  },
  exportPng: {
    input: z
      .object({
        projectId: z.string().min(1),
        name: z.string().trim().min(1).max(80),
        base64: z.string().min(1),
      })
      .strict(),
    output: z.object({ path: z.string(), filename: z.string() }),
  },
  exportTokens: {
    input: z
      .object({
        threadId: z.string().min(1).nullable(),
        format: z.enum(["css", "tailwind", "ts"]),
      })
      .strict(),
    output: z.object({ path: z.string(), gradientCount: z.number().int() }),
  },
});

export function specKeyFor(points: MeshPoint[]): string {
  const canonical = points.map((point) => [
    point.x,
    point.y,
    point.hue,
    point.saturation,
    point.lightness,
    point.radius,
  ]);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function specOf(gradient: SavedGradient): MeshGradientSpec {
  return {
    seed: gradient.seed,
    style: gradient.style,
    points: gradient.points,
    ...(gradient.customColor === undefined
      ? {}
      : { customColor: gradient.customColor }),
  };
}

function parseSavedValue(value: unknown): SavedGradient | null {
  const current = savedGradientSchema.safeParse(value);
  if (current.success) return current.data;
  const legacy = legacySavedGradientSchema.safeParse(value);
  if (!legacy.success) return null;
  const spec = generateMeshGradient({
    seed: legacy.data.seed,
    pointCount: legacy.data.pointCount,
    style: legacy.data.style,
  });
  return {
    id: legacy.data.id,
    name: legacy.data.name,
    seed: legacy.data.seed,
    style: legacy.data.style,
    edited: false,
    points: spec.points,
    createdAt: legacy.data.createdAt,
  };
}

async function listSavedGradients(bb: BbPluginApi): Promise<SavedGradient[]> {
  const keys = await bb.storage.kv.list(SAVED_PREFIX);
  const gradients: SavedGradient[] = [];
  for (const key of keys) {
    const value = await bb.storage.kv.get(key);
    const gradient = parseSavedValue(value);
    if (!gradient) continue;
    const upgraded = savedGradientSchema.safeParse(value);
    if (!upgraded.success) await bb.storage.kv.set(key, gradient);
    gradients.push(gradient);
  }
  return gradients.sort((a, b) => b.createdAt - a.createdAt);
}

async function getSavedGradient(
  bb: BbPluginApi,
  id: string,
): Promise<SavedGradient | null> {
  return parseSavedValue(await bb.storage.kv.get(`${SAVED_PREFIX}${id}`));
}

async function saveGradient(
  bb: BbPluginApi,
  input: z.infer<typeof saveInputSchema>,
): Promise<{ gradient: SavedGradient; alreadySaved: boolean }> {
  const key = specKeyFor(input.points);
  const existing = (await listSavedGradients(bb)).find(
    (gradient) => specKeyFor(gradient.points) === key,
  );
  if (existing) return { gradient: existing, alreadySaved: true };
  const gradient: SavedGradient = {
    id: randomUUID(),
    name: input.name.trim(),
    seed: input.seed,
    style: input.style,
    edited: input.edited,
    points: input.points,
    ...(input.customColor === undefined
      ? {}
      : { customColor: input.customColor }),
    createdAt: Date.now(),
  };
  await bb.storage.kv.set(`${SAVED_PREFIX}${gradient.id}`, gradient);
  bb.realtime.publish(REALTIME_CHANNEL, { kind: "changed" });
  return { gradient, alreadySaved: false };
}

function tokenSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "gradient" : slug;
}

/** Unique, stable token names — two "dusky lagoon (custom)" saves can coexist. */
function uniqueSlugs(gradients: SavedGradient[]): Map<string, string> {
  const used = new Set<string>();
  const slugs = new Map<string, string>();
  for (const gradient of gradients) {
    const base = tokenSlug(gradient.name);
    let slug = base;
    let suffix = 2;
    while (used.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(slug);
    slugs.set(gradient.id, slug);
  }
  return slugs;
}

export function renderTokens(
  gradients: SavedGradient[],
  format: "css" | "tailwind" | "ts",
): string {
  const slugs = uniqueSlugs(gradients);
  const banner =
    "Generated by the bb Mesh Gradient plugin. Re-run `bb mesh-gradient tokens` to refresh.";
  const entries = gradients.map((gradient) => {
    const spec = specOf(gradient);
    const layers = toCssLayers(spec);
    return {
      slug: slugs.get(gradient.id) ?? tokenSlug(gradient.name),
      name: gradient.name,
      color: layers.backgroundColor,
      image: layers.backgroundImage,
    };
  });
  if (format === "ts") {
    const body = entries
      .map(
        (entry) =>
          `  ${JSON.stringify(entry.slug)}: {\n` +
          `    name: ${JSON.stringify(entry.name)},\n` +
          `    backgroundColor: ${JSON.stringify(entry.color)},\n` +
          `    backgroundImage: ${JSON.stringify(entry.image)},\n` +
          `  },`,
      )
      .join("\n");
    return [
      `// ${banner}`,
      `export const gradients = {`,
      body,
      `} as const;`,
      ``,
      `export type GradientName = keyof typeof gradients;`,
      ``,
    ].join("\n");
  }
  if (format === "tailwind") {
    const body = entries
      .map(
        (entry) =>
          `        ${JSON.stringify(entry.slug)}: ${JSON.stringify(entry.image)},`,
      )
      .join("\n");
    return [
      `// ${banner}`,
      `module.exports = {`,
      `  theme: {`,
      `    extend: {`,
      `      backgroundImage: {`,
      body,
      `      },`,
      `    },`,
      `  },`,
      `};`,
      ``,
    ].join("\n");
  }
  const body = entries
    .map(
      (entry) =>
        `  /* ${entry.name} */\n` +
        `  --gradient-${entry.slug}-color: ${entry.color};\n` +
        `  --gradient-${entry.slug}: ${entry.image};`,
    )
    .join("\n");
  return [`/* ${banner} */`, `:root {`, body, `}`, ``].join("\n");
}

function gradientContext(gradient: SavedGradient): string {
  const spec = specOf(gradient);
  return [
    `# Mesh gradient “${gradient.name}”`,
    "",
    "Exact values — use them verbatim, do not eyeball or approximate.",
    "",
    "```css",
    toCss(spec),
    "```",
    "",
    "Spec (JSON, for regenerating or converting):",
    "",
    "```json",
    JSON.stringify({ seed: gradient.seed, style: gradient.style, points: gradient.points }),
    "```",
    "",
    `Standalone SVG: run \`bb mesh-gradient show ${gradient.id} --format svg\`.`,
    "Prefer the CSS form (stacked radial-gradient background layers) over a raster asset when the target supports it.",
  ].join("\n");
}

interface GenerateFlags {
  seed: number;
  pointCount: number;
  style: (typeof MESH_STYLE_NAMES)[number];
  format: "css" | "svg" | "json";
  name?: string;
  customColor?: string;
}

function parseGenerateFlags(argv: string[]): GenerateFlags {
  const flags: GenerateFlags = {
    seed: randomSeed(),
    pointCount: DEFAULT_POINTS,
    style: "aurora",
    format: "css",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === "--seed") {
      const seed = Number(value);
      if (!Number.isFinite(seed)) throw new Error("--seed must be a number");
      flags.seed = normalizeSeed(seed);
      index += 1;
    } else if (token === "--points") {
      const points = Number(value);
      if (
        !Number.isInteger(points) ||
        points < MIN_POINTS ||
        points > MAX_POINTS
      ) {
        throw new Error(`--points must be an integer ${MIN_POINTS}-${MAX_POINTS}`);
      }
      flags.pointCount = points;
      index += 1;
    } else if (token === "--style") {
      const style = MESH_STYLE_NAMES.find((name) => name === value);
      if (!style) {
        throw new Error(`--style must be one of: ${MESH_STYLE_NAMES.join(", ")}`);
      }
      flags.style = style;
      index += 1;
    } else if (token === "--format") {
      if (value !== "css" && value !== "svg" && value !== "json") {
        throw new Error("--format must be css, svg, or json");
      }
      flags.format = value;
      index += 1;
    } else if (token === "--name") {
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error("--name requires a value");
      }
      flags.name = value.trim();
      index += 1;
    } else if (token === "--color") {
      if (typeof value !== "string" || !/^#?[0-9a-f]{6}$/i.test(value.trim())) {
        throw new Error("--color requires a hex color like #3366ff");
      }
      flags.customColor = value.trim();
      index += 1;
    } else {
      throw new Error(`unknown flag ${JSON.stringify(token)}`);
    }
  }
  return flags;
}

function renderSpec(spec: MeshGradientSpec, format: "css" | "svg" | "json"): string {
  if (format === "svg") return toSvg(spec);
  if (format === "json") return JSON.stringify(spec, null, 2);
  const header = `/* ${nameFor(spec)} — seed ${spec.seed}, style ${spec.style}, ${spec.points.length} points */`;
  return [header, toCss(spec)].join("\n");
}

function specFromFlags(flags: GenerateFlags): MeshGradientSpec {
  if (flags.customColor) {
    return generateFromColor(flags.customColor, {
      seed: flags.seed,
      pointCount: flags.pointCount,
    });
  }
  return generateMeshGradient({
    seed: flags.seed,
    pointCount: flags.pointCount,
    // "custom" without a color has no hue to build from; fall back.
    style: flags.style === "custom" ? "aurora" : flags.style,
  });
}

function parseShowArgs(argv: string[]): { ref: string; format: "css" | "svg" | "json" } {
  let ref: string | undefined;
  let format: "css" | "svg" | "json" = "css";
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--format") {
      const value = argv[index + 1];
      if (value !== "css" && value !== "svg" && value !== "json") {
        throw new Error("--format must be css, svg, or json");
      }
      format = value;
      index += 1;
    } else if (token.startsWith("--")) {
      throw new Error(`unknown flag ${JSON.stringify(token)}`);
    } else if (ref === undefined) {
      ref = token;
    } else {
      throw new Error("show takes a single gradient id or name");
    }
  }
  if (!ref) throw new Error("usage: bb mesh-gradient show <id-or-name> [--format css|svg|json]");
  return { ref, format };
}

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    tokensPath: {
      type: "string",
      label: "Token file path",
      default: "styles/gradients.css",
    },
    tokenFormat: {
      type: "select",
      label: "Token format",
      options: ["css", "tailwind", "ts"],
      default: "css",
    },
  });

  /**
   * Token files are written on the machine that owns the thread's worktree,
   * never the server's own disk — `run`/rpc execute server-side, so the path
   * has to be resolved through the environment and written with its hostId.
   */
  async function resolveWorktree(
    threadId: string | null,
  ): Promise<{ hostId: string | undefined; root: string }> {
    if (!threadId) {
      throw new Error(
        "Open the studio from a thread so the token file lands in that thread's checkout.",
      );
    }
    const thread = await bb.sdk.threads.get({ threadId });
    const environmentId = thread?.environmentId;
    if (!environmentId) throw new Error("this thread has no environment");
    const environment = await bb.sdk.environments.get({ environmentId });
    const root = environment?.path ?? null;
    if (!root) {
      throw new Error("this thread's environment has no checkout on disk");
    }
    return { hostId: environment.hostId, root };
  }

  bb.rpc.register(meshGradientRpcContract, {
    async listSaved() {
      return { gradients: await listSavedGradients(bb) };
    },
    async saveGradient(input) {
      return saveGradient(bb, input);
    },
    async deleteGradient({ id }) {
      const existing = await bb.storage.kv.get(`${SAVED_PREFIX}${id}`);
      if (existing === undefined) return { deleted: false };
      await bb.storage.kv.delete(`${SAVED_PREFIX}${id}`);
      bb.realtime.publish(REALTIME_CHANNEL, { kind: "changed" });
      return { deleted: true };
    },
    async exportPng({ projectId, name, base64 }) {
      const filename = `${tokenSlug(name)}.png`;
      const uploaded = await bb.sdk.projects.attachments.upload({
        projectId,
        clientFile: Buffer.from(base64, "base64"),
        filename,
        mimeType: "image/png",
      });
      return { path: uploaded.path, filename };
    },
    async exportTokens({ threadId, format }) {
      const gradients = await listSavedGradients(bb);
      if (gradients.length === 0) {
        throw new Error("save a gradient before exporting tokens");
      }
      const { hostId, root } = await resolveWorktree(threadId);
      const { tokensPath } = await settings.get();
      const relative = tokensPath.replace(/^\/+/, "");
      const target = `${root.replace(/\/+$/, "")}/${relative}`;
      const directory = target.slice(0, target.lastIndexOf("/"));
      await bb.sdk.files.mkdir({ hostId, path: directory, rootPath: root });
      const result = await bb.sdk.files.write({
        hostId,
        path: target,
        rootPath: root,
        content: renderTokens(gradients, format),
      });
      if (result.outcome !== "written") {
        throw new Error(`could not write ${relative}: ${result.outcome}`);
      }
      return { path: relative, gradientCount: gradients.length };
    },
  });

  bb.agents.registerTool({
    name: "mesh_gradient",
    description:
      "Generate a mesh gradient background, or read an exact one already saved in the Mesh Gradient library. Returns ready-to-use CSS, SVG, or JSON.",
    instructions:
      "Use mesh_gradient instead of hand-writing gradient CSS. When the user names a saved gradient, read it with action=show so the values are exact.",
    parameters: z.object({
      action: z
        .enum(["generate", "show", "list"])
        .describe("generate a new gradient, show a saved one, or list the library"),
      ref: z
        .string()
        .optional()
        .describe("saved gradient id or exact name, required for action=show"),
      style: z
        .enum(MESH_STYLE_NAMES)
        .optional()
        .describe("palette for action=generate"),
      color: z
        .string()
        .optional()
        .describe("hex like #3366ff — generates a gradient around that hue"),
      seed: z.number().int().optional(),
      points: z.number().int().min(MIN_POINTS).max(MAX_POINTS).optional(),
      format: z.enum(["css", "svg", "json"]).optional(),
    }),
    async execute(input) {
      const format = input.format ?? "css";
      if (input.action === "list") {
        const gradients = await listSavedGradients(bb);
        if (gradients.length === 0) return "The gradient library is empty.";
        return gradients
          .map(
            (gradient) =>
              `${gradient.id}  ${gradient.name}  ${gradient.edited ? "edited" : gradient.style}`,
          )
          .join("\n");
      }
      if (input.action === "show") {
        if (!input.ref) return { content: [{ type: "text", text: "action=show needs a ref" }], isError: true };
        const gradients = await listSavedGradients(bb);
        const match =
          gradients.find((gradient) => gradient.id === input.ref) ??
          gradients.find(
            (gradient) =>
              gradient.name.toLowerCase() === input.ref!.toLowerCase(),
          );
        if (!match) {
          return {
            content: [
              { type: "text", text: `No saved gradient matches ${input.ref}.` },
            ],
            isError: true,
          };
        }
        return renderSpec(specOf(match), format);
      }
      const spec = input.color
        ? generateFromColor(input.color, {
            seed: input.seed,
            pointCount: input.points,
          })
        : generateMeshGradient({
            seed: input.seed ?? randomSeed(),
            pointCount: input.points,
            style: input.style === "custom" ? "aurora" : input.style,
          });
      return renderSpec(spec, format);
    },
  });

  bb.ui.registerMentionProvider({
    id: "gradient",
    label: "Gradients",
    async search({ query }) {
      const gradients = await listSavedGradients(bb);
      const needle = query.trim().toLowerCase();
      // "@gradient" (any prefix of the provider vocabulary) must list the
      // whole library — users type the feature's name, not a gradient's.
      const showAll =
        needle === "" || "gradients".startsWith(needle) || needle === "mesh";
      return gradients
        .filter(
          (gradient) =>
            showAll ||
            gradient.name.toLowerCase().includes(needle) ||
            gradient.style.includes(needle) ||
            (gradient.edited && "edited".includes(needle)),
        )
        .slice(0, 20)
        .map((gradient) => ({
          id: gradient.id,
          title: gradient.name,
          subtitle: `${gradient.edited ? "edited" : gradient.style} · ${gradient.points.length} points`,
        }));
    },
    async resolve(itemId) {
      const gradient = await getSavedGradient(bb, itemId);
      if (!gradient) {
        throw new Error("This gradient was deleted from the Mesh Gradient library.");
      }
      return { context: gradientContext(gradient) };
    },
  });

  bb.cli.register({
    name: "mesh-gradient",
    summary: "Generate, save, and read mesh gradient backgrounds",
    commands: [
      {
        name: "generate",
        summary:
          "Print a mesh gradient as CSS, SVG, or JSON (deterministic per seed)",
        usage:
          "bb mesh-gradient generate [--seed <n>] [--points <3-8>] [--style aurora|sunset|ocean|candy|forest|mono] [--color <#hex>] [--format css|svg|json]",
      },
      {
        name: "tokens",
        summary:
          "Print the whole library as design tokens (CSS variables, Tailwind, or TS)",
        usage: "bb mesh-gradient tokens [--format css|tailwind|ts]",
      },
      {
        name: "show",
        summary: "Print a saved gradient's exact CSS, SVG, or JSON by id or name",
        usage: "bb mesh-gradient show <id-or-name> [--format css|svg|json]",
      },
      {
        name: "save",
        summary: "Save a generated gradient to the shared library",
        usage:
          "bb mesh-gradient save [--name <text>] [--seed <n>] [--points <3-8>] [--style <style>]",
      },
      {
        name: "list",
        summary: "List saved gradients with their ids, styles, and seeds",
        usage: "bb mesh-gradient list",
      },
    ],
    async run(argv) {
      const [command, ...rest] = argv;
      try {
        if (command === "generate") {
          const flags = parseGenerateFlags(rest);
          const spec = specFromFlags(flags);
          return { exitCode: 0, stdout: `${renderSpec(spec, flags.format)}\n` };
        }
        if (command === "show") {
          const { ref, format } = parseShowArgs(rest);
          const gradients = await listSavedGradients(bb);
          const byId = gradients.find((gradient) => gradient.id === ref);
          const byName = gradients.filter(
            (gradient) => gradient.name.toLowerCase() === ref.toLowerCase(),
          );
          const match = byId ?? (byName.length === 1 ? byName[0] : undefined);
          if (!match) {
            if (byName.length > 1) {
              const ids = byName.map((gradient) => gradient.id).join(", ");
              throw new Error(`name ${JSON.stringify(ref)} is ambiguous: ${ids}`);
            }
            throw new Error(`no saved gradient matches ${JSON.stringify(ref)}`);
          }
          return { exitCode: 0, stdout: `${renderSpec(specOf(match), format)}\n` };
        }
        if (command === "save") {
          const flags = parseGenerateFlags(rest);
          const spec = specFromFlags(flags);
          const { gradient, alreadySaved } = await saveGradient(bb, {
            name: flags.name ?? nameFor(spec),
            seed: spec.seed,
            style: spec.style,
            edited: false,
            points: spec.points,
            ...(spec.customColor === undefined
              ? {}
              : { customColor: spec.customColor }),
          });
          return {
            exitCode: 0,
            stdout: alreadySaved
              ? `already saved as ${JSON.stringify(gradient.name)} (id ${gradient.id})\n`
              : `saved ${JSON.stringify(gradient.name)} (id ${gradient.id}, seed ${gradient.seed})\n`,
          };
        }
        if (command === "list") {
          const gradients = await listSavedGradients(bb);
          if (gradients.length === 0) {
            return { exitCode: 0, stdout: "no saved gradients\n" };
          }
          const lines = gradients.map(
            (gradient) =>
              `${gradient.id}  ${gradient.name}  ${gradient.edited ? "edited" : `style=${gradient.style}`} seed=${gradient.seed} points=${gradient.points.length}`,
          );
          return { exitCode: 0, stdout: `${lines.join("\n")}\n` };
        }
        if (command === "tokens") {
          const gradients = await listSavedGradients(bb);
          if (gradients.length === 0) {
            return { exitCode: 1, stderr: "no saved gradients to export\n" };
          }
          let format: "css" | "tailwind" | "ts" = (
            await settings.get()
          ).tokenFormat as "css" | "tailwind" | "ts";
          for (let index = 0; index < rest.length; index += 1) {
            if (rest[index] === "--format") {
              const value = rest[index + 1];
              if (value !== "css" && value !== "tailwind" && value !== "ts") {
                throw new Error("--format must be css, tailwind, or ts");
              }
              format = value;
              index += 1;
            } else {
              throw new Error(`unknown flag ${JSON.stringify(rest[index])}`);
            }
          }
          return { exitCode: 0, stdout: renderTokens(gradients, format) };
        }
        return {
          exitCode: 1,
          stderr: "usage: bb mesh-gradient <generate|show|save|list|tokens>\n",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { exitCode: 1, stderr: `${message}\n` };
      }
    },
  });

  bb.log.info("Mesh Gradient loaded");
}
