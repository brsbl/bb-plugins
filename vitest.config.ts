import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["*.test.ts", "*.test.tsx"],
    testTimeout: 15_000,
  },
});
