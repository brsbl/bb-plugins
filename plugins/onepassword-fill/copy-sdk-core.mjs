import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SDK_CORE_WASM_SHA256 = "97aa9140c5c923b39b41c059d5ab98e214b5fc78a80203d0026708cfbce8d6ab";

const pluginDir = dirname(fileURLToPath(import.meta.url));
const source = join(
  dirname(createRequire(join(pluginDir, "package.json")).resolve("@1password/sdk-core")),
  "core_bg.wasm",
);
const digest = createHash("sha256").update(await readFile(source)).digest("hex");
if (digest !== SDK_CORE_WASM_SHA256)
  throw new Error(`@1password/sdk-core core_bg.wasm digest ${digest} does not match the pinned release`);
await mkdir(join(pluginDir, "dist"), { recursive: true });
await copyFile(source, join(pluginDir, "dist", "core_bg.wasm"));
console.log(join(pluginDir, "dist", "core_bg.wasm"));
