import { createUpstreamAdapter } from "./contract.mjs";

export const carbonAdapter = createUpstreamAdapter({
  providerId: "carbon",
  allowedTargets: {
    docs: [{ hostname: "carbondesignsystem.com", pathnamePrefix: "/components/" }],
    example: [{ hostname: "react.carbondesignsystem.com", pathnamePrefix: "/" }],
    code: [
      {
        hostname: "github.com",
        pathnamePrefix: "/carbon-design-system/carbon/blob/",
      },
    ],
  },
});
