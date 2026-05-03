import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import slugify from "slugify";
import { connectDB } from "../src/lib/db";
import { buildVariantSku } from "../src/lib/product-variants";
import { Category, Product, Seller, User } from "../src/lib/models";

loadEnvConfig(process.cwd());

const ADMIN_EMAIL = "iamhadiya13@gmail.com";
const ADMIN_PASSWORD = "1234512345";

const categorySeeds = [
  { name: "Men's T-Shirts", slug: "mens-t-shirts", gender: "men" },
  { name: "Men's Hoodies", slug: "mens-hoodies", gender: "men" },
  { name: "Men's Pants", slug: "mens-pants", gender: "men" },
  { name: "Men's Sneakers", slug: "mens-sneakers", gender: "men" },
  { name: "Men's Caps", slug: "mens-caps", gender: "men" },
  { name: "Men's Jackets", slug: "mens-jackets", gender: "men" },
  { name: "Women's Tops", slug: "womens-tops", gender: "women" },
  { name: "Women's Hoodies", slug: "womens-hoodies", gender: "women" },
  { name: "Women's Pants", slug: "womens-pants", gender: "women" },
  { name: "Women's Sneakers", slug: "womens-sneakers", gender: "women" },
  { name: "Women's Caps", slug: "womens-caps", gender: "women" },
  { name: "Women's Jackets", slug: "womens-jackets", gender: "women" },
  { name: "Dresses", slug: "dresses", gender: "women" },
  { name: "Co-ord Sets", slug: "co-ord-sets", gender: "women" },
  { name: "Unisex T-Shirts", slug: "unisex-t-shirts", gender: "unisex" },
  { name: "Unisex Hoodies", slug: "unisex-hoodies", gender: "unisex" },
  { name: "Unisex Joggers", slug: "unisex-joggers", gender: "unisex" },
  { name: "Unisex Sneakers", slug: "unisex-sneakers", gender: "unisex" },
  { name: "Accessories", slug: "accessories", gender: "unisex" },
  { name: "Streetwear Essentials", slug: "streetwear-essentials", gender: "unisex" },
] as const;

const COLORS_BASIC = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
];
const COLORS_EXTENDED = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#808080" },
];
const COLORS_WOMEN = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Beige", hex: "#F5F5DC" },
];
const COLORS_BOLD = [
  { name: "Black", hex: "#000000" },
  { name: "Navy", hex: "#001F5B" },
  { name: "Olive", hex: "#556B2F" },
];

const SIZES_CLOTHING = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZES_STANDARD = ["S", "M", "L", "XL", "XXL"];
const SIZES_SNEAKERS = ["UK6", "UK7", "UK8", "UK9", "UK10", "UK11"];
const SIZES_CAPS = ["S/M", "L/XL", "One Size"];

