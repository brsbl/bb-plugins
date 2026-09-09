import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const AREA_RULES = [
  ["apps/app/src/components/thread/terminal/", "Terminals"],
  ["apps/app/src/components/secondary-panel/Terminal", "Terminals"],
  ["apps/app/src/components/secondary-panel/terminalPanelTabs", "Terminals"],
  ["apps/host-daemon/src/terminals/", "Terminals"],
  ["apps/server/src/services/terminals/", "Terminals"],
  ["apps/server/src/routes/terminals.ts", "Terminals"],
  ["apps/cli/src/commands/terminal.ts", "Terminals"],
  ["apps/app/src/components/secondary-panel/Browser", "Browser & web navigation"],
  ["apps/app/src/components/secondary-panel/browserView", "Browser & web navigation"],
  ["apps/desktop/src/desktop-browser-", "Browser & web navigation"],
  ["apps/server/src/browser-request-guard", "Browser & web navigation"],
  ["apps/mobile/", "Machines & remote access"],
  ["packages/mobile-bridge/", "Machines & remote access"],
  ["apps/connect/", "Machines & remote access"],
  ["packages/connect-client/", "Machines & remote access"],
  ["packages/connect-db/", "Machines & remote access"],
  ["packages/tunnel-client/", "Machines & remote access"],
  ["packages/tunnel-contract/", "Machines & remote access"],
  ["plugins/connect/", "Machines & remote access"],
  ["plugins/push-notifications/", "Machines & remote access"],
  ["apps/host-daemon/src/connect-tunnel/", "Machines & remote access"],
  ["apps/host-daemon/src/enroll", "Machines & remote access"],
  ["apps/host-daemon/src/server-connection", "Machines & remote access"],
  ["apps/host-daemon/src/server-client", "Machines & remote access"],
  ["apps/host-daemon/src/machine-auth-proxy", "Machines & remote access"],
  ["apps/host-daemon/src/host-daemon-health-monitor", "Machines & remote access"],
  ["apps/host-daemon/src/identity", "Machines & remote access"],
  ["apps/host-daemon/src/partysocket", "Machines & remote access"],
  ["apps/app/src/components/machines/", "Machines & remote access"],
  ["apps/app/src/views/MachineSettingsView", "Machines & remote access"],
  ["apps/server/src/services/hosts/", "Machines & remote access"],
  ["apps/server/src/routes/hosts.ts", "Machines & remote access"],
  ["apps/server/src/services/machine-auth.ts", "Machines & remote access"],
  ["apps/cli/src/commands/machine.ts", "Machines & remote access"],
  ["apps/desktop/src/connect-", "Machines & remote access"],
  ["apps/desktop/src/remote-server-load", "Machines & remote access"],
  ["apps/desktop/src/server-target", "Machines & remote access"],
  ["apps/desktop/src/server-url-dialog", "Machines & remote access"],
  ["apps/desktop/src/existing-server-dialog", "Machines & remote access"],
  ["apps/desktop/src/server-probe", "Machines & remote access"],
  ["plugins/provider-", "Providers & agent execution"],
  ["plugins/concurrency-limit/", "Providers & agent execution"],
  ["packages/agent-providers/", "Providers & agent execution"],
  ["packages/agent-runtime/", "Providers & agent execution"],
  ["packages/provider-bridge-", "Providers & agent execution"],
  ["packages/provider-parity/", "Providers & agent execution"],
  ["apps/server/src/services/providers/", "Providers & agent execution"],
  ["apps/server/src/services/ai/", "Providers & agent execution"],
  ["apps/host-daemon/src/provider-installation", "Providers & agent execution"],
  ["apps/host-daemon/src/runtime-", "Providers & agent execution"],
  ["apps/host-daemon/src/user-executable-env", "Providers & agent execution"],
  ["apps/app/src/components/provider-cli/", "Providers & agent execution"],
  ["apps/cli/src/commands/provider.ts", "Providers & agent execution"],
  ["packages/plugin-", "Extensions & integrations"],
  ["examples/plugins/", "Extensions & integrations"],
  ["official-plugins/", "Extensions & integrations"],
  ["plugins/", "Extensions & integrations"],
  ["apps/server/src/services/plugins/", "Extensions & integrations"],
  ["apps/server/src/services/plugin-catalog/", "Extensions & integrations"],
  ["apps/server/src/routes/plugins.ts", "Extensions & integrations"],
  ["apps/server/src/routes/plugin-", "Extensions & integrations"],
  ["apps/host-daemon/src/plugin-host-", "Extensions & integrations"],
  ["apps/app/src/components/plugin/", "Extensions & integrations"],
  ["apps/app/src/components/tools/", "Extensions & integrations"],
  ["apps/app/src/views/PluginPanelView", "Extensions & integrations"],
  ["apps/app/src/views/ToolsView", "Extensions & integrations"],
  ["apps/cli/src/commands/plugin.ts", "Extensions & integrations"],
  ["apps/cli/src/commands/marketplace.ts", "Extensions & integrations"],
  ["packages/templates/", "Extensions & integrations"],
  ["apps/app/src/components/secondary-panel/ThreadStorage", "Threads & agent work"],
  ["apps/app/src/components/secondary-panel/useThreadStorage", "Threads & agent work"],
  ["apps/app/src/components/secondary-panel/ThreadMetadata", "Threads & agent work"],
  ["packages/thread-view/", "Threads & agent work"],
  ["apps/app/src/views/thread-detail/", "Threads & agent work"],
  ["apps/app/src/components/thread/", "Threads & agent work"],
  ["apps/app/src/components/promptbox/", "Threads & agent work"],
  ["apps/app/src/views/RootCompose", "Threads & agent work"],
  ["apps/app/src/views/root-compose-", "Threads & agent work"],
  ["apps/app/src/views/mobile-home-story-fixtures", "Threads & agent work"],
  ["apps/app/src/components/create-via-prompt-examples", "Threads & agent work"],
  ["apps/app/src/lib/notifications/", "Threads & agent work"],
  ["apps/app/src/components/notifications/", "Threads & agent work"],
  ["apps/server/src/services/threads/", "Threads & agent work"],
  ["apps/server/src/services/interactions/", "Threads & agent work"],
  ["apps/server/src/routes/threads/", "Threads & agent work"],
  ["apps/server/src/routes/queue.ts", "Threads & agent work"],
  ["apps/server/src/routes/thread-sections.ts", "Threads & agent work"],
  ["apps/host-daemon/src/command-handlers/thread.ts", "Threads & agent work"],
  ["apps/host-daemon/src/command-handlers/interactive.ts", "Threads & agent work"],
  ["apps/host-daemon/src/interactive-request-registry", "Threads & agent work"],
  ["apps/host-daemon/src/thread-storage-root", "Threads & agent work"],
  ["apps/cli/src/commands/thread", "Threads & agent work"],
  ["apps/cli/src/commands/manager.ts", "Threads & agent work"],
  ["packages/host-workspace/", "Environments & Git"],
  ["packages/host-watcher/", "Environments & Git"],
  ["packages/local-open-targets/", "Environments & Git"],
  ["apps/server/src/services/environments/", "Environments & Git"],
  ["apps/server/src/routes/environments.ts", "Environments & Git"],
  ["apps/server/src/routes/files.ts", "Environments & Git"],
  ["apps/server/src/routes/diff-tiering", "Environments & Git"],
  ["apps/server/src/routes/file-list-query", "Environments & Git"],
  ["apps/server/src/routes/branch-list-query", "Environments & Git"],
  ["apps/server/src/routes/path-list-inclusion", "Environments & Git"],
  ["apps/app/src/components/git-diff/", "Environments & Git"],
  ["apps/app/src/components/pull-request/", "Environments & Git"],
  ["apps/app/src/components/workspace/", "Environments & Git"],
  ["apps/app/src/components/workspace-open-target/", "Environments & Git"],
  ["apps/app/src/components/code/", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/git-diff/", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/GitDiff", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/gitDiff", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/FilePreview", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/NewTabFileSearch", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/useThreadFileTabs", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/useThreadOpenFileSignal", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/RightPanelFile", "Environments & Git"],
  ["apps/app/src/components/secondary-panel/rightPanelFile", "Environments & Git"],
  ["apps/host-daemon/src/command-handlers/environment.ts", "Environments & Git"],
  ["apps/host-daemon/src/command-handlers/file-", "Environments & Git"],
  ["apps/host-daemon/src/command-handlers/host-branches", "Environments & Git"],
  ["apps/host-daemon/src/command-handlers/host-files", "Environments & Git"],
  ["apps/host-daemon/src/command-handlers/path-mutations", "Environments & Git"],
  ["apps/host-daemon/src/command-handlers/root-path", "Environments & Git"],
  ["apps/host-daemon/src/workspace-", "Environments & Git"],
  ["apps/host-daemon/src/watch-manager", "Environments & Git"],
  ["apps/host-daemon/src/fs-errors", "Environments & Git"],
  ["apps/cli/src/commands/environment", "Environments & Git"],
  ["apps/cli/src/commands/file.ts", "Environments & Git"],
  ["apps/app/src/components/project/", "Projects & sources"],
  ["apps/app/src/views/ProjectSettingsView", "Projects & sources"],
  ["apps/app/src/views/project-settings/", "Projects & sources"],
  ["apps/server/src/services/projects/", "Projects & sources"],
  ["apps/server/src/routes/projects.ts", "Projects & sources"],
  ["apps/server/src/services/prompt-history.ts", "Projects & sources"],
  ["apps/host-daemon/src/command-handlers/project.ts", "Projects & sources"],
  ["apps/host-daemon/src/project-attachments", "Projects & sources"],
  ["apps/host-daemon/src/command-handlers/prompt-attachments", "Projects & sources"],
  ["apps/host-daemon/src/command-handlers/native-folder-picker", "Projects & sources"],
  ["apps/cli/src/commands/project.ts", "Projects & sources"],
  ["apps/server/src/services/skills/", "Skills & agent context"],
  ["apps/server/src/routes/skills-registry", "Skills & agent context"],
  ["apps/host-daemon/src/injected-skills", "Skills & agent context"],
  ["apps/host-daemon/src/skill-trees", "Skills & agent context"],
  ["apps/host-daemon/src/command-handlers/install-global-skills", "Skills & agent context"],
  ["apps/host-daemon/src/command-handlers/list-skills", "Skills & agent context"],
  ["apps/app/src/views/SkillsView", "Skills & agent context"],
  ["apps/cli/src/commands/skill.ts", "Skills & agent context"],
  ["apps/app/src/components/settings/", "Settings & personalization"],
  ["apps/app/src/views/SettingsView", "Settings & personalization"],
  ["apps/app/src/lib/themes/", "Settings & personalization"],
  ["apps/app/src/components/ui/theme", "Settings & personalization"],
  ["apps/cli/src/commands/settings.ts", "Settings & personalization"],
  ["apps/cli/src/commands/theme.ts", "Settings & personalization"],
  ["apps/app/src/App.tsx", "Navigation & layout"],
  ["apps/app/src/components/AppToaster", "Navigation & layout"],
  ["apps/app/src/components/AppErrorBoundary", "Navigation & layout"],
  ["apps/app/src/lib/native-shell/", "Navigation & layout"],
  ["apps/app/src/components/layout/", "Navigation & layout"],
  ["apps/app/src/components/sidebar/", "Navigation & layout"],
  ["apps/app/src/components/commands/", "Navigation & layout"],
  ["apps/app/src/components/pickers/", "Navigation & layout"],
  ["apps/app/src/components/dialogs/", "Navigation & layout"],
  ["apps/app/src/views/SplitWorkspaceRoute", "Navigation & layout"],
  ["apps/app/src/lib/command-palette/", "Navigation & layout"],
  ["apps/app/src/lib/split-", "Navigation & layout"],
  ["apps/app/src/lib/route-paths", "Navigation & layout"],
  ["apps/app/src/components/secondary-panel/", "Navigation & layout"],
  ["apps/desktop/src/desktop-window-", "Navigation & layout"],
  ["apps/desktop/src/desktop-menu-shortcuts", "Navigation & layout"],
  ["apps/desktop/src/menu.ts", "Navigation & layout"],
  ["apps/desktop/src/window-state", "Navigation & layout"],
  ["apps/desktop/", "Setup, installation & updates"],
  ["packages/bb-app/", "Setup, installation & updates"],
  ["packages/desktop-contract/", "Setup, installation & updates"],
  ["apps/server/src/services/install/", "Setup, installation & updates"],
  ["apps/host-daemon/src/protocol-self-update", "Setup, installation & updates"],
  ["apps/host-daemon/src/start-host-daemon", "Setup, installation & updates"],
  ["apps/host-daemon/src/startup-diagnostics", "Setup, installation & updates"],
  ["apps/host-daemon/src/daemon.", "Setup, installation & updates"],
  ["apps/host-daemon/src/lock", "Setup, installation & updates"],
  ["apps/cli/src/commands/updates.ts", "Setup, installation & updates"],
  ["apps/cli/src/commands/status.ts", "Setup, installation & updates"],
  [".github/workflows/release", "Setup, installation & updates"],
  [".github/workflows/nightly", "Setup, installation & updates"],
  [".github/workflows/desktop", "Setup, installation & updates"],
  ["apps/web/", "Non-product"],
  ["apps/landing/", "Non-product"],
  ["apps/demo-server/", "Non-product"],
  ["tests/", "Non-product"],
  ["qa/", "Non-product"],
  ["scripts/", "Non-product"],
  ["docs/", "Non-product"],
  ["plans/", "Non-product"],
  [".github/", "Non-product"],
  ["assets/", "Non-product"],
  ["patches/", "Non-product"],
  ["AGENTS.md", "Non-product"],
  ["CLAUDE.md", "Non-product"],
  ["README", "Non-product"],
  ["CONTRIBUTING", "Non-product"],
];
const NON_VOTING_FILES = new Set(["pnpm-lock.yaml"]);
const NON_PRODUCT = "Non-product";
const SHARED_FOUNDATION = "Shared foundation";
const CROSS_CUTTING = "Cross-cutting";
const DOMINANCE_THRESHOLD = 0.5;
const WEEK_MS = 7 * 86400 * 1000;
const CSV_COLUMNS = [
  "sha",
  "date",
  "week",
  "subject",
  "pr",
  "area",
  "area_share",
  "files",
  "lines",
  "closes_issues",
  "pr_base",
];

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    values[key] = value;
    index += 1;
  }
  return values;
}

