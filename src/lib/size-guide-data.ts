export type SizeGuideInstruction = {
  label: string;
  description: string;
};

export type SizeGuideTable = {
  type: "table";
  columns: string[];
  rows: string[][];
};

export type SizeGuideNote = {
  type: "note";
  note: string;
};

export type ResolvedSizeGuide = (SizeGuideTable | SizeGuideNote) & {
  fitNote: string;
  instructions: SizeGuideInstruction[];
};

type SizeGuideDefinition = ResolvedSizeGuide & {
  keywords: string[];
};

const TOPS_GUIDE: SizeGuideDefinition = {
  type: "table",
  keywords: ["tops", "top", "t-shirts", "t-shirt", "tees", "tee", "hoodies", "hoodie", "jackets", "jacket", "shirts", "shirt"],
  columns: ["Size", "Chest inches", "Shoulder inches", "Length inches", "Sleeve inches"],
  rows: [
    ["XS", '36"', '16.5"', '25"', '24"'],
    ["S", '38"', '17.25"', '26"', '24.5"'],
    ["M", '40"', '18"', '27"', '25"'],
    ["L", '43"', '18.75"', '28"', '25.5"'],
    ["XL", '46"', '19.5"', '29"', '26"'],
    ["XXL", '49"', '20.25"', '30"', '26.5"'],
  ],
  fitNote: "This style is cut oversized. We recommend sizing down one size for a fitted look.",
  instructions: [
    {
      label: "Chest",
      description: "Measure around the fullest part of your chest with the tape level and relaxed.",
    },
    {
      label: "Shoulder",
      description: "Measure straight across from one shoulder point to the other along the back.",
    },
    {
      label: "Sleeve",
      description: "Measure from the top of the shoulder down to the wrist with your arm slightly bent.",
    },
  ],
};

const BOTTOMS_GUIDE: SizeGuideDefinition = {
  type: "table",
  keywords: ["pants", "pant", "joggers", "jogger", "jeans", "jean", "shorts", "short"],
  columns: ["Size", "Waist inches", "Hip inches", "Inseam inches", "Length inches"],
  rows: [
    ["XS/28", '28"', '36"', '28"', '38"'],
    ["S/30", '30"', '38"', '29"', '39"'],
    ["M/32", '32"', '40"', '30"', '40"'],
    ["L/34", '34"', '42"', '31"', '41"'],
    ["XL/36", '36"', '44"', '32"', '42"'],
    ["XXL/38", '38"', '46"', '33"', '43"'],
  ],
  fitNote: "These run true to size. If between sizes size up for comfort.",
  instructions: [
    {
      label: "Waist",
      description: "Measure around your natural waistline without pulling the tape tight.",
    },
    {
      label: "Hip",
      description: "Measure around the fullest part of your hips while standing with feet together.",
    },
    {
      label: "Inseam",
      description: "Measure from the top of the inner thigh down to the hem along the inside leg.",
    },
  ],
};

const DRESSES_GUIDE: SizeGuideDefinition = {
  type: "table",
  keywords: ["dresses", "dress", "co-ord sets", "co-ord set", "co ord", "coord"],
  columns: ["Size", "Bust inches", "Waist inches", "Hip inches", "Length inches"],
  rows: [
    ["XS", '32"', '25"', '35"', '33"'],
    ["S", '34"', '27"', '37"', '34"'],
    ["M", '36"', '29"', '39"', '35"'],
    ["L", '39"', '32"', '42"', '36"'],
    ["XL", '42"', '35"', '45"', '37"'],
    ["XXL", '45"', '38"', '48"', '38"'],
  ],
  fitNote: "Cut for a relaxed silhouette. True to size.",
  instructions: [
    {
      label: "Bust",
      description: "Measure around the fullest part of your bust while keeping the tape level.",
    },
    {
      label: "Waist",
      description: "Measure your natural waistline at the narrowest point above the hips.",
    },
    {
      label: "Hip",
      description: "Measure around the fullest part of the hips for the most accurate fit.",
    },
  ],
};