const productSeeds = [
  { title: "Oversized Drop Shoulder Tee", category: "mens-t-shirts", brand: "Night Circuit", gender: "men", colors: COLORS_EXTENDED, sizes: SIZES_CLOTHING, price: 899, discountPrice: 599 },
  { title: "Acid Wash Graphic Tee", category: "mens-t-shirts", brand: "Urban Pulse", gender: "men", colors: COLORS_BASIC, sizes: SIZES_CLOTHING, price: 799, discountPrice: 549 },
  { title: "Heavyweight Boxy Crew Tee", category: "mens-t-shirts", brand: "Block Supply", gender: "men", colors: COLORS_BOLD, sizes: SIZES_CLOTHING, price: 1099, discountPrice: 799 },
  { title: "Washed Street Pullover Hoodie", category: "mens-hoodies", brand: "Chrome District", gender: "men", colors: COLORS_EXTENDED, sizes: SIZES_STANDARD, price: 2499, discountPrice: 1799 },
  { title: "Zip Front Utility Hoodie", category: "mens-hoodies", brand: "North Alley", gender: "men", colors: COLORS_BASIC, sizes: SIZES_STANDARD, price: 2999, discountPrice: 2199 },
  { title: "Tapered Cargo Pants", category: "mens-pants", brand: "Metro Unit", gender: "men", colors: COLORS_BOLD, sizes: SIZES_STANDARD, price: 2199, discountPrice: 1599 },
  { title: "Relaxed Wide Leg Track Pants", category: "mens-pants", brand: "Set Pace", gender: "men", colors: COLORS_BASIC, sizes: SIZES_STANDARD, price: 1799, discountPrice: 1299 },
  { title: "Chunky Urban Runner Sneakers", category: "mens-sneakers", brand: "Ground Theory", gender: "men", colors: COLORS_BASIC, sizes: SIZES_SNEAKERS, price: 3999, discountPrice: 2999 },
  { title: "Low Top Canvas Street Sneakers", category: "mens-sneakers", brand: "Loudstep", gender: "men", colors: COLORS_BASIC, sizes: SIZES_SNEAKERS, price: 2499, discountPrice: 1899 },
  { title: "Logo Embroidered Snapback Cap", category: "mens-caps", brand: "Block Supply", gender: "men", colors: COLORS_EXTENDED, sizes: SIZES_CAPS, price: 799, discountPrice: 599 },
  { title: "Street Utility Trucker Cap", category: "mens-caps", brand: "Night Circuit", gender: "men", colors: COLORS_BOLD, sizes: SIZES_CAPS, price: 899, discountPrice: 649 },
  { title: "Bomber Street Jacket", category: "mens-jackets", brand: "District Noise", gender: "men", colors: COLORS_BASIC, sizes: SIZES_STANDARD, price: 4999, discountPrice: 3499 },
  { title: "Windbreaker Shell Jacket", category: "mens-jackets", brand: "Offgrid", gender: "men", colors: COLORS_BOLD, sizes: SIZES_STANDARD, price: 3999, discountPrice: 2799 },
  { title: "Cropped Graphic Tee", category: "womens-tops", brand: "Soft Riot", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_CLOTHING, price: 799, discountPrice: 549 },
  { title: "Oversized Slogan Tee", category: "womens-tops", brand: "Cult Wear", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_CLOTHING, price: 899, discountPrice: 649 },
  { title: "Fitted Ribbed Tank Top", category: "womens-tops", brand: "Form Co", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_CLOTHING, price: 699, discountPrice: 499 },
  { title: "Oversized Fleece Hoodie", category: "womens-hoodies", brand: "Soft Riot", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_STANDARD, price: 2299, discountPrice: 1699 },
  { title: "Cropped Zip Up Hoodie", category: "womens-hoodies", brand: "Form Co", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_STANDARD, price: 2499, discountPrice: 1799 },
  { title: "High Waist Cargo Pants", category: "womens-pants", brand: "Metro Unit", gender: "women", colors: COLORS_BOLD, sizes: SIZES_STANDARD, price: 2199, discountPrice: 1499 },
  { title: "Wide Leg Pleated Trousers", category: "womens-pants", brand: "Driftline", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_STANDARD, price: 1999, discountPrice: 1399 },
  { title: "Platform Street Sneakers", category: "womens-sneakers", brand: "Frame Eight", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_SNEAKERS, price: 3499, discountPrice: 2499 },
  { title: "Minimal White Leather Sneakers", category: "womens-sneakers", brand: "Loudstep", gender: "women", colors: COLORS_BASIC, sizes: SIZES_SNEAKERS, price: 2999, discountPrice: 2199 },
  { title: "Washed Curved Brim Cap", category: "womens-caps", brand: "Shade Room", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_CAPS, price: 699, discountPrice: 499 },
  { title: "Embroidered Bucket Hat", category: "womens-caps", brand: "Motion Club", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_CAPS, price: 799, discountPrice: 549 },
  { title: "Oversized Varsity Jacket", category: "womens-jackets", brand: "Parallel Unit", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_STANDARD, price: 4499, discountPrice: 3199 },
  { title: "Street Leather Panel Jacket", category: "womens-jackets", brand: "Cult Wear", gender: "women", colors: COLORS_BASIC, sizes: SIZES_STANDARD, price: 4799, discountPrice: 3399 },
  { title: "Floral Mini Dress", category: "dresses", brand: "Soft Riot", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_CLOTHING, price: 1999, discountPrice: 1399 },
  { title: "Satin Slip Street Dress", category: "dresses", brand: "Driftline", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_CLOTHING, price: 2299, discountPrice: 1599 },
  { title: "Streetwear Co-ord Set", category: "co-ord-sets", brand: "Form Co", gender: "women", colors: COLORS_WOMEN, sizes: SIZES_STANDARD, price: 2999, discountPrice: 2199 },
  { title: "Utility Cargo Co-ord Set", category: "co-ord-sets", brand: "Parallel Unit", gender: "women", colors: COLORS_BOLD, sizes: SIZES_STANDARD, price: 3299, discountPrice: 2399 },
  { title: "Essential White Tee", category: "unisex-t-shirts", brand: "Base Layer", gender: "unisex", colors: COLORS_BASIC, sizes: SIZES_CLOTHING, price: 599, discountPrice: 449 },
  { title: "Tie Dye Oversized Tee", category: "unisex-t-shirts", brand: "Pigment Lab", gender: "unisex", colors: COLORS_EXTENDED, sizes: SIZES_CLOTHING, price: 899, discountPrice: 649 },
  { title: "Vintage Band Style Tee", category: "unisex-t-shirts", brand: "Echo Wear", gender: "unisex", colors: COLORS_BASIC, sizes: SIZES_CLOTHING, price: 799, discountPrice: 549 },
  { title: "Classic Pullover Hoodie", category: "unisex-hoodies", brand: "Mono State", gender: "unisex", colors: COLORS_EXTENDED, sizes: SIZES_STANDARD, price: 2199, discountPrice: 1599 },
  { title: "Sherpa Lined Zip Hoodie", category: "unisex-hoodies", brand: "Layer Up", gender: "unisex", colors: COLORS_BASIC, sizes: SIZES_STANDARD, price: 3499, discountPrice: 2499 },
  { title: "Tech Fleece Joggers", category: "unisex-joggers", brand: "Set Pace", gender: "unisex", colors: COLORS_EXTENDED, sizes: SIZES_STANDARD, price: 1799, discountPrice: 1299 },
  { title: "Parachute Nylon Joggers", category: "unisex-joggers", brand: "Driftline", gender: "unisex", colors: COLORS_BOLD, sizes: SIZES_STANDARD, price: 2199, discountPrice: 1599 },
  { title: "Classic White On White Sneakers", category: "unisex-sneakers", brand: "Step Lab", gender: "unisex", colors: COLORS_BASIC, sizes: SIZES_SNEAKERS, price: 2999, discountPrice: 2199 },
  { title: "Retro High Top Sneakers", category: "unisex-sneakers", brand: "Loudstep", gender: "unisex", colors: COLORS_BASIC, sizes: SIZES_SNEAKERS, price: 3499, discountPrice: 2599 },
  { title: "Five Panel Street Cap", category: "accessories", brand: "Motion Club", gender: "unisex", colors: COLORS_EXTENDED, sizes: SIZES_CAPS, price: 699, discountPrice: 499 },
  { title: "Leather Card Wallet", category: "accessories", brand: "Carry Co", gender: "unisex", colors: COLORS_BASIC, sizes: ["One Size"], price: 999, discountPrice: 699 },
  { title: "Canvas Tote Bag", category: "accessories", brand: "Carry Co", gender: "unisex", colors: COLORS_BASIC, sizes: ["One Size"], price: 799, discountPrice: 549 },
  { title: "Layered Coach Jacket", category: "streetwear-essentials", brand: "Rivet Lab", gender: "unisex", colors: COLORS_EXTENDED, sizes: SIZES_STANDARD, price: 3999, discountPrice: 2799 },
  { title: "Puffer Street Vest", category: "streetwear-essentials", brand: "North Alley", gender: "unisex", colors: COLORS_BASIC, sizes: SIZES_STANDARD, price: 2999, discountPrice: 2199 },
] as const;

