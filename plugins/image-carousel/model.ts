import { z } from "zod";

export const MAX_SLIDES = 30;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const carouselIdSchema = z.string().regex(/^ic_[a-z0-9]{12}$/, "Use the carousel ID printed by create.");
export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const line = (max: number) => z.string().trim().min(1).max(max).regex(/^[^\r\n]+$/);
const description = z.string().trim().max(2000);
const imagePath = z.string().trim().min(1).max(4096);
const sourceUrl = z.string().trim().max(2048).url().refine((value) => /^https?:\/\//i.test(value), "Source links must use http or https.");

export const carouselInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("research"),
    title: line(120).optional(),
    slides: z.array(z.object({ image: imagePath, title: line(120), description: description.default(""), source: sourceUrl.optional() }).strict()).min(1).max(MAX_SLIDES),
  }).strict(),
  z.object({
    kind: z.literal("before-after"),
    title: line(120).optional(),
    slides: z.array(z.object({ before: imagePath, after: imagePath, title: line(120), description: description.default("") }).strict()).min(1).max(MAX_SLIDES),
  }).strict(),
]);
export type CarouselInput = z.infer<typeof carouselInputSchema>;

export const imageTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
export const imageSchema = z.object({ sha256: sha256Schema, mimeType: z.enum(imageTypes), name: z.string().max(255) }).strict();
export type ImageRef = z.infer<typeof imageSchema>;

const slideText = { title: line(120), description };
export const carouselSchema = z.discriminatedUnion("kind", [
  z.object({
    id: carouselIdSchema, threadId: z.string().min(1), kind: z.literal("research"), title: line(120).optional(), createdAt: z.string(),
    slides: z.array(z.object({ ...slideText, image: imageSchema, source: sourceUrl.optional() }).strict()).min(1).max(MAX_SLIDES),
  }).strict(),
  z.object({
    id: carouselIdSchema, threadId: z.string().min(1), kind: z.literal("before-after"), title: line(120).optional(), createdAt: z.string(),
    slides: z.array(z.object({ ...slideText, before: imageSchema, after: imageSchema }).strict()).min(1).max(MAX_SLIDES),
  }).strict(),
]);
export type Carousel = z.infer<typeof carouselSchema>;

export function sniffImageType(bytes: Uint8Array): ImageRef["mimeType"] | null {
  const starts = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}
