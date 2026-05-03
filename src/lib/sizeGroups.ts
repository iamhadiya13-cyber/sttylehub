export const SIZE_GROUPS = {
  clothing: {
    label: "Clothing Sizes",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    description: "Standard clothing sizes",
  },
  footwear: {
    label: "UK Shoe Sizes",
    sizes: ["UK5", "UK6", "UK7", "UK8", "UK9", "UK10", "UK11", "UK12"],
    description: "UK standard shoe sizes",
  },
  indian_footwear: {
    label: "Indian Shoe Sizes",
    sizes: ["IND5", "IND6", "IND7", "IND8", "IND9", "IND10", "IND11"],
    description: "Indian standard sizes",
  },
  headwear: {
    label: "Cap Sizes",
    sizes: ["S/M", "L/XL", "One Size"],
    description: "Standard cap sizes",
  },
  accessories: {
    label: "Accessory Sizes",
    sizes: ["One Size", "XS", "S", "M", "L"],
    description: "General accessory sizing",
  },
  bottoms: {
    label: "Waist Sizes",
    sizes: ["28", "30", "32", "34", "36", "38", "40"],
    description: "Waist measurement in inches",
  },
  none: {
    label: "No Size",
    sizes: ["One Size"],
    description: "No size variation",
  },
} as const;

export const CATEGORY_SIZE_MAP: Record<string, keyof typeof SIZE_GROUPS> = {
  "mens-t-shirts": "clothing",
  "womens-tops": "clothing",
  "mens-hoodies": "clothing",
  "womens-hoodies": "clothing",
  "unisex-hoodies": "clothing",
  "unisex-t-shirts": "clothing",
  "streetwear-essentials": "clothing",
  "mens-jackets": "clothing",
  "womens-jackets": "clothing",
  "mens-pants": "bottoms",
  "womens-pants": "bottoms",
  "unisex-joggers": "clothing",
  "mens-sneakers": "footwear",
  "womens-sneakers": "footwear",
  "unisex-sneakers": "footwear",
  "mens-caps": "headwear",
  "womens-caps": "headwear",
  dresses: "clothing",
  "co-ord-sets": "clothing",
  accessories: "accessories",
};

export function getSizesForCategory(categorySlug: string): string[] {
  const group = CATEGORY_SIZE_MAP[categorySlug] || "clothing";
  return [...SIZE_GROUPS[group].sizes];
}

export function getSizeGroupForCategory(categorySlug: string): keyof typeof SIZE_GROUPS {
  return CATEGORY_SIZE_MAP[categorySlug] || "clothing";
}
