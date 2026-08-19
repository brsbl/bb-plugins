import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["*.test.ts", "*.test.tsx"],
    setupFiles: ["./test/compact-composer-runtime.tsx"],
    testTimeout: 15_000,
  },
});
