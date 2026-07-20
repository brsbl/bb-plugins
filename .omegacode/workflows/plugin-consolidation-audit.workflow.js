export const meta = {
  name: "bb-plugins-consolidation-audit",
  description: "Audit five personal bb plugins before consolidating them",
  phases: [
    { title: "Audit", detail: "Inspect each source independently" },
    { title: "Synthesize", detail: "Combine risks and shared-work recommendations" },
  ],
};

const REPORT_SCHEMA = {
  type: "object",
  required: [
    "plugin",
    "identity",
    "scripts",
    "tests",
    "documentation",
    "importRisks",
    "recommendedChanges",
    "sharedCandidates",
  ],
  properties: {
    plugin: { type: "string" },
    identity: {
      type: "object",
      required: ["packageName", "pluginId", "displayName"],
      properties: {
        packageName: { type: "string" },
        pluginId: { type: "string" },
        displayName: { type: "string" },
      },
    },
    scripts: { type: "array", items: { type: "string" } },
    tests: { type: "array", items: { type: "string" } },
    documentation: { type: "array", items: { type: "string" } },
    importRisks: { type: "array", items: { type: "string" } },
    recommendedChanges: { type: "array", items: { type: "string" } },
    sharedCandidates: { type: "array", items: { type: "string" } },
  },
};

const SYNTHESIS_SCHEMA = {
  type: "object",
  required: [
    "stableIds",
    "requiredFixes",
    "sharedTooling",
    "runtimePackages",
    "deliberateDuplication",
    "validationOrder",
  ],
  properties: {
    stableIds: { type: "array", items: { type: "string" } },
    requiredFixes: { type: "array", items: { type: "string" } },
    sharedTooling: { type: "array", items: { type: "string" } },
    runtimePackages: { type: "array", items: { type: "string" } },
    deliberateDuplication: { type: "array", items: { type: "string" } },
    validationOrder: { type: "array", items: { type: "string" } },
  },
};

phase("Audit");
const reports = await parallel(
  args.plugins.map((plugin) => () =>
    agent(
      `Read-only audit of the bb plugin at ${plugin.path}.

Plugin catalog name after consolidation: ${plugin.catalogName}
Expected stable package/plugin identity: ${plugin.expectedIdentity}

Inspect package.json, source, tests, build scripts, README/docs, generated artifacts, and git state. Do not write or modify anything. Report concrete facts, import risks, the smallest changes needed for reliable typecheck/test/build, and only shared-code candidates that already exist in at least one other plugin. Prefer repository tooling or templates over runtime abstraction. Keep documentation recommendations minimal.`,
      {
        label: `audit:${plugin.catalogName}`,
        phase: "Audit",
        schema: REPORT_SCHEMA,
        sandbox: "read-only",
        cwd: plugin.path,
        key: `audit-${plugin.key}`,
      },
    ),
  ),
);

phase("Synthesize");
const synthesis = await agent(
  `Synthesize these independent plugin audits for one npm-workspaces monorepo:

${JSON.stringify(reports.filter(Boolean), null, 2)}

Constraints:
- Design Loop is excluded.
- Catalog/display names become Omegacode and Improve Prompt.
- Preserve stable plugin ids unless changing one is required for correctness.
- Keep root and plugin documentation minimal.
- Extract runtime packages only for stable behavior already shared by two or more real plugins.
- CI must typecheck, test, build, validate artifacts, and smoke-test scaffolding.

Return concise, actionable decisions.`,
  {
    label: "synthesize:monorepo",
    phase: "Synthesize",
    schema: SYNTHESIS_SCHEMA,
    sandbox: "read-only",
    cwd: args.workspace,
    key: "synthesize-monorepo",
  },
);

return { reports: reports.filter(Boolean), synthesis };
