import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    silent: "passed-only",
    testTimeout: 30_000,
    name: "bb-plugin-playgrounds",
    include: ["**/*.test.{ts,tsx,js}"],
    exclude: ["node_modules/**"],
  },
});
