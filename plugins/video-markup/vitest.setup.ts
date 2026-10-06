import { createRequire } from "node:module";

// The SDK host bundle loads Node built-ins through `require`; the plugin build injects it, so do the same for tests.
(globalThis as { require?: NodeJS.Require }).require ??= createRequire(import.meta.url);
