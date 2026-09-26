#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const data = resolve(dirname(fileURLToPath(import.meta.url)), "../data");
const target = resolve(data, "saved-places.json");
if (!existsSync(target)) {
  copyFileSync(resolve(data, "sample.json"), target);
  console.log("Created data/saved-places.json from the sample. Run `npm run import` to use your own places.");
}