const CAPS_GUIDE: SizeGuideDefinition = {
  type: "table",
  keywords: ["caps", "cap", "hats", "hat"],
  columns: ["Size", "Head Circumference cm", "Head Circumference inches"],
  rows: [
    ["S/M", "56 - 58 cm", '22" - 22.8"'],
    ["L/XL", "59 - 61 cm", '23.2" - 24"'],
    ["One Size", "57 - 60 cm", '22.4" - 23.6"'],
  ],
  fitNote: "Adjustable strap fits most head sizes.",
  instructions: [
    {
      label: "Head Circumference",
      description: "Wrap the tape around your head just above the ears and across the forehead.",
    },
  ],
};

const FOOTWEAR_GUIDE: SizeGuideDefinition = {
  type: "table",
  keywords: ["sneakers", "sneaker", "footwear", "shoe", "shoes"],
  columns: ["UK Size", "US Size", "EU Size", "Foot Length cm"],
  rows: [
    ["UK 6", "US 7", "EU 40", "24.5 cm"],
    ["UK 7", "US 8", "EU 41", "25.4 cm"],
    ["UK 8", "US 9", "EU 42", "26.2 cm"],
    ["UK 9", "US 10", "EU 43", "27.1 cm"],
    ["UK 10", "US 11", "EU 44", "27.9 cm"],
    ["UK 11", "US 12", "EU 45", "28.8 cm"],
  ],
  fitNote: "True to size. Half sizes round up.",
  instructions: [
    {
      label: "Foot Length",
      description: "Stand on a sheet of paper, mark heel to longest toe, and measure the distance in centimeters.",
    },
  ],
};

const ACCESSORIES_GUIDE: SizeGuideDefinition = {
  type: "note",
  keywords: ["accessories", "accessory", "wallets", "wallet", "bags", "bag"],
  note: "Dimensions vary by product. Refer to the product description for specific measurements.",
  fitNote: "Dimensions vary by product. Refer to the product description for exact measurements and fit details.",
  instructions: [
    {
      label: "Product Dimensions",
      description: "Check the product description for exact dimensions, strap drop, or capacity details.",
    },
  ],
};

const FALLBACK_GUIDE: SizeGuideDefinition = {
  type: "table",
  keywords: [],
  columns: ["Size", "Chest inches", "Waist inches", "Length inches"],
  rows: [
    ["XS", '34"', '28"', '25"'],
    ["S", '36"', '30"', '26"'],
    ["M", '38"', '32"', '27"'],
    ["L", '41"', '35"', '28"'],
    ["XL", '44"', '38"', '29"'],
    ["XXL", '47"', '41"', '30"'],
  ],
  fitNote: "This product follows standard sizing.",
  instructions: [
    {
      label: "Chest",
      description: "Measure around the fullest part of your chest with the tape level.",
    },
    {
      label: "Waist",
      description: "Measure around your natural waistline just above the hips.",
    },
    {
      label: "Length",
      description: "Measure from the highest shoulder point or waistband down to the hem.",
    },
  ],
};

const SIZE_GUIDES: SizeGuideDefinition[] = [
  TOPS_GUIDE,
  BOTTOMS_GUIDE,
  DRESSES_GUIDE,
  CAPS_GUIDE,
  FOOTWEAR_GUIDE,
  ACCESSORIES_GUIDE,
];

function normalizeCategory(category?: string) {
  return (category || "").trim().toLowerCase();
}

export function resolveSizeGuide(category?: string): ResolvedSizeGuide {
  const normalized = normalizeCategory(category);
  if (!normalized) {
    return FALLBACK_GUIDE;
  }

  const matchedGuide =
    SIZE_GUIDES.find((guide) =>
      guide.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
    ) || FALLBACK_GUIDE;

  return matchedGuide;
}
