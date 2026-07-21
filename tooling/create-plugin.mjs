import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  markdownTableText,
  replaceCatalogBlock,
} from "./catalog-renderer.mjs";

const defaultRepositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function command(executable, args, repositoryRoot) {
  const result = spawnSync(executable, args, {
    cwd: repositoryRoot,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${executable} ${args.join(" ")} exited ${result.status}`);
  }
}

function parseArguments(argv) {
  const options = { surfaces: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--skip-install") options.skipInstall = true;
    else if (token === "--skip-verify") options.skipVerify = true;
    else if (token === "--no-catalog") options.updateCatalog = false;
    else {
      const value = argv[index + 1];
      if (!token.startsWith("--") || !value || value.startsWith("--")) {
        throw new Error(`invalid argument ${token}`);
      }
      index += 1;
      const key = token.slice(2);
      if (key === "surface") options.surfaces.push(value);
      else options[key] = value;
    }
  }
  return options;
}

function validateOptions(options) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug ?? "")) {
    throw new Error("--slug must use lowercase letters, numbers, and dashes");
  }
  for (const key of ["name", "description"]) {
    if (typeof options[key] !== "string" || options[key].trim() === "") {
      throw new Error(`--${key} is required`);
    }
  }
}

function filesFor(options) {
  const packageName = `bb-plugin-${options.slug}`;
  const installRef = `plugin/${options.slug}`;
  const loadedMessage = JSON.stringify(`${options.name} loaded`);
  const testName = JSON.stringify(`${options.name} plugin`);
  const manifest = {
    name: packageName,
    version: "0.1.0",
    description: options.description,
    type: "module",
    license: "UNLICENSED",
    files: ["dist", "README.md"],
    scripts: {
      build: "node ../../tooling/build-plugin.mjs",
      check: "npm run typecheck && npm run build && npm test",
      test: "vitest run",
      typecheck: "tsc --noEmit",
    },
    engines: { bb: ">=0.0.32", bbPluginSdk: "^0.4.0" },
    bb: {
      name: options.name,
      description: options.description,
      branding: { icon: "Puzzle" },
      server: "./server.ts",
      skills: [],
    },
    devDependencies: {
      "@bb/plugin-sdk": "file:../../tooling/vendor/bb-plugin-sdk-0.4.1.tgz",
      "@types/better-sqlite3": "^7.6.12",
      "@types/node": "^22.0.0",
      "better-sqlite3": "^12.10.0",
      "cron-parser": "^5.5.0",
      hono: "^4.11.9",
      typescript: "^5.7.0",
      vitest: "^4.1.8",
      zod: "^4.3.6",
    },
  };
  const readme = `# ${options.name}

${options.description}

## Install

\`\`\`bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@${installRef} --yes
\`\`\`

## Use

${options.when ?? `Use ${options.name} when its focused capability is useful in bb.`}

## Develop

From the monorepo root:

\`\`\`bash
npm ci
npm run check --workspace=${packageName}
bb plugin install "path:$PWD/plugins/${options.slug}" --yes
\`\`\`
`;
  const server = `import type { BbPluginApi } from "@bb/plugin-sdk";

export default function plugin(bb: BbPluginApi): void {
  bb.log.info(${loadedMessage});
}
`;
  const test = `import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe(${testName}, () => {
  it("loads through the bb plugin harness", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "${options.slug}" });
    plugin(bb);
    expect(harness.inspection.logEntries.at(-1)?.message).toBe(${loadedMessage});
    await harness.lifecycle.dispose();
  });
});
`;
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2022"],
      module: "ESNext",
      moduleResolution: "Bundler",
      baseUrl: ".",
      paths: {
        "@bb/plugin-sdk": ["./types/bb-plugin-sdk.d.ts"],
        "@bb/plugin-sdk/app": ["./types/bb-plugin-sdk-app.d.ts"],
      },
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: ["node", "vitest/globals"],
    },
    include: ["*.ts"],
  };
  return {
    "package.json": `${JSON.stringify(manifest, null, 2)}\n`,
    "README.md": readme,
    "server.ts": server,
    "server.test.ts": test,
    "tsconfig.json": `${JSON.stringify(tsconfig, null, 2)}\n`,
  };
}

