import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { cliCommand, defineCli, defineRpcContract, type BbPluginApi, type PluginCliContext } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { MAX_IMAGE_BYTES, carouselIdSchema, carouselInputSchema, carouselSchema, imageTypes, sha256Schema, sniffImageType, type Carousel, type ImageRef } from "./model.js";

export const rpcContract = defineRpcContract({
  get: { input: z.object({ id: carouselIdSchema }).strict(), output: carouselSchema },
  image: {
    input: z.object({ sha256: sha256Schema }).strict(),
    output: z.object({ mimeType: z.enum(imageTypes), data: z.string().max(Math.ceil(MAX_IMAGE_BYTES / 3) * 4) }).strict(),
  },
});

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export type ImageFile = { bytes: Buffer; name: string };
export type ReadImage = (request: { threadId: string; cwd?: string; path: string }) => Promise<ImageFile>;

export function createStore(bb: BbPluginApi, readImage: ReadImage) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    "CREATE TABLE carousels (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, value TEXT NOT NULL, created_at TEXT NOT NULL)",
    "CREATE INDEX carousels_thread ON carousels (thread_id, created_at)",
    "CREATE TABLE images (sha256 TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BLOB NOT NULL)",
    "CREATE TABLE carousel_images (carousel_id TEXT NOT NULL, sha256 TEXT NOT NULL, PRIMARY KEY (carousel_id, sha256))",
    "CREATE INDEX carousel_images_sha ON carousel_images (sha256)",
  ]);
  const get = (id: string): Carousel => {
    const row = db.prepare("SELECT value FROM carousels WHERE id = ?").get(carouselIdSchema.parse(id)) as { value: string } | undefined;
    if (!row) throw new Error("This carousel is unavailable. It may have been removed.");
    return carouselSchema.parse(JSON.parse(row.value));
  };
  return {
    get,
    image(sha256: string) {
      const row = db.prepare("SELECT mime_type, data FROM images WHERE sha256 = ?").get(sha256Schema.parse(sha256)) as { mime_type: ImageRef["mimeType"]; data: Buffer } | undefined;
      if (!row) throw new Error("This image is unavailable.");
      return { mimeType: row.mime_type, data: row.data.toString("base64") };
    },
    async create(threadId: string, raw: unknown, cwd?: string): Promise<Carousel> {
      const input = carouselInputSchema.parse(raw);
      const files = new Map<string, { ref: ImageRef; bytes: Buffer }>();
      const load = async (file: string) => {
        const known = files.get(file);
        if (known) return known.ref;
        const { bytes, name } = await readImage({ threadId, cwd, path: file });
        if (bytes.length > MAX_IMAGE_BYTES) throw new Error(`${file} is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
        const mimeType = sniffImageType(bytes);
        if (!mimeType) throw new Error(`${file} is not a PNG, JPEG, GIF, or WebP image.`);
        const ref = { sha256: createHash("sha256").update(bytes).digest("hex"), mimeType, name: name.slice(0, 255) };
        files.set(file, { ref, bytes });
        return ref;
      };
      const base = { id: `ic_${Array.from(randomBytes(12), (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join("")}`, threadId, ...(input.title ? { title: input.title } : {}), createdAt: new Date().toISOString() };
      const carousel = carouselSchema.parse(input.kind === "research"
        ? { ...base, kind: input.kind, slides: await sequential(input.slides, async ({ image, ...slide }) => ({ ...slide, image: await load(image) })) }
        : { ...base, kind: input.kind, slides: await sequential(input.slides, async ({ before, after, ...slide }) => ({ ...slide, before: await load(before), after: await load(after) })) });
      db.transaction(() => {
        const image = db.prepare("INSERT OR IGNORE INTO images VALUES (?, ?, ?)");
        const link = db.prepare("INSERT OR IGNORE INTO carousel_images VALUES (?, ?)");
        for (const { ref, bytes } of files.values()) { image.run(ref.sha256, ref.mimeType, bytes); link.run(carousel.id, ref.sha256); }
        db.prepare("INSERT INTO carousels VALUES (?, ?, ?, ?)").run(carousel.id, threadId, JSON.stringify(carousel), carousel.createdAt);
      })();
      return carousel;
    },
    list(threadId?: string) {
      const rows = (threadId
        ? db.prepare("SELECT value FROM carousels WHERE thread_id = ? ORDER BY created_at DESC").all(threadId)
        : db.prepare("SELECT value FROM carousels ORDER BY created_at DESC").all()) as { value: string }[];
      return rows.map((row) => {
        const carousel = carouselSchema.parse(JSON.parse(row.value));
        return { id: carousel.id, threadId: carousel.threadId, kind: carousel.kind, title: carousel.title ?? null, slides: carousel.slides.length, createdAt: carousel.createdAt };
      });
    },
    remove(id: string) {
      const carousel = get(id);
      db.transaction(() => {
        db.prepare("DELETE FROM carousels WHERE id = ?").run(carousel.id);
        const shas = (db.prepare("SELECT sha256 FROM carousel_images WHERE carousel_id = ?").all(carousel.id) as { sha256: string }[]).map((row) => row.sha256);
        db.prepare("DELETE FROM carousel_images WHERE carousel_id = ?").run(carousel.id);
        const orphan = db.prepare("DELETE FROM images WHERE sha256 = ? AND NOT EXISTS (SELECT 1 FROM carousel_images WHERE sha256 = ?)");
        for (const sha of shas) orphan.run(sha, sha);
      })();
      return { id: carousel.id, removed: true };
    },
  };
}

async function sequential<T, R>(items: T[], map: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (const item of items) results.push(await map(item));
  return results;
}

export function readFromThreadHost(bb: BbPluginApi): ReadImage {
  return async ({ threadId, cwd, path: file }) => {
    const thread = await bb.sdk.threads.get({ threadId, include: "environment" });
    const environment = "environment" in thread ? thread.environment ?? null : null;
    const hostId = environment?.hostId ?? (await bb.sdk.system.config()).primaryHostId ?? undefined;
    if (!hostId) throw new Error("No machine is available to read these images.");
    const root = cwd ?? environment?.path;
    if (!path.isAbsolute(file) && !root) throw new Error(`Use an absolute path for ${file}; this thread has no workspace.`);
    const resolved = path.isAbsolute(file) ? file : path.resolve(root!, file);
    const result = await bb.sdk.files.read({ hostId, path: resolved });
    if (result.sizeBytes > MAX_IMAGE_BYTES) throw new Error(`${file} is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
    if (result.contentEncoding !== "base64") throw new Error(`${file} is not a PNG, JPEG, GIF, or WebP image.`);
    return { bytes: Buffer.from(result.content, "base64"), name: path.basename(resolved) };
  };
}

export default function plugin(bb: BbPluginApi): void {
  const store = createStore(bb, readFromThreadHost(bb));
  bb.rpc.register(rpcContract, {
    get: ({ id }) => store.get(id),
    image: ({ sha256 }) => store.image(sha256),
  });
  const threadOf = (ctx: PluginCliContext, thread?: string) => {
    const threadId = thread ?? ctx.threadId;
    if (!threadId) throw new Error("Run this from a bb thread or pass --thread.");
    return threadId;
  };
  const json = (value: unknown) => ({ exitCode: 0, stdout: `${JSON.stringify(value, null, 2)}\n` });
  const idPosition = [{ name: "id", required: true, description: "Carousel ID printed by create" }] as const;
  bb.cli.register(defineCli({
    name: "image-carousel", summary: "Show screenshots inline as a research or before/after carousel",
    commands: {
      create: cliCommand({
        summary: "Copy the images into a new carousel and print its directive",
        options: {
          thread: { type: "string", description: "Owning thread; defaults to this thread" },
          carousel: { type: "string", required: true, stdin: true, description: "Carousel JSON; use --carousel-stdin" },
        },
        async run({ options }, ctx) {
          const threadId = threadOf(ctx, options.thread);
          const cwd = options.thread === undefined || options.thread === ctx.threadId ? ctx.cwd : undefined;
          const carousel = await store.create(threadId, JSON.parse(options.carousel), cwd);
          return { exitCode: 0, stdout: `::image-carousel{id="${carousel.id}"}\n` };
        },
      }),
      get: cliCommand({ summary: "Print a carousel's saved slides", positionals: idPosition, run: ({ positionals }) => json(store.get(positionals.id)) }),
      list: cliCommand({
        summary: "List carousels, newest first",
        options: { thread: { type: "string", description: "Only this thread's carousels" } },
        run: ({ options }) => json(store.list(options.thread)),
      }),
      remove: cliCommand({ summary: "Delete a carousel and the image copies only it uses", positionals: idPosition, run: ({ positionals }) => json(store.remove(positionals.id)) }),
    },
  }));
}
