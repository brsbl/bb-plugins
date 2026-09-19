import { fileURLToPath } from "node:url";

export default {
  publicDir: fileURLToPath(new URL("../docs", import.meta.url)),
};
