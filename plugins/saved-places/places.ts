import { z } from "zod";
import data from "./data/saved-places.json";
import { categoryIdSchema } from "./categories";

export const collectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  emoji: z.string().min(1),
});
export const collections = z.array(collectionSchema).min(1).parse(data.collections);
export const collectionIds = new Set(collections.map(collection => collection.id));
export const placeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  address: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  url: z.url(),
  collectionId: z.string().min(1).refine(id => collectionIds.has(id), "Unknown collection"),
  category: categoryIdSchema.default("other"),
  placeType: z.string().nullable().default(null),
  photoUrl: z.url().nullable().default(null),
  rating: z.number().min(0).max(5).nullable().default(null),
  reviewCount: z.number().int().nonnegative().nullable().default(null),
  price: z.string().nullable().default(null),
  status: z.string().nullable().default(null),
});
export type Place = z.infer<typeof placeSchema>;
export const places = z.array(placeSchema).parse(data.places);
