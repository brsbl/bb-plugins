import { z } from "zod";
import atlasRegistry from "./generated/atlas-registry.v2.json";

const patternEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  altLabels: z.array(z.string()),
  hiddenLabels: z.array(z.string()).default([]),
  type: z.enum(["component", "pattern"]),
  category: z.string(),
  description: z.string(),
  details: z.string(),
  seeAlsoIds: z.array(z.string()),
  kind: z.enum([
    "element",
    "composite",
    "surface",
    "layout",
    "behavior",
    "state",
    "flow",
  ]),
  subject: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string(),
  scope: z.string(),
});

export type PatternEntry = z.infer<typeof patternEntrySchema>;

export const entries = z
  .array(patternEntrySchema)
  .parse(atlasRegistry.entries.map(({ catalog }) => catalog));

export const categories = z
  .array(categorySchema)
  .parse(atlasRegistry.taxonomy.categories)
  .map(({ name }) => name);

export const typeLabels = {
  all: "All",
  component: "Components",
  pattern: "Patterns",
} as const;
