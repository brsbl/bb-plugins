import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
var __filename = __fileURLToPath(import.meta.url);
var __dirname = __pathDirname(__filename);

// server.ts
import { execFile } from "node:child_process";
import { realpath, stat } from "node:fs/promises";
import { extname, isAbsolute } from "node:path";
var OpenInMossError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "OpenInMossError";
  }
  code;
};
function isMarkdownPath(filePath) {
  const extension = extname(filePath).toLowerCase();
  return extension === ".md" || extension === ".markdown";
}
function launchMoss(filePath) {
  return new Promise((resolve, reject) => {
    execFile(
      "/usr/bin/open",
      ["-a", "Moss", filePath],
      { timeout: 15e3 },
      (error) => {
        if (error) reject(error);
        else resolve();
      }
    );
  });
}
var systemDependencies = {
  platform: process.platform,
  realpath,
  stat,
  open: launchMoss
};
async function openMarkdownInMoss(filePath, dependencies) {
  if (dependencies.platform !== "darwin") {
    throw new OpenInMossError(
      "unsupported_platform",
      "Opening Markdown in Moss is available only on macOS."
    );
  }
  if (!isAbsolute(filePath) || filePath.includes("\0")) {
    throw new OpenInMossError(
      "invalid_path",
      "The Markdown link does not contain a valid absolute file path."
    );
  }
  if (!isMarkdownPath(filePath)) {
    throw new OpenInMossError(
      "not_markdown",
      "Only .md and .markdown files can be opened in Moss."
    );
  }
  let canonicalPath;
  try {
    canonicalPath = await dependencies.realpath(filePath);
  } catch {
    throw new OpenInMossError(
      "not_found",
      "That Markdown file is no longer available."
    );
  }
  if (!isMarkdownPath(canonicalPath)) {
    throw new OpenInMossError(
      "not_markdown",
      "The linked file does not resolve to a Markdown file."
    );
  }
  let fileStat;
  try {
    fileStat = await dependencies.stat(canonicalPath);
  } catch {
    throw new OpenInMossError(
      "not_found",
      "That Markdown file is no longer available."
    );
  }
  if (!fileStat.isFile()) {
    throw new OpenInMossError(
      "not_regular_file",
      "That Markdown link does not point to a regular file."
    );
  }
  try {
    await dependencies.open(canonicalPath);
  } catch {
    throw new OpenInMossError(
      "open_failed",
      "Moss could not open that Markdown file."
    );
  }
  return canonicalPath;
}
function errorResponse(context, error) {
  const body = { ok: false, error: { code: error.code, message: error.message } };
  switch (error.code) {
    case "invalid_path":
    case "not_markdown":
      return context.json(body, 400);
    case "not_found":
      return context.json(body, 404);
    case "not_regular_file":
      return context.json(body, 422);
    case "unsupported_platform":
      return context.json(body, 409);
    case "open_failed":
      return context.json(body, 502);
  }
}
function createOpenInMossPlugin(dependencies = systemDependencies) {
  return async function plugin(bb) {
    bb.http.route(
      "POST",
      "/open",
      async (context) => {
        let body;
        try {
          body = await context.req.json();
        } catch {
          return context.json(
            {
              ok: false,
              error: {
                code: "invalid_path",
                message: "The request must contain a Markdown file path."
              }
            },
            400
          );
        }
        const filePath = typeof body === "object" && body !== null && typeof Reflect.get(body, "path") === "string" ? Reflect.get(body, "path") : null;
        if (filePath === null) {
          return context.json(
            {
              ok: false,
              error: {
                code: "invalid_path",
                message: "The request must contain a Markdown file path."
              }
            },
            400
          );
        }
        try {
          const openedPath = await openMarkdownInMoss(filePath, dependencies);
          return context.json({ ok: true, opened: true, path: openedPath });
        } catch (error) {
          if (error instanceof OpenInMossError) {
            bb.log.warn(`Open in Moss failed (${error.code}): ${error.message}`);
            return errorResponse(context, error);
          }
          throw error;
        }
      },
      { auth: "local" }
    );
    bb.log.info("Markdown file links will open in Moss");
  };
}
var server_default = createOpenInMossPlugin();
export {
  createOpenInMossPlugin,
  server_default as default,
  openMarkdownInMoss
};
//# sourceMappingURL=server.js.map
