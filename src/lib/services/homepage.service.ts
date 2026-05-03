import { Product } from "@/lib/models/Product";
import { getStoreConfig, StoreConfig } from "@/lib/models/StoreConfig";
import { applyFlashSaleToProducts, getCachedActiveFlashSale } from "@/lib/services/flash-sale.service";

export const HOMEPAGE_DEFAULTS = {
  heroTitle: "WEAR YOUR\nIDENTITY",
  heroSubtitle:
    "Premium streetwear delivered to your door with bold silhouettes, live inventory, and weekly drops that feel editorial from the first click.",
  heroPrimaryCtaLabel: "Shop Now",
  heroPrimaryCtaLink: "/products",
  heroSecondaryCtaLabel: "Explore Looks",
  heroSecondaryCtaLink: "/search",
  heroImage: "",
  saleBannerText: "FREE SHIPPING ABOVE ₹499 ✦ NEW ARRIVALS WEEKLY ✦ STREETWEAR CULTURE ✦ EXCLUSIVE DROPS ✦",
  promoEyebrow: "Season Sale",
  promoTitle: "Up To 50% Off",
  promoSubtitle:
    "Selected streetwear staples are marked down right now. Hoodies, cargos, sneakers, and everyday layers are all in the current sale edit.",
  promoCardEyebrow: "Limited Edit",
  promoCardTitle: "Shop Sale",
  promoCardSubtitle: "Best markdowns across statement pieces and daily essentials.",
  promoCardLink: "/products?sort=price-desc",
  featuredCollectionEyebrow: "Best Picks",
  featuredCollectionTitle: "Featured Products",
  featuredCollectionSubtitle: "Admin-curated streetwear picks for the current campaign.",
  homepageProductPicks: [] as string[],
  heroSlides: [] as Array<{
    _id?: string;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaLink?: string;
    image?: string;
    product?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  }>,
  campaignBanners: [] as Array<{
    _id?: string;
    surface?: "homepage" | "featured" | "category" | "sale";
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaLink?: string;
    image?: string;
    products?: string[];
    isActive?: boolean;
    sortOrder?: number;
  }>,
};

type HomepageHeroSlide = (typeof HOMEPAGE_DEFAULTS)["heroSlides"][number];
type HomepageCampaignBanner = (typeof HOMEPAGE_DEFAULTS)["campaignBanners"][number];

export async function getHomepageContent() {
  const config = await getStoreConfig();
  const activeFlashSale = await getCachedActiveFlashSale();
  const raw = config.homepageContent || {};
  const homepageContent = {
    ...HOMEPAGE_DEFAULTS,
    ...raw,
    homepageProductPicks: raw.homepageProductPicks || [],
    heroSlides: raw.heroSlides || [],
    campaignBanners: raw.campaignBanners || [],
  };

  const productIds = new Set<string>();
  homepageContent.homepageProductPicks.forEach((id: string) => productIds.add(String(id)));
  homepageContent.heroSlides.forEach((slide: HomepageHeroSlide) => {
    if (slide?.product) productIds.add(String(slide.product));
  });
  homepageContent.campaignBanners.forEach((banner: HomepageCampaignBanner) => {
    (banner?.products || []).forEach((id: string) => productIds.add(String(id)));
  });

  const lookupProducts = productIds.size
    ? await Product.find({
        _id: { $in: Array.from(productIds) },
        isPublished: true,
      })
        .populate("category", "name slug")
        .populate({ path: "seller", select: "shopName user", populate: { path: "user", select: "name" } })
        .lean()
    : [];

  const decoratedLookupProducts = applyFlashSaleToProducts(lookupProducts, activeFlashSale);

  const orderedProductPicks = homepageContent.homepageProductPicks
    .map((id: string) => decoratedLookupProducts.find((product) => String(product._id) === String(id)))
    .filter(Boolean);

  const heroSlides = homepageContent.heroSlides
    .filter((slide: HomepageHeroSlide) => slide?.isActive !== false)
    .sort((a: HomepageHeroSlide, b: HomepageHeroSlide) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((slide: HomepageHeroSlide) => ({
      ...slide,
      product:
        slide.product && lookupProducts.length
          ? decoratedLookupProducts.find((item) => String(item._id) === String(slide.product)) || null
          : null,
    }));

  const campaignBanners = homepageContent.campaignBanners
    .filter((banner: HomepageCampaignBanner) => banner?.isActive !== false)
    .sort((a: HomepageCampaignBanner, b: HomepageCampaignBanner) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((banner: HomepageCampaignBanner) => ({
      ...banner,
      products: (banner.products || [])
        .map((id: string) => decoratedLookupProducts.find((item) => String(item._id) === String(id)))
        .filter(Boolean),
    }));

  return {
    homepageContent,
    productPicks: orderedProductPicks,
    heroSlides,
    campaignBanners,
    activeFlashSale,
  };
}

export async function updateHomepageContent(
  actorId: string,
  homepageContent: Partial<typeof HOMEPAGE_DEFAULTS>,
) {
  return StoreConfig.findOneAndUpdate(
    { key: "main" },
    {
      $set: {
        key: "main",
        homepageContent,
        updatedAt: new Date(),
        updatedBy: actorId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
