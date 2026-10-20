import { execFile } from "node:child_process";
import { realpath, stat } from "node:fs/promises";
import { extname, isAbsolute } from "node:path";
import type { OpenResult } from "./contract";

type FileStat = { isFile(): boolean };

export interface OpenInMossDependencies {
  platform: string;
  realpath(filePath: string): Promise<string>;
  stat(filePath: string): Promise<FileStat>;
  open(filePath: string): Promise<void>;
}

type OpenErrorCode =
  | "invalid_path"
  | "not_found"
  | "not_markdown"
  | "not_regular_file"
  | "open_failed"
  | "unsupported_platform"
  | "host_unavailable"
  | "ambiguous_host";

export class OpenInMossError extends Error {
  constructor(
    readonly code: OpenErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OpenInMossError";
  }
}

function isMarkdownPath(filePath: string): boolean {
  const extension = extname(filePath).toLowerCase();
  return extension === ".md" || extension === ".markdown";
}

function launchMoss(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "/usr/bin/open",
      ["-a", "Moss", filePath],
      { timeout: 15_000 },
      (error) => {
        if (error) reject(error);
        else resolve();
      },
    );
  });
}

export const systemDependencies: OpenInMossDependencies = {
  platform: process.platform,
  realpath,
  stat,
  open: launchMoss,
};

async function resolveMarkdownPath(
  filePath: string,
  dependencies: OpenInMossDependencies,
): Promise<string> {
  if (dependencies.platform !== "darwin") {
    throw new OpenInMossError(
      "unsupported_platform",
      "Opening Markdown in Moss is available only on macOS.",
    );
  }
  if (!isAbsolute(filePath) || filePath.includes("\0")) {
    throw new OpenInMossError(
      "invalid_path",
      "The Markdown link does not contain a valid absolute file path.",
    );
  }
  if (!isMarkdownPath(filePath)) {
    throw new OpenInMossError(
      "not_markdown",
      "Only .md and .markdown files can be opened in Moss.",
    );
  }

  let canonicalPath: string;
  try {
    canonicalPath = await dependencies.realpath(filePath);
  } catch {
    throw new OpenInMossError(
      "not_found",
      "That Markdown file is no longer available.",
    );
  }
  if (!isMarkdownPath(canonicalPath)) {
    throw new OpenInMossError(
      "not_markdown",
      "The linked file does not resolve to a Markdown file.",
    );
  }

  let fileStat: FileStat;
  try {
    fileStat = await dependencies.stat(canonicalPath);
  } catch {
    throw new OpenInMossError(
      "not_found",
      "That Markdown file is no longer available.",
    );
  }
  if (!fileStat.isFile()) {
    throw new OpenInMossError(
      "not_regular_file",
      "That Markdown link does not point to a regular file.",
    );
  }

  return canonicalPath;
}

export async function runOnHost(
  filePath: string,
  open: boolean,
  dependencies: OpenInMossDependencies = systemDependencies,
): Promise<OpenResult> {
  try {
    const path = await resolveMarkdownPath(filePath, dependencies);
    if (open) {
      try {
        await dependencies.open(path);
      } catch {
        throw new OpenInMossError("open_failed", "Moss could not open that Markdown file.");
      }
    }
    return { ok: true, path };
  } catch (error) {
    if (!(error instanceof OpenInMossError)) throw error;
    return { ok: false, error: { code: error.code, message: error.message } };
  }
}
