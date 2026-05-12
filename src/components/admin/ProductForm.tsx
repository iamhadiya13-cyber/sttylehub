"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import { Button, fallbackImage, ProductCard, TextArea, TextInput, type Category, type Product, useApi } from "@/components/screens/shared";
import {
  getDisplayPricingForProduct,
  getTotalStock,
  syncVariantsForProduct,
  type ProductVariant,
} from "@/lib/product-variants";
import { CATEGORY_SIZE_MAP, getSizesForCategory, SIZE_GROUPS } from "@/lib/sizeGroups";
import { useButtonLoading } from "@/hooks/useButtonLoading";
import { useLoadingStore } from "@/stores/loading-store";

type ProductFormState = {
  title: string;
  brand: string;
  description: string;
  shortDescription: string;
  price: string;
  discountPrice: string;
  category: string;
  gender: "men" | "women" | "unisex";
  tags: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  variants: ProductVariant[];
  acceptedPayments: { upi: boolean; creditCard: boolean; cod: boolean };
  returnAllowed: boolean;
  returnWindowDays: string;
  exchangeAllowed: boolean;
  exchangeWindowDays: string;
  isPublished: boolean;
  isFeatured: boolean;
};

const defaultColors = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
];

const formSectionClassName = "space-y-4 border-b border-white/6 pb-6 last:border-b-0 last:pb-0";

function makeInitialForm(product?: Product | null): ProductFormState {
  const categorySlug = product?.category?.slug || "";
  const defaultSizes = getSizesForCategory(categorySlug);
  const sizes = product?.sizes?.length ? product.sizes : defaultSizes;
  const colors = product?.colors?.length ? product.colors : defaultColors;
  const variants = syncVariantsForProduct({
    slug: product?.slug || "draft-product",
    sizes: [],
    colors: [],
    totalStock: 0,
    variants:
      product?.variants?.length
        ? product.variants
        : colors.flatMap((color) =>
            sizes.map((size) => ({
              _id: `${color.name}-${size}`,
              size,
              color,
              stock: 10,
              sku: "",
              price: Number(product?.discountPrice || product?.price || 0),
              compareAtPrice: Number(product?.price || product?.discountPrice || 0),
              image: "",
              isActive: true,
            })),
          ),
  }).variants || [];

  return {
    title: product?.title || "",
    brand: product?.brand || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    price: product?.price ? String(product.price) : "",
    discountPrice: product?.discountPrice ? String(product.discountPrice) : "",
    category: product?.category?._id || "",
    gender: product?.gender || "unisex",
    tags: product?.tags?.join(", ") || "",
    sizes,
    colors,
    variants,
    acceptedPayments: product?.acceptedPayments || { upi: true, creditCard: true, cod: true },
    returnAllowed: product?.returnAllowed ?? false,
    returnWindowDays: String(product?.returnWindowDays ?? 7),
    exchangeAllowed: product?.exchangeAllowed ?? false,
    exchangeWindowDays: String(product?.exchangeWindowDays ?? 7),
    isPublished: product?.isPublished ?? true,
    isFeatured: product?.isFeatured ?? false,
  };
}

function normalizeColorImages(product?: Product | null) {
  if (!product?.colorImages) return {} as Record<string, string[]>;
  return Object.fromEntries(
    Object.entries(product.colorImages).map(([key, value]) => [key, Array.isArray(value) ? value : []]),
  );
}

