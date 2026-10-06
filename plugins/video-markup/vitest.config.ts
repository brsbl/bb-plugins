import { defineConfig } from "vitest/config";
export default defineConfig({test: {include: ["*.test.ts", "*.test.tsx"], setupFiles: ["./vitest.setup.ts"], testTimeout: 15_000}});
