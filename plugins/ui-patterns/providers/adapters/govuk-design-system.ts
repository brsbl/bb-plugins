import { z } from "zod";
import type { ProviderDefinition, ProviderRecord } from "../schema.js";
import type { ProviderAdapter } from "./types.js";

const govukInputSchema = z
  .object({
    schemaVersion: z.literal("1"),
    revision: z.string(),
    documents: z.array(
      z
        .object({
          path: z.string().min(1),
          frontmatter: z
            .object({
              title: z.string().min(1),
              description: z.string().nullable(),
              section: z.string().nullable(),
              aliases: z.string().nullable(),
            })
            .strict(),
        })
        .strict(),
    ),
  })
  .strict();

function aliasesFromFrontmatter(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);
}

function recordKind(path: string) {
  const match = path.match(/^src\/(components|patterns)\//);
  if (!match?.[1]) {
    throw new Error(`Unsupported GOV.UK Design System record path: ${path}`);
  }
  return match[1] === "components" ? "component" : "pattern";
}

function nativeId(path: string) {
  const match = path.match(/^src\/(?:components|patterns)\/([^/]+)\/index\.md$/);
  if (!match?.[1]) {
    throw new Error(`Cannot derive a source-native GOV.UK id from ${path}`);
  }
  return match[1];
}

export const govukDesignSystemAdapter: ProviderAdapter = {
  id: "govuk-design-system",
  version: "1",
  adapt(definition: ProviderDefinition, input: unknown): readonly ProviderRecord[] {
    const source = govukInputSchema.parse(input);
    if (source.revision !== definition.source.revision) {
      throw new Error(
        `GOV.UK source revision ${source.revision} does not match ${definition.source.revision}.`,
      );
    }

    return source.documents.map(({ path, frontmatter }) => {
      const id = nativeId(path);
      const kind = recordKind(path);
      const declaredKind = frontmatter.section?.toLocaleLowerCase();
      if (
        declaredKind &&
        declaredKind !== `${kind}s`
      ) {
        throw new Error(
          `GOV.UK record ${path} declares section ${frontmatter.section}, expected ${kind}.`,
        );
      }
      return {
        nativeId: id,
        name: frontmatter.title,
        summary: frontmatter.description,
        kind,
        aliases: aliasesFromFrontmatter(frontmatter.aliases),
        canonicalUrl: `https://design-system.service.gov.uk/${kind}s/${id}/`,
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
