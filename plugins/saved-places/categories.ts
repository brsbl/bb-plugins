import { z } from "zod";

export const categoryIdSchema = z.enum(["ramen", "sushi", "food", "coffee", "bars", "records", "music", "culture", "outdoors", "stays", "other"]);
export type CategoryId = z.infer<typeof categoryIdSchema>;
export const categories = [
  { id: "ramen", label: "Ramen", color: "#e5732e" },
  { id: "sushi", label: "Sushi", color: "#e5484d" },
  { id: "food", label: "Food", color: "#c99a06" },
  { id: "coffee", label: "Cafés", color: "#8d5b3e" },
  { id: "bars", label: "Bars", color: "#8e4ec6" },
  { id: "records", label: "Records", color: "#3e63dd" },
  { id: "music", label: "Live jazz", color: "#d6409f" },
  { id: "culture", label: "Sights", color: "#0090ff" },
  { id: "outdoors", label: "Parks", color: "#30a46c" },
  { id: "stays", label: "Hotels", color: "#12a594" },
  { id: "other", label: "Other", color: "#8b8d98" },
] satisfies Array<{ id: CategoryId; label: string; color: string }>;

export function categoryFor(id: CategoryId) {
  return categories.find(category => category.id === id) ?? categories[categories.length - 1];
}