type ProductSeed = (typeof productSeeds)[number];

const COLOR_PRICE_ADJUSTMENTS: Record<string, number> = {
  black: 0,
  white: 80,
  grey: 40,
  navy: 120,
  olive: 90,
  pink: 70,
  beige: 60,
};

function getSizePriceAdjustment(size: string) {
  const normalized = size.trim().toUpperCase();
  if (normalized === "XS") return -40;
  if (normalized === "S") return 0;
  if (normalized === "M") return 40;
  if (normalized === "L") return 90;
  if (normalized === "XL") return 150;
  if (normalized === "XXL") return 220;
  if (normalized === "S/M") return 0;
  if (normalized === "L/XL") return 80;
  if (normalized === "ONE SIZE") return 0;
  const shoeMatch = normalized.match(/^UK(\d+)$/);
  if (shoeMatch) {
    return (Number(shoeMatch[1]) - 8) * 60;
  }
  return 0;
}

function getColorPriceAdjustment(colorName: string) {
  return COLOR_PRICE_ADJUSTMENTS[colorName.trim().toLowerCase()] ?? 50;
}

function getVariantStock(seedItem: ProductSeed, colorIndex: number, sizeIndex: number) {
  const baseStock =
    seedItem.category.includes("sneakers")
      ? 7
      : seedItem.category.includes("caps") || seedItem.sizes.includes("One Size")
        ? 10
        : 12;
  return baseStock + ((colorIndex * 5 + sizeIndex * 3 + seedItem.title.length) % 7);
}

