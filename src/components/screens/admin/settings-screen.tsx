"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import {
  Button,
  EmptyState,
  fetchJson,
  TextInput,
  type Product,
  useApi,
} from "@/components/screens/shared";
import {
  getInitialStoreSettingsForm,
  type AuditLogRecord,
  type HomepageCampaignBannerFormState,
  type HomepageHeroSlideFormState,
  type StoreConfigRecord,
  type StoreSettingsFormState,
} from "@/components/screens/admin/shared";

function LargeTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="app-label">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[92px] w-full rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6366F1]"
      />
    </label>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SortRowActions({
  onMoveUp,
  onMoveDown,
  onRemove,
  disableUp,
  disableDown,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  disableUp: boolean;
  disableDown: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" className="h-10 px-3" disabled={disableUp} onClick={onMoveUp}>
        Up
      </Button>
      <Button type="button" variant="secondary" className="h-10 px-3" disabled={disableDown} onClick={onMoveDown}>
        Down
      </Button>
      <Button type="button" variant="danger" className="h-10 px-3" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

const emptySlide = (): HomepageHeroSlideFormState => ({
  eyebrow: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaLink: "",
  image: "",
  product: "",
  isActive: true,
  sortOrder: 0,
});

const emptyBanner = (): HomepageCampaignBannerFormState => ({
  surface: "homepage",
  eyebrow: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaLink: "",
  image: "",
  products: [],
  isActive: true,
  sortOrder: 0,
});

export function AdminSettingsScreen() {
  const { data, loading, error, refetch } = useApi<StoreConfigRecord>("/api/admin/store-config", {
    defaultShippingFee: 49,
    freeShippingThreshold: 499,
    loyaltyShippingRules: [],
    platformCommission: 10,
    codEnabled: true,
    codMaxOrderAmount: 5000,
    codFee: 0,
    lowStockThreshold: 5,
    homepageContent: undefined,
  });
  const { data: productsData } = useApi<{ products: Product[] }>(
    "/api/products?includeDrafts=true&limit=100",
    { products: [] },
  );
  const { data: auditLogs } = useApi<{ items: AuditLogRecord[] }>(
    "/api/admin/audit-logs?limit=12",
    { items: [] },
  );

  const [form, setForm] = useState<StoreSettingsFormState>(getInitialStoreSettingsForm());
  const [saving, setSaving] = useState(false);
  const products = productsData.products || [];
  const productMap = useMemo(
    () => new Map(products.map((product) => [product._id, product])),
    [products],
  );

  useEffect(() => {
    setForm(getInitialStoreSettingsForm(data));
  }, [data]);

  const updateRule = (index: number, key: "minOrders" | "shippingFee" | "label", value: string) => {
    setForm((current) => ({
      ...current,
      loyaltyShippingRules: current.loyaltyShippingRules.map((rule, currentIndex) =>
        currentIndex === index ? { ...rule, [key]: value } : rule,
      ),
    }));
  };

  const addRule = () => {
    setForm((current) => ({
      ...current,
      loyaltyShippingRules: [
        ...current.loyaltyShippingRules,
        { minOrders: "0", shippingFee: "0", label: "" },
      ],
    }));
  };

  const removeRule = (index: number) => {
    setForm((current) => ({
      ...current,
      loyaltyShippingRules: current.loyaltyShippingRules.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const updateHomepageField = (
    key: keyof StoreSettingsFormState["homepageContent"],
    value: string | string[] | HomepageHeroSlideFormState[] | HomepageCampaignBannerFormState[],
  ) => {
    setForm((current) => ({
      ...current,
      homepageContent: {
        ...current.homepageContent,
        [key]: value,
      },
    }));
  };

  const moveInArray = <T,>(items: T[], index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return items;
    const copy = [...items];
    const [item] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, item);
    return copy.map((entry, currentIndex) =>
      typeof entry === "object" && entry !== null && "sortOrder" in (entry as Record<string, unknown>)
        ? { ...(entry as object), sortOrder: currentIndex }
        : entry,
    ) as T[];
  };

  const toggleHomepagePick = (productId: string) => {
    const current = form.homepageContent.homepageProductPicks;
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId].slice(0, 10);
    updateHomepageField("homepageProductPicks", next);
  };

  const moveHomepagePick = (index: number, direction: -1 | 1) => {
    updateHomepageField("homepageProductPicks", moveInArray(form.homepageContent.homepageProductPicks, index, direction));
  };

  const addSlide = () => {
    updateHomepageField("heroSlides", [
      ...form.homepageContent.heroSlides,
      { ...emptySlide(), sortOrder: form.homepageContent.heroSlides.length },
    ]);
  };

  const updateSlide = (index: number, key: keyof HomepageHeroSlideFormState, value: string | boolean) => {
    updateHomepageField(
      "heroSlides",
      form.homepageContent.heroSlides.map((slide, currentIndex) =>
        currentIndex === index ? { ...slide, [key]: value } : slide,
      ),
    );
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    updateHomepageField("heroSlides", moveInArray(form.homepageContent.heroSlides, index, direction));
  };

  const removeSlide = (index: number) => {
    updateHomepageField(
      "heroSlides",
      form.homepageContent.heroSlides
        .filter((_, currentIndex) => currentIndex !== index)
        .map((slide, currentIndex) => ({ ...slide, sortOrder: currentIndex })),
    );
  };

  const addBanner = () => {
    updateHomepageField("campaignBanners", [
      ...form.homepageContent.campaignBanners,
      { ...emptyBanner(), sortOrder: form.homepageContent.campaignBanners.length },
    ]);
  };

  const updateBanner = (
    index: number,
    key: keyof HomepageCampaignBannerFormState,
    value: string | boolean | string[],
  ) => {
    updateHomepageField(
      "campaignBanners",
      form.homepageContent.campaignBanners.map((banner, currentIndex) =>
        currentIndex === index ? { ...banner, [key]: value } : banner,
      ),
    );
  };

  const moveBanner = (index: number, direction: -1 | 1) => {
    updateHomepageField("campaignBanners", moveInArray(form.homepageContent.campaignBanners, index, direction));
  };

  const removeBanner = (index: number) => {
    updateHomepageField(
      "campaignBanners",
      form.homepageContent.campaignBanners
        .filter((_, currentIndex) => currentIndex !== index)
        .map((banner, currentIndex) => ({ ...banner, sortOrder: currentIndex })),
    );
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await fetchJson("/api/admin/store-config", {
        method: "PUT",
        body: JSON.stringify({
          defaultShippingFee: Number(form.defaultShippingFee || 0),
          freeShippingThreshold: Number(form.freeShippingThreshold || 0),
          platformCommission: Number(form.platformCommission || 0),
          codEnabled: form.codEnabled,
          codMaxOrderAmount: Number(form.codMaxOrderAmount || 0),
          codFee: Number(form.codFee || 0),
          lowStockThreshold: Number(form.lowStockThreshold || 0),
          loyaltyShippingRules: form.loyaltyShippingRules.map((rule) => ({
            minOrders: Number(rule.minOrders || 0),
            shippingFee: Number(rule.shippingFee || 0),
            label: rule.label,
          })),
          homepageContent: {
            ...form.homepageContent,
            heroSlides: form.homepageContent.heroSlides.map((slide, index) => ({
              ...slide,
              sortOrder: index,
              product: slide.product || "",
            })),
            campaignBanners: form.homepageContent.campaignBanners.map((banner, index) => ({
              ...banner,
              sortOrder: index,
            })),
          },
        }),
      });
      toast.success("Settings updated");
      await refetch();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Failed to update store settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Settings">
        <div className="h-[420px] animate-pulse rounded-3xl border border-[#1F1F1F] bg-[#111111]" />
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="Settings">
        <EmptyState title="Settings unavailable" description={error} />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Settings"
      action={
        <Button type="button" loading={saving} loadingText="Saving settings..." onClick={() => void saveSettings()}>
          Save Changes
        </Button>
      }
    >
      <div className="space-y-6">
        <SectionCard title="Operations">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextInput
              label="Default Shipping Fee"
              leftPad={false}
              type="number"
              placeholder="49"
              value={form.defaultShippingFee}
              onChange={(e) => setForm((current) => ({ ...current, defaultShippingFee: e.target.value }))}
            />
            <TextInput
              label="Free Shipping Threshold"
              leftPad={false}
              type="number"
              placeholder="499"
              value={form.freeShippingThreshold}
              onChange={(e) => setForm((current) => ({ ...current, freeShippingThreshold: e.target.value }))}
            />
            <TextInput
              label="Platform Commission"
              leftPad={false}
              type="number"
              placeholder="10"
              value={form.platformCommission}
              onChange={(e) => setForm((current) => ({ ...current, platformCommission: e.target.value }))}
            />
            <TextInput
              label="COD Max Order Amount"
              leftPad={false}
              type="number"
              placeholder="5000"
              value={form.codMaxOrderAmount}
              onChange={(e) => setForm((current) => ({ ...current, codMaxOrderAmount: e.target.value }))}
            />
            <TextInput
              label="COD Fee"
              leftPad={false}
              type="number"
              placeholder="0"
              value={form.codFee}
              onChange={(e) => setForm((current) => ({ ...current, codFee: e.target.value }))}
            />
            <TextInput
              label="Low Stock Threshold"
              leftPad={false}
              type="number"
              placeholder="5"
              value={form.lowStockThreshold}
              onChange={(e) => setForm((current) => ({ ...current, lowStockThreshold: e.target.value }))}
            />
            <label className="rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] px-4 py-3 text-sm text-white">
              <span className="mb-3 block app-label">Cash on Delivery</span>
              <span className="flex items-center justify-between gap-3">
                <span>{form.codEnabled ? "Enabled" : "Disabled"}</span>
                <input
                  type="checkbox"
                  checked={form.codEnabled}
                  onChange={(e) => setForm((current) => ({ ...current, codEnabled: e.target.checked }))}
                  className="h-4 w-4 accent-[#6366F1]"
                />
              </span>
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Loyalty Shipping Rules"
          action={
            <Button type="button" variant="secondary" onClick={addRule}>
              Add Rule
            </Button>
          }
        >
          <div className="space-y-4">
            {form.loyaltyShippingRules.map((rule, index) => (
              <div
                key={`${index}-${rule.label}`}
                className="grid gap-3 rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] p-4 md:grid-cols-[140px,160px,1fr,100px]"
              >
                <TextInput
                  label="Min Orders"
                  leftPad={false}
                  type="number"
                  placeholder="5"
                  value={rule.minOrders}
                  onChange={(e) => updateRule(index, "minOrders", e.target.value)}
                />
                <TextInput
                  label="Shipping Fee"
                  leftPad={false}
                  type="number"
                  placeholder="0"
                  value={rule.shippingFee}
                  onChange={(e) => updateRule(index, "shippingFee", e.target.value)}
                />
                <TextInput
                  label="Label"
                  leftPad={false}
                  placeholder="5+ orders: Free shipping"
                  value={rule.label}
                  onChange={(e) => updateRule(index, "label", e.target.value)}
                />
                <Button type="button" variant="danger" className="w-full md:self-end" onClick={() => removeRule(index)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Homepage Hero Slides"
          action={
            <Button type="button" variant="secondary" onClick={addSlide}>
              Add Slide
            </Button>
          }
        >
          <div className="space-y-4">
            {form.homepageContent.heroSlides.length ? form.homepageContent.heroSlides.map((slide, index) => (
              <div key={`slide-${index}`} className="space-y-4 rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Slide {index + 1}</p>
                  <SortRowActions
                    onMoveUp={() => moveSlide(index, -1)}
                    onMoveDown={() => moveSlide(index, 1)}
                    onRemove={() => removeSlide(index)}
                    disableUp={index === 0}
                    disableDown={index === form.homepageContent.heroSlides.length - 1}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Eyebrow" leftPad={false} placeholder="Campaign" value={slide.eyebrow} onChange={(e) => updateSlide(index, "eyebrow", e.target.value)} />
                  <TextInput label="Headline" leftPad={false} placeholder="Midnight Transit" value={slide.title} onChange={(e) => updateSlide(index, "title", e.target.value)} />
                  <TextInput label="CTA Label" leftPad={false} placeholder="Shop Drop" value={slide.ctaLabel} onChange={(e) => updateSlide(index, "ctaLabel", e.target.value)} />
                  <TextInput label="CTA Target" leftPad={false} placeholder="/products" value={slide.ctaLink} onChange={(e) => updateSlide(index, "ctaLink", e.target.value)} />
                  <TextInput label="Image URL" leftPad={false} placeholder="https://cdn.example.com/slide.jpg" value={slide.image} onChange={(e) => updateSlide(index, "image", e.target.value)} />
                  <label className="space-y-2">
                    <span className="app-label">Linked Product</span>
                    <select
                      value={slide.product}
                      onChange={(e) => updateSlide(index, "product", e.target.value)}
                      className="app-input h-11 w-full"
                    >
                      <option value="">None</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="md:col-span-2">
                    <LargeTextField
                      label="Subheading"
                      value={slide.subtitle}
                      onChange={(value) => updateSlide(index, "subtitle", value)}
                      placeholder="Premium campaign copy"
                    />
                  </div>
                  <label className="rounded-2xl border border-[#1F1F1F] bg-black/20 px-4 py-3 text-sm text-white md:col-span-2">
                    <span className="mb-3 block app-label">Active</span>
                    <span className="flex items-center justify-between">
                      <span>{slide.isActive ? "Visible" : "Hidden"}</span>
                      <input
                        type="checkbox"
                        checked={slide.isActive}
                        onChange={(e) => updateSlide(index, "isActive", e.target.checked)}
                        className="h-4 w-4 accent-[#6366F1]"
                      />
                    </span>
                  </label>
                </div>
              </div>
            )) : <EmptyState compact title="No hero slides yet" />}
          </div>
        </SectionCard>

        <SectionCard
          title="Campaign Banners"
          action={
            <Button type="button" variant="secondary" onClick={addBanner}>
              Add Banner
            </Button>
          }
        >
          <div className="space-y-4">
            {form.homepageContent.campaignBanners.length ? form.homepageContent.campaignBanners.map((banner, index) => (
              <div key={`banner-${index}`} className="space-y-4 rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Banner {index + 1}</p>
                  <SortRowActions
                    onMoveUp={() => moveBanner(index, -1)}
                    onMoveDown={() => moveBanner(index, 1)}
                    onRemove={() => removeBanner(index)}
                    disableUp={index === 0}
                    disableDown={index === form.homepageContent.campaignBanners.length - 1}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="app-label">Surface</span>
                    <select
                      value={banner.surface}
                      onChange={(e) => updateBanner(index, "surface", e.target.value)}
                      className="app-input h-11 w-full"
                    >
                      <option value="homepage">Homepage</option>
                      <option value="featured">Featured Rail</option>
                      <option value="category">Category Spotlight</option>
                      <option value="sale">Sale Banner</option>
                    </select>
                  </label>
                  <TextInput label="Eyebrow" leftPad={false} placeholder="Seasonal Drop" value={banner.eyebrow} onChange={(e) => updateBanner(index, "eyebrow", e.target.value)} />
                  <TextInput label="Title" leftPad={false} placeholder="City Uniform" value={banner.title} onChange={(e) => updateBanner(index, "title", e.target.value)} />
                  <TextInput label="CTA Label" leftPad={false} placeholder="Shop Edit" value={banner.ctaLabel} onChange={(e) => updateBanner(index, "ctaLabel", e.target.value)} />
                  <TextInput label="CTA Target" leftPad={false} placeholder="/products?campaign=city-uniform" value={banner.ctaLink} onChange={(e) => updateBanner(index, "ctaLink", e.target.value)} />
                  <TextInput label="Image URL" leftPad={false} placeholder="https://cdn.example.com/banner.jpg" value={banner.image} onChange={(e) => updateBanner(index, "image", e.target.value)} />
                  <div className="md:col-span-2">
                    <LargeTextField
                      label="Subheading"
                      value={banner.subtitle}
                      onChange={(value) => updateBanner(index, "subtitle", value)}
                      placeholder="Campaign copy"
                    />
                  </div>
                  <label className="space-y-2 md:col-span-2">
                    <span className="app-label">Linked Products</span>
                    <select
                      multiple
                      value={banner.products}
                      onChange={(e) =>
                        updateBanner(
                          index,
                          "products",
                          Array.from(e.target.selectedOptions).map((option) => option.value),
                        )
                      }
                      className="min-h-[132px] w-full rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6366F1]"
                    >
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="rounded-2xl border border-[#1F1F1F] bg-black/20 px-4 py-3 text-sm text-white md:col-span-2">
                    <span className="mb-3 block app-label">Active</span>
                    <span className="flex items-center justify-between">
                      <span>{banner.isActive ? "Visible" : "Hidden"}</span>
                      <input
                        type="checkbox"
                        checked={banner.isActive}
                        onChange={(e) => updateBanner(index, "isActive", e.target.checked)}
                        className="h-4 w-4 accent-[#6366F1]"
                      />
                    </span>
                  </label>
                </div>
              </div>
            )) : <EmptyState compact title="No campaign banners yet" />}
          </div>
        </SectionCard>

        <SectionCard title="Homepage Merchandising">
          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Featured Rail Eyebrow" leftPad={false} placeholder="Best Picks" value={form.homepageContent.featuredCollectionEyebrow} onChange={(e) => updateHomepageField("featuredCollectionEyebrow", e.target.value)} />
                <TextInput label="Featured Rail Title" leftPad={false} placeholder="Featured Products" value={form.homepageContent.featuredCollectionTitle} onChange={(e) => updateHomepageField("featuredCollectionTitle", e.target.value)} />
              </div>
              <LargeTextField
                label="Featured Rail Subtitle"
                value={form.homepageContent.featuredCollectionSubtitle}
                onChange={(value) => updateHomepageField("featuredCollectionSubtitle", value)}
                placeholder="Admin-curated streetwear picks"
              />
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Manual product order</p>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#888888]">
                    {form.homepageContent.homepageProductPicks.length}/10
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {form.homepageContent.homepageProductPicks.map((productId, index) => {
                    const product = productMap.get(productId);
                    return (
                      <div key={`${productId}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{product?.title || "Unavailable product"}</p>
                          <p className="mt-1 text-xs text-[#888888]">{product?.brand || "Missing"}</p>
                        </div>
                        <SortRowActions
                          onMoveUp={() => moveHomepagePick(index, -1)}
                          onMoveDown={() => moveHomepagePick(index, 1)}
                          onRemove={() => toggleHomepagePick(productId)}
                          disableUp={index === 0}
                          disableDown={index === form.homepageContent.homepageProductPicks.length - 1}
                        />
                      </div>
                    );
                  })}
                  {!form.homepageContent.homepageProductPicks.length ? <EmptyState compact title="No featured picks yet" /> : null}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] p-4">
              <p className="text-sm font-semibold text-white">Select products</p>
              <div className="mt-4 grid gap-3 max-h-[560px] overflow-y-auto pr-1">
                {products.slice(0, 40).map((product) => {
                  const active = form.homepageContent.homepageProductPicks.includes(product._id);
                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => toggleHomepagePick(product._id)}
                      className={
                        active
                          ? "rounded-2xl border border-[#6366F1] bg-[#4F46E5]/10 p-3 text-left"
                          : "rounded-2xl border border-[#1F1F1F] bg-black/20 p-3 text-left"
                      }
                    >
                      <p className={active ? "text-sm font-semibold text-[#C7D2FE]" : "text-sm font-semibold text-white"}>
                        {product.title}
                      </p>
                      <p className="mt-1 text-xs text-[#888888]">
                        {product.brand}
                        {product.displayPriority ? ` · Priority ${product.displayPriority}` : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Admin Audit Log" action={<Link href="/admin/coupons" className="text-sm font-semibold text-[#A5B4FC]">Coupons</Link>}>
          <div className="overflow-hidden rounded-2xl border border-[#1F1F1F]">
            {auditLogs.items.length ? (
              <div className="divide-y divide-[#1F1F1F]">
                {auditLogs.items.map((log) => (
                  <div
                    key={log._id}
                    className="grid gap-2 bg-black/20 px-4 py-4 md:grid-cols-[180px,1fr,220px] md:items-center"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A5B4FC]">
                        {log.action.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-[#666666]">
                        {log.entityType} · {log.entityId.slice(-8)}
                      </p>
                    </div>
                    <p className="text-sm text-white">{log.summary}</p>
                    <div className="text-sm text-[#888888] md:text-right">
                      <p>{log.actor?.name || log.actor?.email || "Admin"}</p>
                      <p className="mt-1 text-xs text-[#666666]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Now"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-sm text-[#666666]">No audit activity yet.</div>
            )}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
