import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "@bb/plugin-sdk/app": fileURLToPath(
        new URL("./test/plugin-sdk-app.ts", import.meta.url),
      ),
    },
  },
});