function fail(message) {
  process.stderr.write(`commit-ledger: ${message}\n`);
  process.exit(1);
}

function areaOf(filePath) {
  for (const [prefix, area] of AREA_RULES) {
    if (filePath.startsWith(prefix)) return area;
  }
  return SHARED_FOUNDATION;
}

function normalizeRenamedPath(filePath) {
  if (!filePath.includes("=>")) return filePath;
  return filePath.replace(/\{.* => (.*)\}/, "$1");
}

function parseGitLog(output) {
  const commits = [];
  let current = null;
  for (const line of output.split("\n")) {
    if (line.startsWith("@@")) {
      const [sha, date, subject] = line.slice(2).split("\x1f");
      current = { sha, date, subject, files: [] };
      commits.push(current);
    } else if (line.trim() && current) {
      const [added, deleted, rawPath] = line.split("\t");
      const lines = (added === "-" ? 0 : Number(added)) + (deleted === "-" ? 0 : Number(deleted));
      current.files.push({ path: normalizeRenamedPath(rawPath), lines });
    }
  }
  return commits;
}

function classifyCommit(files) {
  const votes = new Map();
  let nonProductWeight = 0;
  let foundationWeight = 0;
  for (const { path: filePath, lines } of files) {
    if (NON_VOTING_FILES.has(filePath.split("/").at(-1))) continue;
    const area = areaOf(filePath);
    const weight = Math.max(lines, 1);
    if (area === NON_PRODUCT) nonProductWeight += weight;
    else if (area === SHARED_FOUNDATION) foundationWeight += weight;
    else votes.set(area, (votes.get(area) ?? 0) + weight);
  }
  const total = [...votes.values()].reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return { area: nonProductWeight > foundationWeight ? NON_PRODUCT : SHARED_FOUNDATION, share: 1 };
  }
  const [topArea, topWeight] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
  const share = topWeight / total;
  return { area: share >= DOMINANCE_THRESHOLD ? topArea : CROSS_CUTTING, share };
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const args = parseArgs(process.argv.slice(2));
if (!args.run) fail("Usage: node commit-ledger.mjs --run <run-dir>");
const runDir = path.resolve(args.run);

