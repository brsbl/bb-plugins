import { z } from "zod";
import type { ProviderDefinition, ProviderRecord } from "../schema.js";
import type { ProviderAdapter } from "./types.js";

const uswdsInputSchema = z
  .object({
    schemaVersion: z.literal("1"),
    revision: z.string(),
    packageVersion: z.string().min(1),
    stories: z.array(
      z
        .object({
          path: z.string().min(1),
          title: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

function sourceNativeId(path: string) {
  const match = path.match(/^packages\/(usa-[^/]+)\//);
  if (!match?.[1]) {
    throw new Error(`Cannot derive a source-native USWDS id from ${path}`);
  }
  return match[1];
}

function storyMetadata(title: string) {
  const parts = title.split("/").map((part) => part.trim()).filter(Boolean);
  const name = parts.at(-1);
  const root = parts.at(0);
  if (!name || !root) {
    throw new Error(`Invalid USWDS Storybook title: ${title}`);
  }
  return {
    name,
    kind: root.toLocaleLowerCase(),
  };
}

export const uswdsAdapter: ProviderAdapter = {
  id: "uswds",
  version: "1",
  adapt(definition: ProviderDefinition, input: unknown): readonly ProviderRecord[] {
    const source = uswdsInputSchema.parse(input);
    if (source.revision !== definition.source.revision) {
      throw new Error(
        `USWDS source revision ${source.revision} does not match ${definition.source.revision}.`,
      );
    }

    return source.stories.map(({ path, title }) => {
      const id = sourceNativeId(path);
      const metadata = storyMetadata(title);
      return {
        nativeId: id,
        name: metadata.name,
        summary: null,
        kind: metadata.kind,
        aliases: [],
        canonicalUrl:
          `${definition.source.repository}/blob/` +
          `${definition.source.revision}/${path}`,
        provenance: {
          providerId: definition.id,
          repository: definition.source.repository,
          revision: definition.source.revision,
          sourcePath: path,
        },
      };
    });
  },
};