async function updateReadmeCatalog(repositoryRoot, catalog) {
  const path = resolve(repositoryRoot, "README.md");
  const readme = await readFile(path, "utf8");
  await writeFile(path, replaceCatalogBlock(readme, catalog));
}

async function updateProvenance(repositoryRoot, entry) {
  const path = resolve(repositoryRoot, "docs/provenance.md");
  const provenance = await readFile(path, "utf8");
  if (provenance.includes(`| ${entry.name} |`)) return;
  const heading = provenance.indexOf("| Plugin | Imported source |");
  const tableEnd = provenance.indexOf("\n\n", heading);
  if (heading < 0 || tableEnd < 0) {
    throw new Error("docs/provenance.md is missing the import provenance table");
  }
  const row = `| ${markdownTableText(entry.name)} | Created in this monorepo | Initial scaffold | Direct source | Generated by \`tooling/create-plugin.mjs\`. |`;
  const next = `${provenance.slice(0, tableEnd)}\n${row}${provenance.slice(tableEnd)}`;
  await writeFile(path, next);
}

async function addCatalogEntry(repositoryRoot, options) {
  const path = resolve(repositoryRoot, "catalog/plugins.json");
  const catalog = JSON.parse(await readFile(path, "utf8"));
  if (catalog.plugins.some(({ slug }) => slug === options.slug)) {
    throw new Error(`${options.slug} already exists in the catalog`);
  }
  const entry = {
    slug: options.slug,
    name: options.name,
    packageName: `bb-plugin-${options.slug}`,
    pluginId: options.slug,
    bbPluginSdk: "^0.4.0",
    purpose: options.description,
    whenToUse:
      options.when ?? `When ${options.name}'s focused capability is useful.`,
    surfaces: options.surfaces.length ? options.surfaces : ["Server capability"],
    visual: options.visual ?? "No visual surface",
    screenshot: null,
    source: `plugins/${options.slug}`,
    installRef: `plugin/${options.slug}`,
    ci: "Monorepo CI",
    maintenance: "experimental",
    legacyRepository: null,
  };
  catalog.plugins.push(entry);
  catalog.plugins.sort((left, right) => left.slug.localeCompare(right.slug));
  await writeFile(path, `${JSON.stringify(catalog, null, 2)}\n`);
  await updateReadmeCatalog(repositoryRoot, catalog);
  await updateProvenance(repositoryRoot, entry);
}

async function copySdkDeclarations(repositoryRoot, directory, options) {
  const sourceDirectory = resolve(
    options.bundledTypesDirectory ??
      resolve(repositoryRoot, "node_modules/@bb/plugin-sdk/bundled-types"),
  );
  const destinationDirectory = resolve(directory, "types");
  await mkdir(destinationDirectory);
  for (const typeFile of ["bb-plugin-sdk.d.ts", "bb-plugin-sdk-app.d.ts"]) {
    await copyFile(
      resolve(sourceDirectory, typeFile),
      resolve(destinationDirectory, typeFile),
    );
  }
}

export async function scaffoldPlugin(rawOptions) {
  const options = {
    updateCatalog: true,
    skipInstall: false,
    skipVerify: false,
    surfaces: [],
    ...rawOptions,
  };
  validateOptions(options);
  const repositoryRoot = resolve(options.repositoryRoot ?? defaultRepositoryRoot);
  const directory = resolve(
    options.output ?? resolve(repositoryRoot, "plugins", options.slug),
  );
  await mkdir(directory);
  for (const [name, contents] of Object.entries(filesFor(options))) {
    await writeFile(resolve(directory, name), contents);
  }
  await copySdkDeclarations(repositoryRoot, directory, options);
  if (options.updateCatalog) await addCatalogEntry(repositoryRoot, options);
  if (!options.skipInstall) command("npm", ["install"], repositoryRoot);
  if (!options.skipVerify) {
    command(
      "npm",
      ["run", "check", `--workspace=bb-plugin-${options.slug}`],
      repositoryRoot,
    );
  }
  return { directory, packageName: `bb-plugin-${options.slug}` };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await scaffoldPlugin(options);
  console.log(`created ${result.packageName} at ${result.directory}`);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
