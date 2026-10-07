import { expect, it } from "vitest";
import { fileType } from "./reference-icon.js";

it.each([
  ["/notes/Plan/Plan.md", "document"], ["src/App.TSX", "code"], ["lib/index.mjs", "code"], ["package.json", "code"],
  ["site/index.htm", "code"], ["styles/app.scss", "code"], ["shots/after.png", "image"], ["spec.pdf", "document"], ["server.log", "document"],
  ["Makefile", "file"], [".env", "file"], ["main.rs", "file"],
])("%s pins as a %s file", (path, type) => expect(fileType(path)).toBe(type));