function makeVariants(
  seedItem: ProductSeed,
  slug: string,
  images: string[],
) {
  const variants = [];
  for (const [colorIndex, color] of seedItem.colors.entries()) {
    for (const [sizeIndex, size] of seedItem.sizes.entries()) {
      const sizeAdjustment = getSizePriceAdjustment(size);
      const colorAdjustment = getColorPriceAdjustment(color.name);
      const salePrice = Math.max(199, seedItem.discountPrice + sizeAdjustment + colorAdjustment);
      const compareAtPrice = Math.max(salePrice, seedItem.price + sizeAdjustment + colorAdjustment);
      variants.push({
        size,
        color: { name: color.name, hex: color.hex },
        stock: getVariantStock(seedItem, colorIndex, sizeIndex),
        sku: buildVariantSku(slug, color.name, size),
        price: salePrice,
        compareAtPrice,
        isActive: true,
        image: images[0] || "",
      });
    }
  }
  return variants;
}

function buildImages(title: string, index: number) {
  return [
    `https://image.pollinations.ai/prompt/${encodeURIComponent(`${title} streetwear fashion product photography white background`)}?width=800&height=1000&nologo=true&seed=${index * 3}`,
    `https://image.pollinations.ai/prompt/${encodeURIComponent(`${title} streetwear apparel back view white background`)}?width=800&height=1000&nologo=true&seed=${index * 3 + 1}`,
    `https://image.pollinations.ai/prompt/${encodeURIComponent(`${title} urban fashion lifestyle street style`)}?width=800&height=1000&nologo=true&seed=${index * 3 + 2}`,
  ];
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in .env.local");
  }

  await connectDB();

  await Product.deleteMany({});
  await Category.deleteMany({});
  await Seller.deleteMany({});
  await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        name: "StyleHub Admin",
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        isVerified: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const adminSeller = await Seller.findOneAndUpdate(
    { user: admin._id },
    {
      $set: {
        shopName: "StyleHub Official",
        shopSlug: "stylehub-official",
        description: "Official StyleHub store",
        isApproved: true,
        isActive: true,
        totalEarnings: 0,
        pendingPayout: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const categoryDocs = new Map<string, mongoose.Types.ObjectId>();
  for (const [index, cat] of categorySeeds.entries()) {
    const category = await Category.findOneAndUpdate(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          slug: cat.slug,
          gender: cat.gender,
          image: `https://image.pollinations.ai/prompt/${cat.gender}+streetwear+${encodeURIComponent(cat.name)}+fashion+clothing+editorial?width=400&height=400&nologo=true&seed=${index}`,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categoryDocs.set(cat.slug, category._id);
  }

  for (const [index, seedItem] of productSeeds.entries()) {
    const categoryId = categoryDocs.get(seedItem.category);
    if (!categoryId) {
      throw new Error(`Missing category ${seedItem.category}`);
    }

    const slug = slugify(seedItem.title, { lower: true, strict: true });
    const images = buildImages(seedItem.title, index + 1);
    const variants = makeVariants(seedItem, slug, images);
    const tags = [
      seedItem.gender,
      seedItem.category.replace(/^mens-|^womens-|^unisex-/, ""),
      seedItem.brand.toLowerCase(),
      "streetwear",
      "stylehub",
    ];

    await Product.create({
      title: seedItem.title,
      slug,
      description: `${seedItem.title} by ${seedItem.brand}. A premium streetwear staple crafted for bold everyday styling. Designed for comfort, built for the culture - wear it your way.`,
      shortDescription: `Premium ${seedItem.title.toLowerCase()} with street-ready structure.`,
      price: seedItem.price,
      discountPrice: seedItem.discountPrice,
      images,
      category: categoryId,
      brand: seedItem.brand,
      seller: adminSeller._id,
      gender: seedItem.gender,
      variants,
      isPublished: true,
      isFeatured: index < 8,
      acceptedPayments: {
        razorpay: true,
        stripe: true,
        cod: true,
      },
      averageRating: Number((3.6 + ((index % 6) * 0.2)).toFixed(1)),
      totalReviews: 8 + ((index * 7) % 64),
      totalSold: 18 + ((index * 11) % 180),
      tags,
    });
  }

  for (const [slug, categoryId] of categoryDocs) {
    const count = await Product.countDocuments({ category: categoryId });
    if (count < 2) {
      throw new Error(`Category ${slug} only has ${count} seeded products`);
    }
    await Category.findByIdAndUpdate(categoryId, { productCount: count });
  }

  const totalCategories = await Category.countDocuments();
  const totalProducts = await Product.countDocuments();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("STYLEHUB SEED COMPLETE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Admin:      ${ADMIN_EMAIL}`);
  console.log(`Password:   ${ADMIN_PASSWORD}`);
  console.log(`Categories: ${totalCategories} (6 men, 8 women, 6 unisex)`);
  console.log(`Products:   ${totalProducts} (12 men, 14 women, 14 unisex)`);
  console.log("Variants:   ~400 (color × size combinations)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
