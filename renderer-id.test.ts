import { webcrypto } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";

import { createRendererId } from "./renderer-id.js";

afterEach(() => vi.unstubAllGlobals());

it("creates valid renderer UUIDs without the secure-context randomUUID API", () => {
  vi.stubGlobal("crypto", { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) });
  const rendererId = createRendererId();
  expect(z.uuid().parse(rendererId)).toBe(rendererId);
  expect(createRendererId()).not.toBe(rendererId);
});
