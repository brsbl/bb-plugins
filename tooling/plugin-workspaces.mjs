import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function readPluginWorkspaces(repositoryRoot = defaultRoot) {
  const root = resolve(repositoryRoot);
  const entries = await readdir(resolve(root, "plugins"), {
    withFileTypes: true,
  });
  const plugins = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const slug = entry.name;
    const source = `plugins/${slug}`;
    const directory = resolve(root, source);
    const manifest = JSON.parse(
      await readFile(resolve(directory, "package.json"), "utf8"),
    );
    if (!manifest.name?.startsWith("bb-plugin-") || !manifest.bb?.name) {
      throw new Error(`${source}/package.json is not a bb plugin manifest`);
    }
    plugins.push({
      slug,
      source,
      directory,
      installRef: `plugin/${slug}`,
      packageName: manifest.name,
      pluginId: manifest.name.slice("bb-plugin-".length),
      name: manifest.bb.name,
      manifest,
    });
  }

  return plugins.sort((left, right) => left.slug.localeCompare(right.slug));
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const plugins = await readPluginWorkspaces();
  console.log(
    JSON.stringify(
      plugins.map(({ name, packageName, source }) => ({
        name,
        package: packageName,
        path: source,
      })),
    ),
  );
}