function buildVariants(form: ProductFormState) {
  const existingMap = new Map(form.variants.map((variant) => [`${variant.color.name}::${variant.size}`, variant]));
  return syncVariantsForProduct({
    slug: form.title || "draft-product",
    sizes: [],
    colors: [],
    totalStock: 0,
    variants: form.colors
      .filter((color) => color.name.trim())
      .flatMap((color) =>
        form.sizes.map((size) => {
          const match = existingMap.get(`${color.name}::${size}`);
          return {
            _id: match?._id,
            size,
            color,
            stock: match?.stock ?? 10,
            sku: match?.sku || "",
            price: match?.price ?? 0,
            compareAtPrice: match?.compareAtPrice ?? null,
            image: match?.image || "",
            isActive: match?.isActive !== false,
            weight: match?.weight ?? null,
            barcode: match?.barcode || "",
          };
        }),
      ),
  }).variants || [];
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const setLoading = useLoadingStore((state) => state.setLoading);
  const { loading: backLoading, trigger: triggerBack } = useButtonLoading();
  const isEditing = Boolean(productId);
  const { data: productResponse, loading: productLoading } = useApi<{ data?: Product } | Product | null>(
    productId ? `/api/products/${productId}` : null,
    null,
  );
  const resolvedProduct = productResponse && "data" in (productResponse as Record<string, unknown>)
    ? ((productResponse as { data?: Product }).data || null)
    : (productResponse as Product | null);
  const { data: categories } = useApi<Category[]>("/api/categories", []);
  const [form, setForm] = useState<ProductFormState>(makeInitialForm());
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [manualImageUrls, setManualImageUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sizeGroupLabel, setSizeGroupLabel] = useState("Clothing Sizes");

  useEffect(() => {
    if (resolvedProduct) {
      setForm(makeInitialForm(resolvedProduct));
      setColorImages(normalizeColorImages(resolvedProduct));
      setManualImageUrls({});
    }
  }, [resolvedProduct]);

  useEffect(() => {
    const selectedCategory = categories.find((item) => item._id === form.category);
    const categorySlug = selectedCategory?.slug || resolvedProduct?.category?.slug || "";
    const group = CATEGORY_SIZE_MAP[categorySlug] || "clothing";
    setSizeGroupLabel(SIZE_GROUPS[group].label);
  }, [categories, form.category, resolvedProduct?.category?.slug]);

  useEffect(() => {
    setForm((current) => ({ ...current, variants: buildVariants(current) }));
  }, [JSON.stringify(form.colors), JSON.stringify(form.sizes), form.title]);

  useEffect(() => {
    setColorImages((previous) => {
      const next: Record<string, string[]> = {};
      form.colors.forEach((color) => {
        if (!color.name.trim()) return;
        next[color.name] = previous[color.name] || [];
      });
      return next;
    });
    setManualImageUrls((previous) => {
      const next: Record<string, string> = {};
      form.colors.forEach((color) => {
        if (!color.name.trim()) return;
        next[color.name] = previous[color.name] || "";
      });
      return next;
    });
  }, [JSON.stringify(form.colors)]);

  const filteredCategories = categories.filter((category) =>
    form.gender === "unisex"
      ? category.gender === "unisex" || category.gender === "all"
      : category.gender === form.gender || category.gender === "unisex" || category.gender === "all",
  );

  const discountPercent = useMemo(() => {
    const price = Number(form.price || 0);
    const discountPrice = Number(form.discountPrice || 0);
    if (!price || !discountPrice || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  }, [form.discountPrice, form.price]);

  const allImages = Object.values(colorImages).flat();
  const previewProduct: Product = {
    _id: resolvedProduct?._id || "preview",
    title: form.title || "Product preview",
    slug: resolvedProduct?.slug || "preview",
    brand: form.brand || "Brand",
    shortDescription: form.shortDescription || "",
    description: form.description || "",
    ...getDisplayPricingForProduct({
      price: Number(form.price || 0),
      discountPrice: Number(form.discountPrice || form.price || 0),
      variants: form.variants,
    }),
    images: allImages.length ? allImages : [fallbackImage("")],
    colorImages,
    category: filteredCategories.find((item) => item._id === form.category),
    seller: undefined,
    sizes: form.sizes,
    colors: form.colors,
    variants: form.variants.map((variant) => ({
      ...variant,
      _id:
        typeof variant._id === "string"
          ? variant._id
          : variant._id?.toString(),
      price: Number(variant.price || 0),
      compareAtPrice: variant.compareAtPrice ?? null,
    })),
    totalStock: getTotalStock(form.variants),
    isPublished: form.isPublished,
    isFeatured: form.isFeatured,
    averageRating: resolvedProduct?.averageRating || 0,
    totalReviews: resolvedProduct?.totalReviews || 0,
    totalSold: resolvedProduct?.totalSold || 0,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    gender: form.gender,
    acceptedPayments: form.acceptedPayments,
    returnAllowed: form.returnAllowed,
    returnWindowDays: Number(form.returnWindowDays || 7),
    exchangeAllowed: form.exchangeAllowed,
    exchangeWindowDays: Number(form.exchangeWindowDays || 7),
  };

  const handleColorImageUpload = async (colorName: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const existing = colorImages[colorName] || [];
    const slots = 4 - existing.length;
    if (slots <= 0) {
      toast.error(`Max 4 images for ${colorName}`);
      return;
    }

    setUploadingColor(colorName);
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, slots)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("/api/upload/image", { method: "POST", body: formData });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || `Failed to upload ${file.name}`);
        }
        if (json.data?.url) uploaded.push(json.data.url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Failed to upload ${file.name}`);
      }
    }

    if (uploaded.length) {
      setColorImages((previous) => ({
        ...previous,
        [colorName]: [...(previous[colorName] || []), ...uploaded],
      }));
      toast.success(`${uploaded.length} image(s) added for ${colorName}`);
    }
    setUploadingColor(null);
  };

  const addColorImageUrl = (colorName: string) => {
    const trimmed = (manualImageUrls[colorName] || "").trim();
    if (!trimmed) return;
    const existing = colorImages[colorName] || [];
    if (existing.length >= 4) {
      toast.error(`Max 4 images for ${colorName}`);
      return;
    }
    if (existing.includes(trimmed)) {
      toast.error("This URL is already added");
      return;
    }
    setColorImages((previous) => ({
      ...previous,
      [colorName]: [...(previous[colorName] || []), trimmed],
    }));
    setManualImageUrls((previous) => ({ ...previous, [colorName]: "" }));
  };

  const removeColorImage = (colorName: string, index: number) => {
    setColorImages((previous) => ({
      ...previous,
      [colorName]: previous[colorName].filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSaveProduct = async () => {
    if (!form.title.trim()) {
      toast.error("Product title is required");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    const seenVariantKeys = new Set<string>();
    const seenSkus = new Set<string>();
    for (const variant of form.variants) {
      const key = `${variant.color.name.trim().toLowerCase()}::${variant.size.trim().toUpperCase()}`;
      if (seenVariantKeys.has(key)) {
        toast.error(`Duplicate variant combination: ${variant.color.name} / ${variant.size}`);
        return;
      }
      seenVariantKeys.add(key);
      if (!variant.price || variant.price <= 0) {
        toast.error(`Set a valid price for ${variant.color.name} / ${variant.size}`);
        return;
      }
      if (!Number.isInteger(variant.stock) || variant.stock < 0) {
        toast.error(`Set a valid stock value for ${variant.color.name} / ${variant.size}`);
        return;
      }
      if (variant.sku) {
        if (seenSkus.has(variant.sku)) {
          toast.error(`Duplicate SKU: ${variant.sku}`);
          return;
        }
        seenSkus.add(variant.sku);
      }
    }

    setSaving(true);
    try {
      const flattenedImages = Object.values(colorImages).flat();
      const body = {
        title: form.title.trim(),
        description: form.description || "",
        shortDescription: form.shortDescription || "",
        price: Number(form.price),
        discountPrice: Number(form.discountPrice) || Number(form.price),
        category: form.category,
        categoryId: form.category,
        brand: form.brand || "",
        gender: form.gender || "unisex",
        sizes: form.sizes || [],
        colors: form.colors || [],
        variants: form.variants || [],
        tags: typeof form.tags === "string" ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
        isPublished: form.isPublished ?? true,
        isFeatured: form.isFeatured ?? false,
        acceptedPayments: form.acceptedPayments || {
          upi: true,
          creditCard: true,
          cod: true,
        },
        returnAllowed: form.returnAllowed,
        returnWindowDays: Math.min(30, Math.max(1, Number(form.returnWindowDays || 7))),
        exchangeAllowed: form.exchangeAllowed,
        exchangeWindowDays: Math.min(30, Math.max(1, Number(form.exchangeWindowDays || 7))),
        colorImages: Object.fromEntries(Object.entries(colorImages).filter(([, urls]) => urls.length > 0)),
        images: flattenedImages.length > 0 ? flattenedImages : [],
      };

      const url = isEditing ? `/api/products/${productId}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save product");
      }

      toast.success(isEditing ? "Product updated!" : "Product created!");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title={isEditing ? `Edit Product${form.title ? ` - ${form.title}` : ""}` : "Add Product"}
      action={
        <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
          <Button type="button" variant="secondary" loading={backLoading} loadingText="Loading..." className="h-11 px-4" onClick={() => void triggerBack(async () => { setLoading(true); router.back(); })}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button type="button" onClick={() => void handleSaveProduct()} loading={saving} loadingText="Saving product...">
            <Save className="h-4 w-4" />
            Save Product
          </Button>
        </div>
      }
    >
      {productLoading && isEditing ? (
        <div className="h-[600px] animate-pulse rounded-xl border border-[#1F1F1F] bg-[#111111]" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr),340px] xl:gap-5">
          <div className="rounded-[24px] border border-white/8 bg-[#101010] p-4 sm:p-6">
            <section className={formSectionClassName}>
              <h3 className="app-section-heading">Basic Info</h3>
              <TextInput label="Product Title" leftPad={false} placeholder="Oversized Drop Shoulder Tee" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Brand" leftPad={false} placeholder="Night Circuit" value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} />
                <div className="space-y-2">
                  <p className="app-label">Gender</p>
                  <div className="flex flex-wrap gap-2">
                    {(["men", "women", "unisex"] as const).map((gender) => (
                      <button key={gender} type="button" onClick={() => setForm((current) => ({ ...current, gender, category: "" }))} className={form.gender === gender ? "rounded-full border border-[#6366F1] bg-[#4F46E5]/14 px-4 py-2 text-xs font-semibold uppercase text-[#C7D2FE]" : "rounded-full border border-[#2A2A2A] px-4 py-2 text-xs font-semibold uppercase text-[#888888]"}>
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <TextArea label="Full Description" rows={4} className="min-h-[132px]" placeholder="Describe the fit, fabric, and design story." value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <TextArea label="Short Description" rows={2} className="min-h-[92px]" placeholder="Premium oversized tee with heavyweight street-ready structure." value={form.shortDescription} onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))} />
            </section>

            <section className={formSectionClassName}>
              <h3 className="app-section-heading">Pricing</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Original Price" leftPad={false} type="number" min="1" prefix="₹" placeholder="3999" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} />
                <TextInput label="Sale Price" leftPad={false} type="number" min="0" prefix="₹" placeholder="2999" value={form.discountPrice} onChange={(event) => setForm((current) => ({ ...current, discountPrice: event.target.value }))} />
              </div>
              <p className="text-sm text-[#888888]">
                Discount <span className="rounded-full bg-[#4F46E5]/14 px-3 py-1 text-xs font-semibold text-[#C7D2FE]">{discountPercent}%</span>
              </p>
            </section>

            <section className={formSectionClassName}>
              <h3 className="app-section-heading">Category & Tags</h3>
              <div className="space-y-2">
                <p className="app-label">Category</p>
              <select value={form.category} onChange={(event) => {
                const nextCategoryId = event.target.value;
                const nextCategory = filteredCategories.find((item) => item._id === nextCategoryId);
                const nextSizes = getSizesForCategory(nextCategory?.slug || "");
                const group = CATEGORY_SIZE_MAP[nextCategory?.slug || ""] || "clothing";
                setSizeGroupLabel(SIZE_GROUPS[group].label);
                setForm((current) => ({ ...current, category: nextCategoryId, sizes: nextSizes }));
              }} className="app-input h-11 cursor-pointer">
                <option value="">Select category</option>
                {filteredCategories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
              </div>
              <TextInput label="Tags" leftPad={false} placeholder="streetwear, oversized, cotton" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} />
            </section>

            <section className={formSectionClassName}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="app-section-heading">Variants</h3>
                  <p className="mt-2 text-sm text-[#888888]">Edit variants by color, then set prices and stock per size.</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, colors: [...current.colors, { name: "", hex: "#000000" }] }))}>
                  Add New Variant
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="app-label">Available Sizes</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm((current) => ({ ...current, sizes: getSizesForCategory(filteredCategories.find((item) => item._id === current.category)?.slug || resolvedProduct?.category?.slug || "") }))} className="rounded-full border border-[#2A2A2A] px-3 py-1 text-[11px] font-semibold text-[#888888]">Select All</button>
                    <button type="button" onClick={() => setForm((current) => ({ ...current, sizes: [] }))} className="rounded-full border border-[#2A2A2A] px-3 py-1 text-[11px] font-semibold text-[#888888]">Clear All</button>
                    <button type="button" onClick={() => setForm((current) => {
                      const options = getSizesForCategory(filteredCategories.find((item) => item._id === current.category)?.slug || resolvedProduct?.category?.slug || "");
                      const nextSize = options.find((size) => !current.sizes.includes(size));
                      return nextSize ? { ...current, sizes: [...current.sizes, nextSize] } : current;
                    })} className="rounded-full border border-[#2A2A2A] px-3 py-1 text-[11px] font-semibold text-[#888888]">Add Size</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getSizesForCategory(filteredCategories.find((item) => item._id === form.category)?.slug || resolvedProduct?.category?.slug || "").map((size) => (
                    <button key={size} type="button" onClick={() => setForm((current) => ({ ...current, sizes: current.sizes.includes(size) ? current.sizes.filter((item) => item !== size) : [...current.sizes, size] }))} className={form.sizes.includes(size) ? "h-9 rounded-md border border-[#6366F1] bg-[#4F46E5]/14 px-3 text-xs font-semibold text-[#C7D2FE]" : "h-9 rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 text-xs font-semibold text-[#888888]"} style={{ minWidth: size.length > 3 ? 72 : 52 }}>
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#666666]">{sizeGroupLabel}</p>
              </div>

              <div className="space-y-4">
                {form.colors.map((color, colorIndex) => {
                  const colorName = color.name.trim();
                  const images = colorImages[color.name] || [];
                  const canAdd = images.length < 4;
                  const isUploading = uploadingColor === color.name;

                  return (
                    <div key={`${color.name}-${colorIndex}`} className="rounded-2xl border border-[#1F1F1F] bg-[#0A0A0A] p-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#888888]">Variant {colorIndex + 1}</p>
                          <p className="mt-1 text-lg font-semibold text-white">{colorName || `Color ${colorIndex + 1}`}</p>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, colors: current.colors.filter((_, itemIndex) => itemIndex !== colorIndex) }))}>
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1fr,180px]">
                        <TextInput label="Color" leftPad={false} placeholder="e.g. Midnight Black" value={color.name} onChange={(event) => setForm((current) => ({ ...current, colors: current.colors.map((item, itemIndex) => itemIndex === colorIndex ? { ...item, name: event.target.value } : item) }))} />
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold tracking-[0.02em] text-[#A5A5A5]">Swatch</span>
                          <div className="flex items-center gap-3 rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-2">
                            <input type="color" value={color.hex} onChange={(event) => setForm((current) => ({ ...current, colors: current.colors.map((item, itemIndex) => itemIndex === colorIndex ? { ...item, hex: event.target.value } : item) }))} className="h-9 w-12 border-0 bg-transparent" />
                            <span className="text-sm text-white">{color.hex}</span>
                          </div>
                        </label>
                      </div>

                      <div className="mt-4 space-y-3 rounded-xl border border-[#1F1F1F] bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="app-label">Images</p>
                            <p className="text-xs text-[#666666]">Up to 4 images.</p>
                          </div>
                          <span className="text-[11px] text-[#555555]">{images.length}/4</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {images.map((url, imageIndex) => (
                            <div key={`${url}-${imageIndex}`} className="relative h-[90px] w-[72px] shrink-0">
                              <img src={url} alt="" className="block h-full w-full rounded-[8px] border border-[#2A2A2A] object-cover" />
                              <button type="button" onClick={() => removeColorImage(color.name, imageIndex)} className="absolute -right-[6px] -top-[6px] flex h-5 w-5 items-center justify-center rounded-full bg-[#EF4444] p-0 text-sm text-white">×</button>
                            </div>
                          ))}
                          {canAdd ? (
                            <label htmlFor={`img-upload-${color.name || colorIndex}`} className="flex h-[90px] w-[72px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-[8px] border-2 border-dashed border-[#2A2A2A] text-[11px] text-[#666666] transition hover:border-[#6366F1] hover:text-[#A5B4FC]">
                              <span className="text-xl leading-none">+</span>
                              <span>{isUploading ? "Uploading" : "Upload"}</span>
                              <input id={`img-upload-${color.name || colorIndex}`} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple disabled={isUploading} className="hidden" onChange={(event) => void handleColorImageUpload(color.name, event.target.files)} />
                            </label>
                          ) : null}
                        </div>
                        <div className="flex gap-2 border-t border-[#1A1A1A] pt-3">
                          <TextInput label="Image URL" leftPad={false} type="url" placeholder="https://..." value={manualImageUrls[color.name] || ""} disabled={!canAdd} onChange={(event) => setManualImageUrls((previous) => ({ ...previous, [color.name]: event.target.value }))} className="h-9 text-xs" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addColorImageUrl(color.name); } }} />
                          <Button type="button" variant="secondary" disabled={!canAdd} className="h-9 px-3 text-xs" onClick={() => addColorImageUrl(color.name)}>Add URL</Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="app-label">Sizes</p>
                            <p className="text-xs text-[#666666]">Per-size pricing and stock.</p>
                          </div>
                          <button type="button" onClick={() => setForm((current) => {
                            const options = getSizesForCategory(filteredCategories.find((item) => item._id === current.category)?.slug || resolvedProduct?.category?.slug || "");
                            const nextSize = options.find((size) => !current.sizes.includes(size));
                            return nextSize ? { ...current, sizes: [...current.sizes, nextSize] } : current;
                          })} className="rounded-full border border-[#2A2A2A] px-3 py-1 text-[11px] font-semibold text-[#888888]">Add Size</button>
                        </div>

                        <div className="space-y-3">
                          {form.sizes.map((size) => {
                            const variantIndex = form.variants.findIndex((item) => item.size === size && item.color.name === color.name);
                            const variant = form.variants[variantIndex];
                            if (!variant) return null;

                            return (
                              <div key={`${color.name}-${size}`} className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                                <div className="grid gap-3 md:grid-cols-[110px,1fr,1fr,120px]">
                                  <div>
                                    <p className="mb-1.5 block text-xs font-semibold tracking-[0.02em] text-[#A5A5A5]">Size</p>
                                    <div className="flex h-[44px] items-center rounded-lg border border-[#1F1F1F] bg-black/20 px-3 text-sm font-semibold text-white">{size}</div>
                                  </div>
                                  <TextInput label="Original Price" leftPad={false} type="number" min="0" prefix="₹" placeholder="1500" value={variant.compareAtPrice != null ? String(variant.compareAtPrice) : ""} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === variantIndex ? { ...item, compareAtPrice: event.target.value ? Number(event.target.value) : null } : item) }))} />
                                  <TextInput label="Sale Price" leftPad={false} type="number" min="0" prefix="₹" placeholder="1200" value={String(variant.price ?? "")} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === variantIndex ? { ...item, price: Number(event.target.value || 0) } : item) }))} />
                                  <TextInput label="Stock" leftPad={false} type="number" min="0" placeholder="100" value={String(variant.stock ?? 0)} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === variantIndex ? { ...item, stock: Number(event.target.value || 0) } : item) }))} />
                                </div>

                                <details className="mt-3 rounded-lg border border-[#1F1F1F] bg-black/20 px-3 py-2">
                                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-[#888888]">Advanced</summary>
                                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <TextInput label="SKU" leftPad={false} placeholder="draft-product-black-xl" value={variant.sku || ""} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === variantIndex ? { ...item, sku: event.target.value } : item) }))} />
                                    <TextInput label="Image URL" leftPad={false} type="url" placeholder="https://..." value={variant.image || ""} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === variantIndex ? { ...item, image: event.target.value } : item) }))} />
                                    <TextInput label="Barcode" leftPad={false} placeholder="8901234567890" value={variant.barcode || ""} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === variantIndex ? { ...item, barcode: event.target.value } : item) }))} />
                                    <TextInput label="Weight" leftPad={false} type="number" min="0" step="0.01" placeholder="0.45" value={variant.weight != null ? String(variant.weight) : ""} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === variantIndex ? { ...item, weight: event.target.value ? Number(event.target.value) : null } : item) }))} />
                                    <label className="rounded-lg border border-[#1F1F1F] px-3 py-3 text-sm text-white md:col-span-2">
                                      <span className="mb-2 block text-xs font-semibold tracking-[0.02em] text-[#A5A5A5]">Active</span>
                                      <span className="flex items-center justify-between">
                                        <span>{variant.isActive !== false ? "Purchasable" : "Hidden from purchase"}</span>
                                        <input type="checkbox" checked={variant.isActive !== false} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === variantIndex ? { ...item, isActive: event.target.checked } : item) }))} className="h-4 w-4 accent-[#6366F1]" />
                                      </span>
                                    </label>
                                  </div>
                                </details>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-[#888888]">
                Total: <span className="font-semibold text-[#C7D2FE]">{getTotalStock(form.variants)}</span> units across {form.variants.length} variants
              </p>
            </section>
          </div>

          <div className="space-y-4 xl:space-y-5">
            <section className="space-y-4 rounded-[24px] border border-white/8 bg-[#101010] p-4 sm:p-5">
              <h3 className="app-section-heading">Settings</h3>
              {[
                { key: "upi", label: "UPI" },
                { key: "creditCard", label: "Credit Card" },
                { key: "cod", label: "Cash on Delivery" },
              ].map((method) => (
                <label key={method.key} className="flex items-center justify-between rounded-xl border border-[#1F1F1F] px-4 py-3 text-sm text-white">
                  <span>{method.label}</span>
                  <input type="checkbox" checked={form.acceptedPayments[method.key as keyof typeof form.acceptedPayments]} onChange={(event) => setForm((current) => ({ ...current, acceptedPayments: { ...current.acceptedPayments, [method.key]: event.target.checked } }))} className="h-4 w-4 accent-[#6366F1]" />
                </label>
              ))}
              <label className="flex items-center justify-between rounded-xl border border-[#1F1F1F] px-4 py-3 text-sm text-white">
                <span>Published</span>
                <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} className="h-4 w-4 accent-[#6366F1]" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[#1F1F1F] px-4 py-3 text-sm text-white">
                <span>Featured</span>
                <input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} className="h-4 w-4 accent-[#6366F1]" />
              </label>
            </section>

            <section className="space-y-4 rounded-[24px] border border-white/8 bg-[#101010] p-4 sm:p-5">
              <h3 className="app-section-heading">Return Policy</h3>
              <label className="flex items-center justify-between rounded-xl border border-[#1F1F1F] px-4 py-3 text-sm text-white">
                <span>Allow Returns</span>
                <input
                  type="checkbox"
                  checked={form.returnAllowed}
                  onChange={(event) => setForm((current) => ({ ...current, returnAllowed: event.target.checked }))}
                  className="h-4 w-4 accent-[#6366F1]"
                />
              </label>
              {form.returnAllowed ? (
                <TextInput
                  label="Return window (days)"
                  leftPad={false}
                  type="number"
                  min="1"
                  max="30"
                  value={form.returnWindowDays}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, returnWindowDays: event.target.value || "7" }))
                  }
                />
              ) : null}
              <label className="flex items-center justify-between rounded-xl border border-[#1F1F1F] px-4 py-3 text-sm text-white">
                <span>Allow Exchanges</span>
                <input
                  type="checkbox"
                  checked={form.exchangeAllowed}
                  onChange={(event) => setForm((current) => ({ ...current, exchangeAllowed: event.target.checked }))}
                  className="h-4 w-4 accent-[#6366F1]"
                />
              </label>
              {form.exchangeAllowed ? (
                <TextInput
                  label="Exchange window (days)"
                  leftPad={false}
                  type="number"
                  min="1"
                  max="30"
                  value={form.exchangeWindowDays}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, exchangeWindowDays: event.target.value || "7" }))
                  }
                />
              ) : null}
            </section>

            <section className="space-y-4 rounded-[24px] border border-white/8 bg-[#101010] p-4 sm:p-5">
              <h3 className="app-section-heading">Preview</h3>
              <ProductCard product={previewProduct} />
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