const config = JSON.parse(await readFile(path.join(runDir, "config.json"), "utf8"));
for (const key of ["repoPath", "periodStart", "asOf", "weeks"]) {
  if (config[key] === undefined || config[key] === null || config[key] === "") fail(`config.json is missing ${key}`);
}
const periodStartMs = Date.parse(config.periodStart);
const asOfMs = Date.parse(config.asOf);
if (!Number.isFinite(periodStartMs) || !Number.isFinite(asOfMs) || periodStartMs >= asOfMs) {
  fail(`config.json has an invalid window: ${config.periodStart} to ${config.asOf}`);
}
const weekCount = Number(config.weeks);
if (!Number.isInteger(weekCount) || weekCount < 1) fail(`config.json has an invalid weeks value: ${config.weeks}`);

const prsFile = path.join(runDir, "github", "prs.json");
let prsByNumber = new Map();
try {
  const prs = JSON.parse(await readFile(prsFile, "utf8"));
  if (!Array.isArray(prs)) fail(`${prsFile} must contain an array`);
  prsByNumber = new Map(prs.map((pr) => [pr.number, pr]));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  fail(`${prsFile} not found; run github-state.mjs first`);
}

const gitSince = new Date(periodStartMs).toISOString().replace(/\.\d{3}Z$/, "Z");
const gitUntil = new Date(asOfMs).toISOString().replace(/\.\d{3}Z$/, "Z");
let gitOutput;
try {
  gitOutput = execFileSync(
    "git",
    [
      "log",
      "origin/main",
      "--first-parent",
      `--since=${gitSince}`,
      `--until=${gitUntil}`,
      "--format=@@%H%x1f%cI%x1f%s",
      "--numstat",
    ],
    { cwd: config.repoPath, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
} catch (error) {
  fail(`git log failed in ${config.repoPath}: ${error.stderr?.toString().trim() || error.message}`);
}

const rows = [];
for (const commit of parseGitLog(gitOutput)) {
  const committedMs = Date.parse(commit.date);
  if (!(committedMs >= periodStartMs && committedMs < asOfMs)) continue;
  const week = Math.min(weekCount - 1, Math.floor((committedMs - periodStartMs) / WEEK_MS));
  const { area, share } = classifyCommit(commit.files);
  const prMatch = /\(#(\d+)\)\s*$/.exec(commit.subject);
  const prNumber = prMatch ? Number(prMatch[1]) : null;
  const pr = prNumber === null ? undefined : prsByNumber.get(prNumber);
  const closesIssues = pr
    ? (pr.closingIssuesReferences?.nodes ?? []).map((node) => node.number).join(";")
    : "";
  rows.push({
    sha: commit.sha.slice(0, 10),
    date: commit.date,
    week,
    subject: commit.subject,
    pr: prNumber,
    area,
    area_share: Math.round(share * 100) / 100,
    files: commit.files.length,
    lines: commit.files.reduce((sum, file) => sum + file.lines, 0),
    closes_issues: closesIssues,
    pr_base: pr?.baseRefName ?? "",
  });
}

const csv = [CSV_COLUMNS.join(","), ...rows.map((row) => CSV_COLUMNS.map((column) => csvCell(row[column])).join(","))].join("\n") + "\n";
await mkdir(path.join(runDir, "commits"), { recursive: true });
const outputFile = path.join(runDir, "commits", "ledger.csv");
await writeFile(outputFile, csv);

const byArea = new Map();
for (const row of rows) byArea.set(row.area, (byArea.get(row.area) ?? 0) + 1);
const byWeek = Array.from({ length: weekCount }, (_, index) => rows.filter((row) => row.week === index).length);
process.stdout.write(`${outputFile}: ${rows.length} commits, ${rows.filter((row) => row.pr !== null).length} with a PR number\n`);
for (const [area, count] of [...byArea.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  process.stdout.write(`  ${area.padEnd(32)} ${count}\n`);
}
process.stdout.write(`  by week: ${byWeek.join(", ")}\n`);
