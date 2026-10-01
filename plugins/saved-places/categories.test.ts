import { describe, expect, it } from "vitest";
import { categories, categoryIdSchema, groupOf, groups, includesCategory, resolveCategory } from "./categories";
import { categoryIcons } from "./category-icons";

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe("category taxonomy", () => {
  it("keeps every stored id valid and gives each one an icon and a group", () => {
    for (const id of ["ramen", "sushi", "food", "coffee", "bars", "records", "music", "culture", "outdoors", "stays", "other"]) expect(categoryIdSchema.safeParse(id).success).toBe(true);
    for (const id of categoryIdSchema.options) {
      expect(categoryIcons[id]).toBeDefined();
      expect(groups).toContain(groupOf(id));
    }
    expect(new Set(categories.map(c => c.id)).size).toBe(categoryIdSchema.options.length);
  });

  it("uses group colors that keep a white glyph readable", () => {
    for (const group of groups) expect(1.05 / (luminance(group.color) + 0.05)).toBeGreaterThanOrEqual(3);
  });

  it("maps each basemap POI class to one category", () => {
    const values = categories.flatMap(c => c.poi);
    expect(new Set(values).size).toBe(values.length);
  });

  it("refines broad stored categories from the place type or name", () => {
    expect(resolveCategory({ category: "culture", placeType: "Art museum", name: "Mori Art Museum", address: "" })).toBe("museum");
    expect(resolveCategory({ category: "culture", placeType: "Shinto shrine", name: "Meiji Jingu", address: "" })).toBe("shrine");
    expect(resolveCategory({ category: "outdoors", placeType: "Theme park", name: "Fuji-Q", address: "" })).toBe("amusement");
    expect(resolveCategory({ category: "other", placeType: null, name: "Disk Union Record Store", address: "" })).toBe("records");
    expect(resolveCategory({ category: "music", placeType: "Music bar", name: "JBS", address: "" })).toBe("music");
    expect(resolveCategory({ category: "ramen", placeType: "Sushi restaurant", name: "Ichiran", address: "" })).toBe("ramen");
    expect(resolveCategory({ category: "other", placeType: null, name: "Somewhere", address: "" })).toBe("other");
  });

  it.each([
    ["Bar", "JAM Record Bar", "bars"],
    ["Dessert restaurant", "Azuki to Kōri", "dessert"],
    ["Restaurant", "Sushi Sho", "sushi"],
    ["Restaurant", "Koloa Fish Market", "food"],
    ["Standing sushi bar", "Uogashi Nihon-Ichi", "sushi"],
    ["Sports bar", "The Local", "bars"],
    ["Cafe & bar", "Dug Jazz Cafe & Bar", "music"],
    ["Kitchen supply store", "Kama-Asa", "shop"],
    ["Dojo restaurant", "Dojo", "food"],
    ["Swimwear store", "Seafolly", "fashion"],
    ["Observation deck", "Tokyo Tower", "viewpoint"],
    [null, "Mitsui Garden Hotel Kyoto", "stays"],
    [null, "Shoe Palace", "fashion"],
    [null, "Beach Road Scissors Cut Curry Rice", "food"],
    [null, "Skinny's Lounge", "bars"],
    [null, "Taishan Cuisine", "food"],
    [null, "Song Fa Bak Kut Teh 11 New Bridge Road", "food"],
  ] as const)("puts a %s named %s in %s", (placeType, name, expected) => {
    expect(resolveCategory({ category: "other", placeType, name, address: "" })).toBe(expected);
  });

  it("files bare addresses and dropped pins under Addresses, and Google neighborhoods under Neighborhoods", () => {
    const resolve = (name: string, address = "", placeType: string | null = null) => resolveCategory({ category: "other", placeType, name, address });
    expect(resolve("190 Elizabeth St", "190 Elizabeth St, New York, NY 10012")).toBe("address");
    expect(resolve("34 Nonhyeon-ro 152-gil")).toBe("address");
    expect(resolve("Via San Paolo, 34")).toBe("address");
    expect(resolve("251 Compostela", "251 Compostela, La Habana, Cuba")).toBe("address");
    expect(resolve(`31°13'22.6"N 121°28'11.4"E`)).toBe("address");
    expect(resolve("7 Adams", "1963 Sutter St, San Francisco")).toBe("other");
    expect(resolve("001", "Tai Kwun, Hollywood Rd")).toBe("other");
    expect(resolveCategory({ category: "food", placeType: null, name: "7 Adams", address: "1963 Sutter St" })).toBe("food");
    expect(resolve("Shimokitazawa", "", "Neighborhood")).toBe("neighborhood");
  });

  it("keeps each original broad filter id matching what it matched before the taxonomy grew", () => {
    expect(includesCategory("culture", "shrine")).toBe(true);
    expect(includesCategory("food", "pizza")).toBe(true);
    expect(includesCategory("food", "ramen")).toBe(false);
    expect(includesCategory("food", "sushi")).toBe(false);
    expect(includesCategory("bars", "wine")).toBe(true);
    expect(includesCategory("bars", "music")).toBe(false);
    expect(includesCategory("coffee", "bakery")).toBe(true);
    expect(includesCategory("museum", "shrine")).toBe(false);
    expect(includesCategory("music", "bars")).toBe(false);
  });
});
