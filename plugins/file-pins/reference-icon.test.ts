import { expect, it } from "vitest";
import { fileType } from "./reference-icon.js";

it.each([
  ["/notes/Plan/Plan.md", "markdown"], ["src/App.TSX", "typescript"], ["lib/index.mjs", "javascript"], ["package.json", "json"],
  ["site/index.htm", "html"], ["styles/app.scss", "css"], ["shots/after.png", "image"], ["spec.pdf", "pdf"], ["server.log", "text"],
  ["Makefile", "file"], [".env", "file"], ["main.rs", "file"],
])("%s pins as a %s file", (path, type) => expect(fileType(path)).toBe(type));
