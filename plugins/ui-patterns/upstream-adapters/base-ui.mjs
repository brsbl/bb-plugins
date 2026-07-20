import { createUpstreamAdapter } from "./contract.mjs";

export const baseUiAdapter = createUpstreamAdapter({
  providerId: "base-ui",
  allowedTargets: {
    docs: [{ hostname: "base-ui.com", pathnamePrefix: "/react/components/" }],
    example: [{ hostname: "base-ui.com", pathnamePrefix: "/react/components/" }],
    code: [{ hostname: "github.com", pathnamePrefix: "/mui/base-ui/blob/" }],
  },
});
