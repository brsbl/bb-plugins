import { createUpstreamAdapter } from "./contract.mjs";

export const w3cAriaApgAdapter = createUpstreamAdapter({
  providerId: "w3c-aria-apg",
  allowedTargets: {
    docs: [{ hostname: "www.w3.org", pathnamePrefix: "/WAI/ARIA/apg/patterns/" }],
    example: [
      {
        hostname: "www.w3.org",
        pathnamePrefix: "/WAI/ARIA/apg/patterns/combobox/examples/",
      },
    ],
    code: [{ hostname: "github.com", pathnamePrefix: "/w3c/aria-practices/blob/" }],
  },
});
