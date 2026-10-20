import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Transform, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  const playwright = join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(playwright)) {
    for (const dir of readdirSync(playwright).sort().reverse()) {
      for (const sub of ["chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-linux/chrome"]) {
        candidates.push(join(playwright, dir, sub));
      }
    }
  }
  return candidates.find((path) => existsSync(path));
}

// Official Chrome for Testing headless shell: native virtual time and manual frame control.
const VERSION = "155.0.8059.84";
const ASSETS = {
  "linux-x64": ["linux64", "a5d71b91aa996fef00517cd212b2dfb816b43055edefbe727e6fd562d4ae1f9c", 125033980],
  "darwin-arm64": ["mac-arm64", "7f111980bcb41e908d0fa3e969a625e7777ff683c1fc43fd7759d05ec3ffe52b", 102441485],
  "darwin-x64": ["mac-x64", "3c5bf34eb8daa874e8b50edf900eab618b74c1b9596e596340278eeba4ff1ae1", 108105176],
};
async function digest(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
export async function clipBrowserPath(work, cacheRoot) {
  // The override also lets CI exercise the fresh-user path on browser-equipped runners.
  const existing = process.env.BB_CLIP_PORTABLE_BROWSER === "1" ? null : process.env.BB_CLIP_HEADLESS_SHELL;
  if (existing) return existing;
  try {
    const arch = `${process.platform}-${process.arch}`, asset = ASSETS[arch];
    if (!asset) throw new Error("Unsupported platform");
    const [platform, sha256, bytes] = asset;
    const cache = cacheRoot ?? join(homedir(), ".cache", "bb-playgrounds", `chrome-headless-shell-${VERSION}`, arch);
    mkdirSync(cache, { recursive: true, mode: 0o700 });
    const archive = join(cache, "chrome.zip");
    if (!existsSync(archive) || await digest(archive) !== sha256) {
      console.error("Preparing the local clip browser (one-time download; no card data is sent).");
      const response = await fetch(`https://storage.googleapis.com/chrome-for-testing-public/${VERSION}/${platform}/chrome-headless-shell-${platform}.zip`, { signal: AbortSignal.timeout(120000) });
      if (!response.ok || !response.body) throw new Error("Browser download failed");
      const temp = archive + "." + randomUUID();
      const hash = createHash("sha256"); let size = 0;
      try {
        await pipeline(Readable.fromWeb(response.body), new Transform({
          transform(chunk, _encoding, done) {
            size += chunk.length;
            if (size > bytes) return done(new Error("Browser archive exceeds pinned size"));
            hash.update(chunk); done(null, chunk);
          },
        }), createWriteStream(temp, { flags: "wx", mode: 0o600 }));
        if (size !== bytes || hash.digest("hex") !== sha256) throw new Error("Browser checksum mismatch");
        renameSync(temp, archive);
      } finally { rmSync(temp, { force: true }); }
    }
    // Extract only the verified archive, into this export's disposable directory.
    // Keep all shell resources together; do not install an application globally.
    const target = join(work, "browser");
    mkdirSync(target, { mode: 0o700 });
    await promisify(execFile)("/usr/bin/unzip", ["-q", archive, "-d", target], { timeout: 120000 });
    const binary = join(target, `chrome-headless-shell-${platform}`, "chrome-headless-shell");
    if (!existsSync(binary)) throw new Error("Browser executable missing");
    return binary;
  } catch {
    throw new Error("Could not prepare the clip browser; set BB_CLIP_HEADLESS_SHELL to a working Chrome headless shell executable and retry.");
  }
}
