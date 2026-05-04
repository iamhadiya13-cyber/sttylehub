/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Link2,
  Ruler,
  Search,
  Share2,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react";
import { staggerContainer } from "@/lib/animations";
import {
  Button,
  EmptyState,
  fallbackImage,
  Field,
  GenderBadge,
  LoadingGrid,
  PageShell,
  ProductCard,
  SectionHeading,
  TextArea,
  TextInput,
  genderTabs,
  isPollinationsImage,
  sizeOptions,
  sortOptions,
  type Category,
  type Product,
  type Review,
  type SearchFilters,
  useApi,
  useDebouncedValue,
} from "@/components/screens/shared";
import ProductGallery from "@/components/ui/ProductGallery";
import Pagination from "@/components/ui/Pagination";
import ProductAvailableOffers from "@/components/ui/ProductAvailableOffers";
import SizeGuideModal from "@/components/ui/SizeGuideModal";
import VerificationRequiredModal from "@/components/ui/VerificationRequiredModal";
import { browseGridClassName } from "@/components/storefront/browse-grid";
import {
  DescriptionSection as SharedDescriptionSection,
  ProductPurchasePanel,
  ProductReviewsSection,
} from "@/components/storefront/product-detail-sections";
import { RecentlyViewedRail } from "@/components/storefront/RecentlyViewedRail";
import {
  CategoryCardSkeleton,
  ProductDetailSkeleton,
  ProductGridSkeleton,
  ReviewSkeleton,
} from "@/components/ui/Skeletons";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useVerifiedSessionState } from "@/hooks/useVerifiedSessionState";
import { productImageAlt } from "@/lib/seo/site";
import { cn, formatCurrency } from "@/lib/utils";
import { getSizeGroupForCategory } from "@/lib/sizeGroups";
import {
  getVariantCompareAtPrice,
  getVariantSalePrice,
} from "@/lib/product-variants";
import { useCartStore } from "@/stores/cart-store";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useWishlistStore } from "@/stores/wishlist-store";

type ProductsResponse = {
  products: Product[];
  total: number;
  page: number;
  limit?: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
};

type HomepageContentResponse = {
  homepageContent: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroPrimaryCtaLabel?: string;
    heroPrimaryCtaLink?: string;
    heroSecondaryCtaLabel?: string;
    heroSecondaryCtaLink?: string;
    heroImage?: string;
    saleBannerText?: string;
    promoEyebrow?: string;
    promoTitle?: string;
    promoSubtitle?: string;
    promoCardEyebrow?: string;
    promoCardTitle?: string;
    promoCardSubtitle?: string;
    promoCardLink?: string;
    featuredCollectionEyebrow?: string;
    featuredCollectionTitle?: string;
    featuredCollectionSubtitle?: string;
    heroSlides?: Array<{
      _id?: string;
      eyebrow?: string;
      title?: string;
      subtitle?: string;
      ctaLabel?: string;
      ctaLink?: string;
      image?: string;
      product?: string;
      isActive?: boolean;
      sortOrder?: number;
    }>;
    campaignBanners?: Array<{
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
    }>;
  };
  productPicks: Product[];
  heroSlides?: Array<{
    _id?: string;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaLink?: string;
    image?: string;
    product?: Product | null;
    isActive?: boolean;
    sortOrder?: number;
  }>;
  campaignBanners?: Array<{
    _id?: string;
    surface?: "homepage" | "featured" | "category" | "sale";
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaLink?: string;
    image?: string;
    products?: Product[];
    isActive?: boolean;
      sortOrder?: number;
    }>;
  activeFlashSale?: {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    discountPercent: number;
    productIds: string[];
    status: "active" | "paused" | "ended";
  } | null;
  serverNow?: string;
};

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = String(Math.floor(safe / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function FlashSaleBanner({
  sale,
  serverNow,
}: {
  sale?: HomepageContentResponse["activeFlashSale"];
  serverNow?: string;
}) {
  const [nowMs, setNowMs] = useState(() => (serverNow ? new Date(serverNow).getTime() : Date.now()));

  useEffect(() => {
    const baseMs = serverNow ? new Date(serverNow).getTime() : Date.now();
    const startedAt = Date.now();
    setNowMs(baseMs);
    const intervalId = window.setInterval(() => {
      setNowMs(baseMs + (Date.now() - startedAt));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [serverNow]);

  if (!sale || sale.status !== "active") {
    return null;
  }

  const remainingSeconds = Math.max(0, Math.floor((new Date(sale.endTime).getTime() - nowMs) / 1000));

  return (
    <section className="border-b border-red-500/12 bg-[linear-gradient(90deg,rgba(127,29,29,0.82)_0%,rgba(153,27,27,0.7)_38%,rgba(76,5,25,0.82)_100%)] px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1340px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/25 bg-red-500/15 text-red-100">
            <Flame className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-red-100/80">
              Flash Sale Live
            </p>
            <p className="text-sm font-semibold text-white">
              {sale.name} · {sale.discountPercent}% off select products
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
            Ends In
          </span>
          <span className={cn("text-lg font-black tracking-[0.18em] text-white", remainingSeconds <= 600 && "text-red-200")}>
            {formatCountdown(remainingSeconds)}
          </span>
        </div>
      </div>
    </section>
  );
}

function EditorialRailCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-[22px] border border-[#1F1F1F] bg-[#101010]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#171717]">
        {isPollinationsImage(product.images?.[0]) ? (
          <img
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <Image
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            fill
            sizes="(max-width: 640px) 76vw, (max-width: 1024px) 42vw, 22vw"
            className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="space-y-2 px-3.5 pb-4 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">
          {product.brand}
        </p>
        <p className="line-clamp-2 text-[14px] font-semibold leading-5 text-[#F1EBDE]">
          {product.title}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#C7D2FE]">
            {formatCurrency(product.discountPrice)}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#8D867A]">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

function EditorialFeatureCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group grid overflow-hidden rounded-[26px] border border-[#1F1F1F] bg-[#101010] lg:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#171717] lg:aspect-auto lg:min-h-[420px]">
        {isPollinationsImage(product.images?.[0]) ? (
          <img
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <Image
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            fill
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="flex flex-col justify-between gap-5 p-5 lg:p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#4F46E5]/14 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C7D2FE]">
              Featured Drop
            </span>
            {product.gender ? (
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4CEC1]">
                {product.gender}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#8D867A]">
            {product.brand}
          </p>
          <h3 className="max-w-[16ch] text-[1.75rem] font-black uppercase leading-[1.02] text-[#F1EBDE] sm:text-[2rem]">
            {product.title}
          </h3>
          <p className="line-clamp-3 max-w-md text-sm leading-7 text-[#AFA79A]">
            {product.shortDescription || product.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8D867A]">
              Current price
            </p>
            <p className="mt-1 text-[1.2rem] font-black text-[#C7D2FE]">
              {formatCurrency(product.discountPrice)}
            </p>
          </div>
          <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#EEE5D6]">
            View Product
            <ArrowRight className="h-4 w-4 text-[#818CF8]" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EditorialSupportCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group overflow-hidden rounded-[20px] border border-[#1F1F1F] bg-[#101010]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#171717]">
        {isPollinationsImage(product.images?.[0]) ? (
          <img
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <Image
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            fill
            sizes="(max-width: 640px) 76vw, (max-width: 1024px) 42vw, 20vw"
            className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="space-y-2 px-3.5 pb-4 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">
          {product.brand}
        </p>
        <p className="line-clamp-2 text-[15px] font-bold uppercase leading-tight text-[#F1EBDE]">
          {product.title}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#DDD5C7]">
            {formatCurrency(product.discountPrice)}
          </span>
          <ArrowRight className="h-4 w-4 text-[#8D867A] transition group-hover:text-[#818CF8]" />
        </div>
      </div>
    </Link>
  );
}

function HomepageCarouselCard({
  product,
  active,
  priority = false,
}: {
  product: Product;
  active: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={
        active
          ? "group block h-full overflow-hidden rounded-[22px] border border-[#6366F1]/24 bg-[linear-gradient(180deg,#12182D_0%,#0D101A_100%)] shadow-[0_14px_28px_rgba(15,23,42,0.22)] transition duration-300"
          : "group block h-full overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#10131E_0%,#0B0E16_100%)] opacity-84 transition duration-300 hover:border-white/16 hover:opacity-100"
      }
    >
      <div className="relative aspect-[4/4.35] overflow-hidden bg-[#141827]">
        {isPollinationsImage(product.images?.[0]) ? (
          <img
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            className={
              active
                ? "h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.018]"
                : "h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.014]"
            }
          />
        ) : (
          <Image
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            fill
            priority={priority}
            sizes="(max-width: 640px) 83vw, (max-width: 1024px) 58vw, (max-width: 1536px) 30vw, 26vw"
            className={
              active
                ? "object-cover object-center transition duration-500 group-hover:scale-[1.018]"
                : "object-cover object-center transition duration-500 group-hover:scale-[1.014]"
            }
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,19,0.04)_0%,rgba(8,11,19,0.14)_45%,rgba(8,11,19,0.54)_100%)]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 sm:left-3.5 sm:top-3.5">
          <span className="rounded-full border border-[#6366F1]/25 bg-[#4F46E5]/12 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#C7D2FE]">
            {product.isFeatured ? "Featured" : "Curated"}
          </span>
          {product.gender ? (
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#D6D3D1]">
              {product.gender}
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-2 px-3.5 pb-4 pt-3 sm:px-4 sm:pb-4.5 sm:pt-3.5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">
            {product.brand}
          </p>
          <h3 className="line-clamp-2 text-[15px] font-black uppercase leading-[1.06] text-[#F4F1EA] sm:text-[16px]">
            {product.title}
          </h3>
          <p className="line-clamp-2 text-[12px] leading-[1.45] text-[#A8A29A]">
            {product.shortDescription || product.description}
          </p>
        </div>
        <div className="flex items-end justify-between gap-2.5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
              Current price
            </p>
            <p className="mt-0.5 text-[0.95rem] font-black text-[#C7D2FE] sm:text-[1rem]">
              {formatCurrency(product.discountPrice)}
            </p>
          </div>
          <span
            className={
              active
                ? "inline-flex h-9 items-center gap-1.5 rounded-full border border-[#6366F1]/28 bg-[#4F46E5]/12 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F4F1EA]"
                : "inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D6D3D1]"
            }
          >
            View
            <ArrowRight className="h-3.5 w-3.5 text-[#A5B4FC]" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function HomeProductRail({
  eyebrow,
  title,
  description,
  products,
  href,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  products: Product[];
  href: string;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!products.length) {
      setActiveIndex(0);
      return;
    }
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    const updateActive = () => {
      const railRect = rail.getBoundingClientRect();
      const railCenter = railRect.left + railRect.width / 2;
      let nextIndex = 0;
      let smallestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((node, index) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const distance = Math.abs(center - railCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          nextIndex = index;
        }
      });

      setActiveIndex(nextIndex);
    };

    const onScroll = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActive);
    };

    updateActive();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateActive);
    };
  }, [products]);

  const scrollToIndex = (index: number) => {
    const rail = railRef.current;
    const node = itemRefs.current[index];
    if (!rail || !node) return;
    const left = node.offsetLeft - Math.max((rail.clientWidth - node.clientWidth) / 2, 0);
    rail.scrollTo({ left, behavior: "smooth" });
    setActiveIndex(index);
  };

  const scrollByDirection = (direction: 1 | -1) => {
    const total = products.length;
    if (!total) return;
    const nextIndex = Math.min(Math.max(activeIndex + direction, 0), total - 1);
    scrollToIndex(nextIndex);
  };

  return (
    <section className="mx-auto max-w-[1240px] space-y-4 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#A5B4FC]">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div />
          {products.length > 1 ? (
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => scrollByDirection(-1)}
                disabled={activeIndex === 0}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-[#6366F1]/30 hover:bg-[#4F46E5]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByDirection(1)}
                disabled={activeIndex === products.length - 1}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-[#6366F1]/30 hover:bg-[#4F46E5]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
        <div
          ref={railRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-4.5"
        >
          {products.map((product, index) => (
            <div
              key={product._id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className="w-[83%] min-w-[83%] snap-center sm:w-[58%] sm:min-w-[58%] lg:w-[30%] lg:min-w-[30%] xl:w-[28%] xl:min-w-[28%] 2xl:w-[26%] 2xl:min-w-[26%]"
            >
              <motion.div
                  animate={{
                    scale: index === activeIndex ? 1 : 0.978,
                    opacity: index === activeIndex ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                className="h-full"
              >
                <HomepageCarouselCard
                  product={product}
                  active={index === activeIndex}
                  priority={index === 0}
                />
              </motion.div>
            </div>
          ))}
        </div>
        {products.length > 1 ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {products.map((product, index) => (
                <button
                  key={product._id}
                  type="button"
                  aria-label={`Go to product ${index + 1}`}
                  onClick={() => scrollToIndex(index)}
                  className="group flex items-center gap-2"
                >
                  <span
                    className={
                      index === activeIndex
                        ? "h-[3px] w-10 rounded-full bg-[#818CF8]"
                        : "h-[3px] w-6 rounded-full bg-white/18 transition group-hover:bg-white/32"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {String(activeIndex + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EditorialHeroCarousel({
  products,
  campaign,
  heroSlides,
}: {
  products: Product[];
  campaign: HomepageContentResponse["homepageContent"];
  heroSlides?: HomepageContentResponse["heroSlides"];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const storySlides =
    heroSlides?.length
      ? heroSlides.map((slide) => {
          const linkedProduct = slide.product || null;
          return {
            _id: slide._id || linkedProduct?._id || slide.title || "hero-slide",
            slug: linkedProduct?.slug || slide.ctaLink?.replace(/^\//, "") || "products",
            title: slide.title || linkedProduct?.title || campaign.heroTitle || "StyleHub Campaign",
            brand: linkedProduct?.brand || slide.eyebrow || "StyleHub",
            images: slide.image ? [slide.image] : linkedProduct?.images || [],
            description:
              slide.subtitle ||
              linkedProduct?.description ||
              campaign.heroSubtitle ||
              "Premium streetwear edits, cinematic campaign visuals, and weekly drops built into one editorial home surface.",
            shortDescription:
              slide.subtitle ||
              linkedProduct?.shortDescription ||
              campaign.heroSubtitle ||
              "Premium streetwear edits, cinematic campaign visuals, and weekly drops built into one editorial home surface.",
            price: linkedProduct?.price || 0,
            discountPrice: linkedProduct?.discountPrice || linkedProduct?.price || 0,
            gender: linkedProduct?.gender || "unisex",
            ctaLabel: slide.ctaLabel,
            ctaLink: slide.ctaLink,
            eyebrow: slide.eyebrow,
          };
        })
      : [];
  const hasProducts = products.length > 0;
  const slides = storySlides.length
    ? storySlides
    : hasProducts
    ? products.map((product) => ({ ...product, ctaLabel: campaign.heroPrimaryCtaLabel, ctaLink: campaign.heroPrimaryCtaLink, eyebrow: product.brand }))
    : [
        {
          _id: "campaign-fallback",
          slug: "products",
          title: campaign.heroTitle || "StyleHub Campaign",
          brand: "StyleHub",
          images: campaign.heroImage ? [campaign.heroImage] : [],
          description:
            campaign.heroSubtitle ||
            "Premium streetwear edits, cinematic campaign visuals, and weekly drops built into one editorial home surface.",
          shortDescription:
            campaign.heroSubtitle ||
            "Premium streetwear edits, cinematic campaign visuals, and weekly drops built into one editorial home surface.",
          price: 0,
          discountPrice: 0,
          gender: "unisex",
          ctaLabel: campaign.heroPrimaryCtaLabel,
          ctaLink: campaign.heroPrimaryCtaLink,
          eyebrow: "StyleHub",
        } as Product,
      ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, slides.length]);

  const active = slides[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex(index);
  };

  const previous = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const activeHref = active?.slug ? `/products/${active.slug}` : (active as Product & { ctaLink?: string }).ctaLink || campaign.heroPrimaryCtaLink || "/products";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),260px] xl:gap-5 xl:grid-cols-[minmax(0,1fr),288px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#A5B4FC]">
              Editorial Stories
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/25">
              / {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,#0E1326_0%,#090B14_45%,#05060B_100%)] sm:min-h-[470px] xl:min-h-[540px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(129,140,248,0.18),transparent_26%)]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={active._id || active.slug || active.title}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Link href={activeHref} className="grid h-full lg:grid-cols-[minmax(0,1.12fr),minmax(0,0.88fr)]">
                <div className="relative h-[260px] overflow-hidden lg:h-full">
                  {active.images?.[0] ? (
                    isPollinationsImage(active.images[0]) ? (
                      <img
                        src={fallbackImage(active.images[0])}
                        alt={active.title}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <Image
                        src={fallbackImage(active.images[0])}
                        alt={active.title}
                        fill
                        priority={activeIndex === 0}
                        sizes="(max-width: 1024px) 100vw, 44vw"
                        className="object-cover object-center"
                      />
                    )
                  ) : (
                    <div className="h-full w-full bg-[linear-gradient(135deg,#312E81_0%,#111827_100%)]" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.06)_0%,rgba(7,10,18,0.42)_56%,rgba(7,10,18,0.82)_100%)] lg:bg-[linear-gradient(90deg,rgba(7,10,18,0.1)_0%,rgba(7,10,18,0.44)_48%,rgba(7,10,18,0.82)_100%)]" />
                </div>
                <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 xl:p-8">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#6366F1]/30 bg-[#4F46E5]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C7D2FE]">
                        {activeIndex === 0 ? "Lead Story" : `Story 0${activeIndex + 1}`}
                      </span>
                      {active.gender ? (
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D6D3D1]">
                          {active.gender}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#A5B4FC]">
                        {(active as Product & { eyebrow?: string }).eyebrow || active.brand || "StyleHub"}
                      </p>
                      <h2 className="max-w-[12ch] text-[2rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-[#F4F1EA] sm:text-[2.5rem] xl:text-[3rem]">
                        {active.title}
                      </h2>
                    </div>
                    <p className="max-w-md text-sm leading-7 text-[#A8A29A] sm:text-[15px]">
                      {active.shortDescription || active.description || campaign.heroSubtitle}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                        Current price
                      </p>
                      <p className="mt-1 text-[1.2rem] font-black text-[#C7D2FE]">
                        {active.discountPrice || active.price
                          ? formatCurrency(active.discountPrice || active.price)
                          : "Explore now"}
                      </p>
                    </div>
                    <span className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F4F1EA] transition duration-300 hover:border-[#6366F1]/35 hover:bg-[#4F46E5]/10">
                      {(active as Product & { ctaLabel?: string }).ctaLabel || "View Story"}
                      <ArrowRight className="h-4 w-4 text-[#A5B4FC]" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
          {slides.length > 1 ? (
            <>
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 lg:left-6 lg:right-6">
                <div className="flex items-center gap-2">
                  {slides.map((slide, index) => (
                    <button
                      key={slide._id || slide.slug || index}
                      type="button"
                      aria-label={`Go to story ${index + 1}`}
                      onClick={() => goTo(index)}
                      className="group flex items-center gap-2"
                    >
                      <span
                        className={
                          index === activeIndex
                            ? "h-[3px] w-10 rounded-full bg-[#818CF8]"
                            : "h-[3px] w-6 rounded-full bg-white/20 transition group-hover:bg-white/35"
                        }
                      />
                    </button>
                  ))}
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={previous}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/35 text-white transition hover:border-[#6366F1]/30 hover:bg-[#4F46E5]/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/35 text-white transition hover:border-[#6366F1]/30 hover:bg-[#4F46E5]/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {slides.map((product, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={product._id || product.slug || `${product.title}-${index}`}
              type="button"
              onClick={() => goTo(index)}
              className={
                selected
                  ? "group overflow-hidden rounded-[22px] border border-[#6366F1]/28 bg-[#11162A] p-3 text-left shadow-[0_18px_40px_rgba(79,70,229,0.16)] transition"
                  : "group overflow-hidden rounded-[22px] border border-white/8 bg-[#0D101A] p-3 text-left transition hover:border-white/14 hover:bg-[#121624]"
              }
            >
              <div className="flex items-center gap-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[16px] bg-black/20 sm:h-24 sm:w-20">
                  {product.images?.[0] ? (
                    isPollinationsImage(product.images[0]) ? (
                      <img
                        src={fallbackImage(product.images[0])}
                        alt={productImageAlt(product)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={fallbackImage(product.images[0])}
                        alt={productImageAlt(product)}
                        fill
                        className="object-cover"
                      />
                    )
                  ) : (
                    <div className="h-full w-full bg-[linear-gradient(135deg,#312E81_0%,#111827_100%)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">
                    {product.brand || "StyleHub"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[14px] font-bold uppercase leading-tight text-[#F4F1EA]">
                    {product.title}
                  </p>
                  <p className="mt-2 text-xs text-white/55">
                    {product.discountPrice || product.price
                      ? formatCurrency(product.discountPrice || product.price)
                      : "Editorial story"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function makeUrl(filters: SearchFilters, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (filters.q) params.set("search", filters.q);
  if (filters.gender && filters.gender !== "all") params.set("gender", filters.gender);
  if (filters.categories.length) params.set("category", filters.categories.join(","));
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.sizes.length) params.set("sizes", filters.sizes.join(","));
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return `/api/products?${params.toString()}`;
}

function parseFilters(searchParams: URLSearchParams | null, includeQuery = false): SearchFilters {
  return {
    q: includeQuery ? searchParams?.get("q") || "" : "",
    minPrice: searchParams?.get("minPrice") || "",
    maxPrice: searchParams?.get("maxPrice") || "",
    sort: searchParams?.get("sort") || "newest",
    sizes: searchParams?.get("sizes")?.split(",").filter(Boolean) || [],
    categories: searchParams?.get("category")?.split(",").filter(Boolean) || [],
    gender: (searchParams?.get("gender") as SearchFilters["gender"]) || "all",
  };
}

function buildQuery(filters: SearchFilters, includeQuery = false, page?: number) {
  const params = new URLSearchParams();
  if (includeQuery && filters.q) params.set("q", filters.q);
  if (filters.categories.length) params.set("category", filters.categories.join(","));
  if (filters.gender && filters.gender !== "all") params.set("gender", filters.gender);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.sizes.length) params.set("sizes", filters.sizes.join(","));
  if (filters.sort) params.set("sort", filters.sort);
  if (page) params.set("page", String(page));
  return params.toString();
}

function toggleValue(values: string[], nextValue: string) {
  return values.includes(nextValue) ? values.filter((value) => value !== nextValue) : [...values, nextValue];
}

function FiltersCard({
  filters,
  setFilters,
  categories,
  filteredCategories,
  apply,
  clear,
}: {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  categories: Category[];
  filteredCategories: Category[];
  apply: () => void;
  clear: () => void;
}) {
  return (
    <div className="space-y-6 rounded-xl border border-[#1F1F1F] bg-[#111111] p-5">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A5B4FC]">Price Range</p>
        <div className="grid grid-cols-2 gap-3">
          <TextInput leftPad={false} placeholder="Min ₹" value={filters.minPrice} onChange={(e) => setFilters((v) => ({ ...v, minPrice: e.target.value }))} />
          <TextInput leftPad={false} placeholder="Max ₹" value={filters.maxPrice} onChange={(e) => setFilters((v) => ({ ...v, maxPrice: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A5B4FC]">Gender</p>
        <div className="flex flex-wrap gap-2">
          {[{ label: "All", value: "all" }, ...genderTabs].map((option) => {
            const active = filters.gender === option.value;
            return (
              <button key={option.value} type="button" onClick={() => setFilters((v) => ({ ...v, gender: option.value as SearchFilters["gender"], categories: [] }))} className={active ? "rounded-full border border-[#6366F1] bg-[#6366F1] px-4 py-2 text-[13px] font-semibold text-white" : "rounded-full border border-[#1F1F1F] px-4 py-2 text-[13px] text-[#888888]"}>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A5B4FC]">Categories</p>
        <div className="space-y-2">
          {filteredCategories.map((category) => (
            <label key={category._id} className="flex items-center gap-3 text-sm text-[#D5D5D5]">
              <input
                type="checkbox"
                checked={filters.categories.includes(category.slug)}
                onChange={() => setFilters((v) => ({ ...v, categories: toggleValue(v.categories, category.slug) }))}
                className="h-4 w-4 accent-[#6366F1]"
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A5B4FC]">Sizes</p>
        <div className="grid grid-cols-3 gap-2">
          {sizeOptions.map((size) => {
            const active = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => setFilters((v) => ({ ...v, sizes: toggleValue(v.sizes, size) }))}
                className={active ? "rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-semibold text-white" : "rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-2 text-sm font-semibold text-white"}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A5B4FC]">Sort By</p>
        <select value={filters.sort} onChange={(e) => setFilters((v) => ({ ...v, sort: e.target.value }))} className="h-12 w-full rounded-lg border border-[#1F1F1F] bg-[#111111] px-4 text-sm text-white outline-none focus:border-[#6366F1]">
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3">
        <Button type="button" onClick={apply} className="w-full">
          Apply Filters
        </Button>
        <Button type="button" variant="secondary" onClick={clear} className="w-full">
          Clear All
        </Button>
      </div>
    </div>
  );
}

function MobileFilters(props: React.ComponentProps<typeof FiltersCard> & { open: boolean; onClose: () => void }) {
  const { open, onClose, ...rest } = props;
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.28 }} className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[28px] border-t border-[#1F1F1F] bg-[#0A0A0A] p-4 md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase">Filters</h3>
              <button type="button" onClick={onClose} className="rounded-xl border border-[#1F1F1F] p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FiltersCard {...rest} apply={() => { rest.apply(); onClose(); }} clear={() => { rest.clear(); onClose(); }} />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ResultsLayout({
  title,
  resultText,
  filters,
  setFilters,
  categories,
  filteredCategories,
  products,
  total,
  loading,
  error,
  apply,
  clear,
  top,
  bottom,
  emptyState,
  limit = 12,
}: {
  title: string;
  resultText: string;
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  categories: Category[];
  filteredCategories: Category[];
  products: Product[];
  total: number;
  loading: boolean;
  error: string | null;
  apply: () => void;
  clear: () => void;
  top?: ReactNode;
  bottom?: ReactNode;
  emptyState?: ReactNode;
  limit?: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const showRefreshingGrid = loading && products.length > 0;
  return (
    <PageShell>
      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {top}
        <div className="flex items-center justify-between md:hidden">
          <p className="text-sm text-[#888888]">{resultText}</p>
          <Button type="button" variant="secondary" onClick={() => setMobileOpen(true)} className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>
        <div className="flex gap-6">
          <aside className="hidden w-[280px] shrink-0 md:block">
            <div className="sticky top-20">
              <FiltersCard filters={filters} setFilters={setFilters} categories={categories} filteredCategories={filteredCategories} apply={apply} clear={clear} />
            </div>
          </aside>
          <section className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-col gap-2 border-b border-[#1F1F1F] pb-4 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h1>
              <p className="text-sm text-[#888888]">{resultText}</p>
            </div>
            {loading && !showRefreshingGrid ? (
              <ProductGridSkeleton count={limit} />
            ) : error ? (
              <EmptyState title="Could not load products" description={error} />
            ) : products.length ? (
              <div className="space-y-4">
                {showRefreshingGrid ? (
                  <div className="h-[3px] overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.1, ease: "linear" }}
                      className="h-full w-1/3 rounded-full bg-[linear-gradient(90deg,transparent_0%,#6366F1_45%,#A5B4FC_100%)]"
                    />
                  </div>
                ) : null}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className={`${browseGridClassName} ${showRefreshingGrid ? "pointer-events-none opacity-70" : ""}`}
                >
                  {products.map((product, index) => (
                    <ProductCard key={product._id} product={product} priority={index < 3} />
                  ))}
                </motion.div>
              </div>
            ) : (
              emptyState || <EmptyState title="No products found" description="Try different keywords or remove a few filters." />
            )}
            {bottom}
          </section>
        </div>
        <MobileFilters open={mobileOpen} onClose={() => setMobileOpen(false)} filters={filters} setFilters={setFilters} categories={categories} filteredCategories={filteredCategories} apply={apply} clear={clear} />
      </main>
    </PageShell>
  );
}

export function HomePageScreen() {
  const { data: session } = useSession();
  const [loadSecondarySections, setLoadSecondarySections] = useState(false);
  const { data: categories, loading: cl, error: ce } = useApi<Category[]>("/api/categories", [], {
    cacheTtlMs: 10 * 60 * 1000,
  });
  const { data: arrivals, loading: al, error: ae } = useApi<Product[]>("/api/products/new-arrivals", [], {
    enabled: loadSecondarySections,
    cacheTtlMs: 3 * 60 * 1000,
    keepPreviousData: true,
  });
  const { data: featured, loading: fl, error: fe } = useApi<Product[]>("/api/products/featured", [], {
    enabled: loadSecondarySections,
    cacheTtlMs: 3 * 60 * 1000,
    keepPreviousData: true,
  });
  const { data: homepageData } = useApi<HomepageContentResponse>("/api/homepage-content", {
    homepageContent: {},
    productPicks: [],
    heroSlides: [],
    campaignBanners: [],
  }, {
    cacheTtlMs: 5 * 60 * 1000,
  });
  const [categoryTab, setCategoryTab] = useState<"all" | "men" | "women" | "unisex">("all");
  const visibleCategories = categoryTab === "all" ? categories : categories.filter((category) => category.gender === categoryTab);
  const campaign = homepageData.homepageContent || {};
  const featuredCollectionProducts = homepageData.productPicks?.length ? homepageData.productPicks : featured;
  const heroSlides = homepageData.heroSlides || [];
  const homepageBanners = homepageData.campaignBanners || [];
  const spotlightBanner = homepageBanners.find((banner) => banner.surface === "homepage" || banner.surface === "featured");
  const heroLines = (campaign.heroTitle || "WEAR YOUR\nIDENTITY").split("\n").filter(Boolean);

  useEffect(() => {
    if (loadSecondarySections) return;

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = (window as Window & { requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number })
        .requestIdleCallback(() => setLoadSecondarySections(true), { timeout: 900 });
    } else {
      timeoutId = globalThis.setTimeout(() => setLoadSecondarySections(true), 450);
    }

    return () => {
      if (idleId !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (handle: number) => void }).cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [loadSecondarySections]);

  const heroProducts = useMemo(() => {
    const seen = new Set<string>();
    const campaignSlide =
      campaign.heroImage || campaign.heroTitle
        ? [
            {
              _id: "campaign-slide",
              slug: campaign.heroPrimaryCtaLink?.replace(/^\//, "") || "products",
              title: campaign.heroTitle || "StyleHub Campaign",
              brand: "StyleHub",
              images: campaign.heroImage ? [campaign.heroImage] : [],
              description:
                campaign.heroSubtitle ||
                "Campaign-led edit with current featured drops, premium essentials, and the latest arrivals.",
              shortDescription:
                campaign.heroSubtitle ||
                "Campaign-led edit with current featured drops, premium essentials, and the latest arrivals.",
              price: 0,
              discountPrice: 0,
              gender: "unisex",
            } as Product,
          ]
        : [];
    return [...campaignSlide, ...featuredCollectionProducts, ...featured, ...arrivals].filter((product) => {
      if (!product?._id || seen.has(product._id)) return false;
      seen.add(product._id);
      return true;
    }).slice(0, 5);
  }, [arrivals, campaign.heroImage, campaign.heroPrimaryCtaLink, campaign.heroSubtitle, campaign.heroTitle, featured, featuredCollectionProducts]);

  return (
    <PageShell>
      <main>
        {session?.user?.role === "seller" ? (
          <div className="border-b border-[rgba(34,197,94,0.1)] bg-[rgba(34,197,94,0.06)] px-4 py-3 sm:px-6 lg:px-10">
            <div className="mx-auto flex max-w-[1340px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />
                <span className="text-[13px] font-semibold text-[#22C55E]">Your store is live on StyleHub</span>
                <span className="text-[13px] text-[#555555]">— You can still browse and shop normally</span>
              </div>
              <Link href="/seller/dashboard" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#22C55E]">
                Go to Dashboard →
              </Link>
            </div>
          </div>
        ) : null}
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16 xl:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.12),transparent_34%)]" />
          <div className="relative mx-auto grid max-w-[1360px] items-center gap-10 lg:grid-cols-[0.9fr,1.1fr] xl:gap-14">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-[#6366F1]/30 bg-[#4F46E5]/14 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#C7D2FE]">New Collection 2025</span>
              <div className="space-y-1.5">
                {heroLines.map((line, index) => (
                  <motion.h1
                    key={`${line}-${index}`}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={
                      index === heroLines.length - 1
                        ? "text-[2.85rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-[#818CF8] sm:text-[4.1rem] lg:text-[4.8rem] xl:text-[5.6rem] 2xl:text-[6rem]"
                        : "text-[2.85rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-[#F4F1EA] sm:text-[4.1rem] lg:text-[4.8rem] xl:text-[5.6rem] 2xl:text-[6rem]"
                    }
                  >
                    {line}
                  </motion.h1>
                ))}
              </div>
              <p className="max-w-[34rem] text-[15px] leading-7 text-[#A8A29A] sm:text-base sm:leading-8 lg:text-[17px]">{campaign.heroSubtitle || "Premium streetwear delivered to your door with bold silhouettes, live inventory, and weekly drops that feel editorial from the first click."}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={campaign.heroPrimaryCtaLink || "/products"}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#6366F1] bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F8FAFC] transition-colors duration-200 hover:brightness-110 active:brightness-95"
                >
                  {campaign.heroPrimaryCtaLabel || "Shop Now"}
                </Link>
                <Link
                  href={campaign.heroSecondaryCtaLink || "/search"}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-5 text-[12px] font-medium uppercase tracking-[0.16em] text-[#D6D3D1] transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:text-[#F4F1EA]"
                >
                  {campaign.heroSecondaryCtaLabel || "Explore Looks"}
                </Link>
              </div>
              <div className="grid max-w-2xl gap-3 pt-1 sm:grid-cols-3">
                {[
                  { label: "Fresh Drops", value: heroProducts.length || 3, accent: "#818CF8" },
                  { label: "Featured Picks", value: featuredCollectionProducts.length || 8, accent: "#22C55E" },
                  { label: "Live Categories", value: visibleCategories.length || categories.length || 12, accent: "#F97316" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3.5 backdrop-blur">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">{stat.label}</p>
                    <p className="mt-2.5 text-[1.75rem] font-black" style={{ color: stat.accent }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <EditorialHeroCarousel products={heroProducts} campaign={campaign} heroSlides={heroSlides} />
          </div>
        </section>
        <section className="overflow-hidden border-y border-[#1F1F1F] bg-[linear-gradient(90deg,#4338CA_0%,#4F46E5_48%,#6366F1_100%)] py-3 text-sm font-black uppercase tracking-[0.24em] text-white">{campaign.saleBannerText || "FREE SHIPPING ABOVE ?499 ? NEW ARRIVALS WEEKLY ? STREETWEAR CULTURE ? EXCLUSIVE DROPS ?"}</section>
        {spotlightBanner ? (
          <section className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
            <Link
              href={spotlightBanner.ctaLink || "/products"}
              className="grid overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#11162A_0%,#0B0F19_100%)] lg:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)]"
            >
              <div className="relative min-h-[240px] bg-[#121829]">
                {spotlightBanner.image ? (
                  <Image src={fallbackImage(spotlightBanner.image)} alt={spotlightBanner.title ? `${spotlightBanner.title} campaign on StyleHub` : "StyleHub streetwear campaign"} fill priority sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover object-center" />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_32%),linear-gradient(135deg,#1E1B4B_0%,#0B1120_100%)]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.08)_0%,rgba(7,10,18,0.62)_100%)]" />
              </div>
              <div className="flex flex-col justify-between gap-5 p-6 sm:p-8">
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">{spotlightBanner.eyebrow || "Campaign"}</p>
                  <h3 className="text-[2rem] font-black uppercase leading-[0.95] text-[#F4F1EA] sm:text-[2.4rem]">{spotlightBanner.title || "Current Campaign"}</h3>
                  {spotlightBanner.subtitle ? <p className="max-w-[34rem] text-sm leading-7 text-[#A8A29A]">{spotlightBanner.subtitle}</p> : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {(spotlightBanner.products || []).slice(0, 3).map((product) => (
                      <span key={product._id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-[#D6D3D1]">
                        {product.title}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex h-11 items-center gap-2 rounded-full border border-[#6366F1]/30 bg-[#4F46E5]/10 px-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F4F1EA]">
                    {spotlightBanner.ctaLabel || "View Campaign"}
                    <ArrowRight className="h-4 w-4 text-[#A5B4FC]" />
                  </span>
                </div>
              </div>
            </Link>
          </section>
        ) : null}
        <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid gap-6 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#101523_0%,#0A0E17_100%)] p-6 sm:p-8 lg:grid-cols-[0.88fr,1.12fr] lg:p-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">About StyleHub</p>
              <h2 className="mt-4 text-[2rem] font-black uppercase leading-[0.95] text-[#F4F1EA] sm:text-[2.4rem]">
                A premium commerce platform, not only a storefront
              </h2>
            </div>
            <div className="space-y-5">
              <p className="max-w-[40rem] text-sm leading-7 text-[#A8A29A]">
                StyleHub is designed as a complete shopping system with smoother discovery, responsive product flow, and connected seller and admin operations behind the customer experience.
              </p>
              <Link
                href="/stylehub"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#6366F1]/30 bg-[#4F46E5]/10 px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F4F1EA] transition duration-200 hover:border-[#6366F1] hover:bg-[#4F46E5]/16"
              >
                Explore The Platform
                <ArrowRight className="ml-2 h-4 w-4 text-[#A5B4FC]" />
              </Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[1340px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { label: "MEN", href: "/products?gender=men", description: "Shop Men's Collection", accent: "border-l-[#3B82F6]", bg: "from-[#0F172A] to-[#111111]" },
              { label: "WOMEN", href: "/products?gender=women", description: "Shop Women's Collection", accent: "border-l-[#EC4899]", bg: "from-[#3B1026] to-[#111111]" },
              { label: "UNISEX", href: "/products?gender=unisex", description: "Gender Free Fashion", accent: "border-l-[#6366F1]", bg: "from-[#1E1B4B] to-[#111111]" },
            ].map((card) => (
              <Link key={card.label} href={card.href}>
                <motion.div whileHover={{ scale: 1.02 }} className={`relative h-[300px] overflow-hidden rounded-xl border border-[#1F1F1F] border-l-[3px] ${card.accent} bg-gradient-to-br ${card.bg}`}>
                  <div className="absolute bottom-0 left-0 p-6">
                    <p className="text-[32px] font-extrabold uppercase text-white">{card.label}</p>
                    <p className="mt-2 text-sm text-[#888888]">{card.description}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-[1340px] space-y-8 px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Browse" title="Featured Categories" />
          {cl ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <CategoryCardSkeleton key={index} />)}</div> : ce ? <EmptyState title="Categories unavailable" description={ce} /> : <>
            <div className="flex flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
              {[{ label: "All", value: "all" }, ...genderTabs].map((tab) => (
                <button key={tab.value} type="button" onClick={() => setCategoryTab(tab.value as typeof categoryTab)} className={categoryTab === tab.value ? "border-b-2 border-[#6366F1] pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#C7D2FE]" : "border-b-2 border-transparent pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#888888]"}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {visibleCategories.map((category) => (
                <Link key={category._id} href={`/products?category=${category.slug}${category.gender && category.gender !== "all" ? `&gender=${category.gender}` : ""}`}>
                  <motion.div whileHover={{ scale: 1.03 }} className="group relative aspect-square overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#111111]">
                    {isPollinationsImage(category.image) ? <img src={fallbackImage(category.image)} alt={`${category.name} streetwear category on StyleHub`} className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <Image src={fallbackImage(category.image)} alt={`${category.name} streetwear category on StyleHub`} fill sizes="(max-width: 640px) 92vw, (max-width: 1280px) 44vw, 22vw" className="object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                    <span className={category.gender === "men" ? "absolute right-3 top-3 h-3 w-3 rounded-full bg-[#3B82F6]" : category.gender === "women" ? "absolute right-3 top-3 h-3 w-3 rounded-full bg-[#EC4899]" : "absolute right-3 top-3 h-3 w-3 rounded-full bg-[#6366F1]"} />
                    <div className="absolute bottom-0 left-0 p-3"><p className="text-sm font-bold text-white">{category.name}</p></div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </>}
        </section>
        {!loadSecondarySections || al ? <section className="mx-auto max-w-[1340px] px-4 py-10 sm:px-6 lg:px-8"><ProductGridSkeleton count={8} /></section> : ae ? <section className="mx-auto max-w-[1340px] px-4 py-10 sm:px-6 lg:px-8"><EmptyState title="Couldn't load new arrivals" description={ae} /></section> : arrivals.length ? <HomeProductRail eyebrow="Fresh Drop" title="New Arrivals" products={arrivals} href="/products?sort=newest" /> : <section className="mx-auto max-w-[1340px] px-4 py-10 sm:px-6 lg:px-8"><EmptyState title="No products yet" /></section>}
        {!loadSecondarySections || fl ? <section className="mx-auto max-w-[1340px] px-4 py-10 sm:px-6 lg:px-8"><ProductGridSkeleton count={8} /></section> : fe ? <section className="mx-auto max-w-[1340px] px-4 py-10 sm:px-6 lg:px-8"><EmptyState title="Couldn't load featured products" description={fe} /></section> : featuredCollectionProducts.length ? <HomeProductRail eyebrow={campaign.featuredCollectionEyebrow || "Best Picks"} title={campaign.featuredCollectionTitle || "Featured Products"} products={featuredCollectionProducts} href="/products?sort=top-rated" /> : <section className="mx-auto max-w-[1340px] px-4 py-10 sm:px-6 lg:px-8"><EmptyState title="No featured products" /></section>}
        <section className="bg-[linear-gradient(135deg,#4338CA_0%,#4F46E5_48%,#6366F1_100%)] px-4 py-10 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1340px] gap-6 lg:grid-cols-[1fr,340px] lg:items-center">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.3em]">{campaign.promoEyebrow || "Season Sale"}</p>
              <h3 className="text-3xl font-black uppercase sm:text-5xl">{campaign.promoTitle || "Up To 50% Off"}</h3>
              <p className="max-w-2xl text-sm font-medium leading-7 text-white/72">{campaign.promoSubtitle || "Selected streetwear staples are marked down right now. Hoodies, cargos, sneakers, and everyday layers are all in the current sale edit."}</p>
            </div>
            <Link
              href={campaign.promoCardLink || "/products?sort=price-desc"}
              className="group rounded-[24px] bg-[#0B1022] px-6 py-5 text-[#C7D2FE] shadow-[0_18px_40px_rgba(15,23,42,0.28)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C7D2FE]/70">{campaign.promoCardEyebrow || "Limited Edit"}</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black uppercase text-[#C7D2FE]">{campaign.promoCardTitle || "Shop Sale"}</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">{campaign.promoCardSubtitle || "Best markdowns across statement pieces and daily essentials."}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#C7D2FE] transition group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export function SearchPageScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() => parseFilters(searchParams, true));
  const [page, setPage] = useState(Number(searchParams?.get("page") || 1));
  const debouncedQuery = useDebouncedValue(filters.q, 300);
  const { addSearch } = useRecentSearches();
  const requestFilters = useMemo(() => ({ ...filters, q: debouncedQuery }), [debouncedQuery, filters]);
  const { data: categories } = useApi<Category[]>("/api/categories", [], {
    cacheTtlMs: 10 * 60 * 1000,
  });
  const filteredCategories = filters.gender === "all" ? categories : categories.filter((category) => category.gender === filters.gender || category.gender === "all");
  const { data, loading, error } = useApi<ProductsResponse>(makeUrl(requestFilters, page), { products: [], total: 0, page: 1, totalPages: 1 }, {
    cacheTtlMs: 60 * 1000,
    keepPreviousData: true,
  });
  const isSearching = filters.q !== debouncedQuery;

  useEffect(() => {
    setFilters(parseFilters(searchParams, true));
    setPage(Number(searchParams?.get("page") || 1));
  }, [searchParams]);

  useEffect(() => {
    const activeQuery = searchParams?.get("q")?.trim();
    if (activeQuery) {
      addSearch(activeQuery);
    }
  }, [addSearch, searchParams]);

  const handleSearchPageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    router.push(`/search?${buildQuery(filters, true, nextPage)}`);
  };

  const apply = () => {
    if (filters.q.trim()) {
      addSearch(filters.q);
    }
    setPage(1);
    router.push(`/search?${buildQuery(filters, true, 1)}`);
  };
  const clear = () => {
    const reset = { q: filters.q, minPrice: "", maxPrice: "", sort: "newest", sizes: [], categories: [], gender: "all" as const };
    setFilters(reset);
    setPage(1);
    router.push(`/search?${buildQuery(reset, true, 1)}`);
  };

  return (
    <ResultsLayout
      title={filters.q ? `Results for "${filters.q}"` : "Search Results"}
      resultText={`${data.total} ${data.total === 1 ? "result" : "results"}`}
      filters={filters}
      setFilters={setFilters}
      categories={categories}
      filteredCategories={filteredCategories}
      products={data.products}
      total={data.total}
      loading={loading || isSearching}
      error={error}
      apply={apply}
      clear={clear}
      limit={12}
      bottom={<Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={12} onPageChange={handleSearchPageChange} />}
      emptyState={
        <EmptyState
          title={filters.q ? `No results for "${filters.q}"` : "No results"}
          description="Try a different keyword or browse the full catalog."
          action={
            <Link href="/products" className="rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-2 text-sm font-semibold text-[#F8FAFC]">
              Browse all products
            </Link>
          }
        />
      }
    />
  );
}

export function ProductsPageScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(Number(searchParams?.get("page") || 1));
  const [filters, setFilters] = useState<SearchFilters>(() => parseFilters(searchParams));
  const { data: categories } = useApi<Category[]>("/api/categories", [], {
    cacheTtlMs: 10 * 60 * 1000,
  });
  const filteredCategories = filters.gender === "all" ? categories : categories.filter((category) => category.gender === filters.gender || category.gender === "all");
  const { data, loading, error } = useApi<ProductsResponse>(makeUrl(filters, page), { products: [], total: 0, page: 1, totalPages: 1 }, {
    cacheTtlMs: 60 * 1000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setFilters(parseFilters(searchParams));
    setPage(Number(searchParams?.get("page") || 1));
  }, [searchParams]);

  const selectedNames = categories.filter((category) => filters.categories.includes(category.slug)).map((category) => category.name).join(", ");
  const apply = () => {
    setPage(1);
    router.push(`/products?${buildQuery(filters, false, 1)}`);
  };
  const clear = () => {
    setFilters({ q: "", minPrice: "", maxPrice: "", sort: "newest", sizes: [], categories: [], gender: "all" });
    setPage(1);
    router.push("/products");
  };

  return (
    <ResultsLayout
      title={selectedNames || "All Products"}
      resultText={`${data.total} products`}
      filters={filters}
      setFilters={setFilters}
      categories={categories}
      filteredCategories={filteredCategories}
      products={data.products}
      total={data.total}
      loading={loading}
      error={error}
      apply={apply}
      clear={clear}
      limit={12}
      bottom={<Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={12} onPageChange={(nextPage) => { setPage(nextPage); window.scrollTo({ top: 0, behavior: "smooth" }); router.push(`/products?${buildQuery(filters, false, nextPage)}`); }} />}
    />
  );
}

function RatingPanel({ average, total, breakdown }: { average: number; total: number; breakdown: { _id: number; count: number }[] }) {
  return (
    <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-5">
      <div className="flex items-end gap-4">
        <p className="text-5xl font-black text-[#C7D2FE]">{average.toFixed(1)}</p>
        <div className="pb-1">
          <div className="flex gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < Math.round(average) ? "h-4 w-4 fill-[#818CF8] text-[#818CF8]" : "h-4 w-4 text-[#444444]"} />)}</div>
          <p className="mt-2 text-sm text-[#888888]">{total} approved reviews</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown.find((item) => item._id === star)?.count || 0;
          return <div key={star} className="flex items-center gap-3 text-sm text-[#BDBDBD]"><span className="w-8">{star}★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1A1A1A]"><div className="h-full rounded-full bg-[#6366F1]" style={{ width: `${total ? (count / total) * 100 : 0}%` }} /></div><span className="w-8 text-right text-[#888888]">{count}</span></div>;
        })}
      </div>
    </div>
  );
}

function DescriptionSection({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = description.length > 220 ? `${description.slice(0, 220)}...` : description;
  return (
    <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">Description</p>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-sm font-medium text-white">{expanded ? "Show Less" : "Read More"}</button>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#BDBDBD]">{expanded ? description : preview}</p>
    </div>
  );
}

export function ProductDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: session, status, resolvedIsVerified, isVerificationSyncing } = useVerifiedSessionState();
  const { data: product, loading, error } = useApi<Product | null>(`/api/products/${slug}`, null, {
    cacheTtlMs: 60 * 1000,
  });
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [qty, setQty] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPage, setReviewPage] = useState(1);
  const [liveVariants, setLiveVariants] = useState<Product["variants"]>([]);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const reviewsRef = useRef<HTMLElement | null>(null);
  const sharePopoverRef = useRef<HTMLDivElement | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const addRecentlyViewedProduct = useRecentlyViewedStore((state) => state.addProduct);
  const wishlist = useWishlistStore();
  const { data: reviews, loading: reviewsLoading } = useApi<{ reviews: Review[]; ratingBreakdown: { _id: number; count: number }[]; total: number; page: number; totalPages: number }>(product?._id ? `/api/reviews/product/${product._id}?page=${reviewPage}&limit=5` : null, { reviews: [], ratingBreakdown: [], total: 0, page: 1, totalPages: 1 }, {
    cacheTtlMs: 60 * 1000,
    keepPreviousData: true,
  });
  const { data: deliveredOrders } = useApi<ProductsResponse | { orders: Array<{ items: Array<{ product?: { _id?: string } | null; title?: string }> }> }>(
    status === "authenticated" && resolvedIsVerified && product?._id ? "/api/orders?status=delivered&limit=100" : null,
    { orders: [] } as { orders: Array<{ items: Array<{ product?: { _id?: string } | null; title?: string }> }> },
    {
      cacheTtlMs: 60 * 1000,
      keepPreviousData: true,
    },
  );
  const { data: related } = useApi<ProductsResponse>(product?.category?.slug ? `/api/products?category=${product.category.slug}&limit=4` : null, { products: [], total: 0, page: 1, totalPages: 1 }, {
    cacheTtlMs: 60 * 1000,
    keepPreviousData: true,
  });
  const { data: moreFromGender } = useApi<ProductsResponse>(product?.gender ? `/api/products?gender=${product.gender}&limit=4` : null, { products: [], total: 0, page: 1, totalPages: 1 }, {
    cacheTtlMs: 60 * 1000,
    keepPreviousData: true,
  });
  const variants = useMemo(() => liveVariants?.length ? liveVariants : product?.variants || [], [liveVariants, product?.variants]);
  const displayColors = useMemo(
    () => (product?.colors?.length ? product.colors : [...new Map(variants.map((variant) => [variant.color.name, variant.color])).values()]),
    [product?.colors, variants],
  );
  const colorsForSelection = useMemo(() => (displayColors.length ? displayColors : []), [displayColors]);
  const sizesForSelectedColor = useMemo(
    () =>
      variants.filter(
        (variant) =>
          variant.color.name === selectedColor && variant.isActive !== false,
      ),
    [selectedColor, variants],
  );
  const selectedVariant = useMemo(
    () =>
      variants.find(
        (variant) =>
          variant.color.name === selectedColor &&
          variant.size === selectedSize &&
          variant.isActive !== false,
      ) || null,
    [selectedColor, selectedSize, variants],
  );
  const variantStock = useMemo(() => selectedVariant?.stock ?? 0, [selectedVariant]);
  const selectedVariantSalePrice = useMemo(
    () =>
      getVariantSalePrice(
        selectedVariant,
        product?.discountPrice || product?.price || 0,
      ),
    [product?.discountPrice, product?.price, selectedVariant],
  );
  const selectedVariantCompareAtPrice = useMemo(
    () =>
      getVariantCompareAtPrice(
        selectedVariant,
        product?.price || selectedVariantSalePrice,
        selectedVariantSalePrice,
      ),
    [product?.price, selectedVariant, selectedVariantSalePrice],
  );
  const displayImages = useMemo(() => {
    if (!product) return [];
    if (selectedColor) {
      const colorSpecific = product.colorImages?.[selectedColor] || [];
      if (colorSpecific.length) {
        return colorSpecific;
      }
    }
    return product.images || [];
  }, [product, selectedColor]);
  const savings = useMemo(
    () =>
      selectedVariantCompareAtPrice > selectedVariantSalePrice
        ? Math.round(
            ((selectedVariantCompareAtPrice - selectedVariantSalePrice) /
              selectedVariantCompareAtPrice) *
              100,
          )
        : 0,
    [selectedVariantCompareAtPrice, selectedVariantSalePrice],
  );
  const inWishlist = useMemo(
    () =>
      product
        ? wishlist.has(product._id, selectedVariant?._id)
        : false,
    [product, selectedVariant?._id, wishlist],
  );
  const canReview = useMemo(
    () =>
      Boolean(
        product &&
          status === "authenticated" &&
          (deliveredOrders as { orders?: Array<{ items: Array<{ product?: { _id?: string } | null; title?: string }> }> }).orders?.some((order) =>
            order.items.some((item) => item.product?._id === product._id || item.title === product.title),
          ),
      ),
    [deliveredOrders, product, status],
  );
  const sizeGroup = useMemo(() => getSizeGroupForCategory(product?.category?.slug || ""), [product?.category?.slug]);
  const sizeGuideLabel = useMemo(
    () =>
      sizeGroup === "footwear"
        ? "UK Size Guide"
        : sizeGroup === "bottoms"
        ? "Waist Size Guide"
        : "Size Guide",
    [sizeGroup],
  );
  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return product ? `/products/${product.slug}` : "";
  }, [product]);
  const shareTitle = useMemo(() => (product ? `${product.title} — StyleHub` : "StyleHub"), [product]);
  const shareText = "Check out this on StyleHub — Premium Streetwear";
  const handleColorSelect = useCallback((colorName: string) => {
    if (colorName === selectedColor) return;
    setSelectedColor(colorName);
  }, [selectedColor]);
  const isVerifiedUser = Boolean(status === "authenticated" && resolvedIsVerified);

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setShareMenuOpen(false);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [shareUrl]);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) {
      await copyShareLink();
      return;
    }
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      setShareMenuOpen(false);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast.error("Unable to share right now");
    }
  }, [copyShareLink, shareText, shareTitle, shareUrl]);

  const handleShareClick = useCallback(async () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      await nativeShare();
      return;
    }
    setShareMenuOpen((current) => !current);
  }, [nativeShare]);

  const handleAddToCart = useDebounceCallback(async () => {
    setAddToCartLoading(true);
    if (status === "authenticated" && isVerificationSyncing) {
      setAddToCartLoading(false);
      return;
    }
    if (status === "authenticated" && !isVerifiedUser) {
      setAddToCartLoading(false);
      setVerificationOpen(true);
      return;
    }
    if (!product || !selectedVariant) {
      setAddToCartLoading(false);
      toast.error("Select an available color and size");
      return;
    }
    addItem({
      productId: product._id,
      variantId: selectedVariant._id,
      slug: product.slug,
      title: product.title,
      image: fallbackImage(selectedVariant.image || displayImages[0] || product.images?.[0]),
      price: selectedVariantCompareAtPrice,
      discountPrice: selectedVariantSalePrice,
      compareAtPrice: selectedVariantCompareAtPrice,
      qty,
      size: selectedSize,
      color: selectedVariant.color,
      variantSku: selectedVariant.sku,
      maxQty: variantStock,
      gender: product.gender,
      acceptedPayments: product.acceptedPayments,
    });
    toast.success("Added to cart");
    window.setTimeout(() => setAddToCartLoading(false), 200);
  }, 1000);

  useEffect(() => {
    setLiveVariants(product?.variants || []);
  }, [product?.variants]);

  useEffect(() => {
    if (!product?.slug) return;
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/products/${product.slug}/stock`, { cache: "no-store" });
      const json = (await response.json()) as { success: boolean; data?: { variants?: Product["variants"] } };
      if (json.success && json.data?.variants) {
        setLiveVariants(json.data.variants);
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [product?.slug]);

  useEffect(() => {
    if (!selectedColor && colorsForSelection[0]?.name) {
      setSelectedColor(colorsForSelection[0].name);
    }
  }, [colorsForSelection, selectedColor]);

  useEffect(() => {
    if (selectedColor && (!selectedSize || !sizesForSelectedColor.some((variant) => variant.size === selectedSize)) && sizesForSelectedColor[0]?.size) {
      setSelectedSize(sizesForSelectedColor[0].size);
      setQty(1);
    }
  }, [selectedColor, selectedSize, sizesForSelectedColor]);

  useEffect(() => {
    if (variantStock > 0) {
      setQty((current) => Math.min(current, variantStock));
    }
  }, [variantStock]);

  useEffect(() => {
    if (!product?._id) {
      return;
    }

    addRecentlyViewedProduct({
      productId: product._id,
      slug: product.slug,
      name: product.title,
      price: product.price,
      discountPrice: product.discountPrice,
      image: fallbackImage(product.images?.[0]),
    });
  }, [
    addRecentlyViewedProduct,
    product?._id,
    product?.discountPrice,
    product?.images,
    product?.price,
    product?.slug,
    product?.title,
  ]);

  useEffect(() => {
    setReviewPage(1);
  }, [product?._id]);

  useEffect(() => {
    if (!shareMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (sharePopoverRef.current && !sharePopoverRef.current.contains(event.target as Node)) {
        setShareMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShareMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [shareMenuOpen]);

  if (loading) return <PageShell><main className="px-0 py-0"><ProductDetailSkeleton /></main></PageShell>;
  if (error || !product) return <PageShell><main className="mx-auto max-w-[1200px] px-6 py-20"><EmptyState title="Product unavailable" description={error || "This product could not be loaded."} /></main></PageShell>;

  const submitReview = async () => {
    if (isVerificationSyncing) {
      return;
    }
    if (!isVerifiedUser) {
      setVerificationOpen(true);
      return;
    }
    try {
      setReviewSubmitting(true);
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product._id, rating: reviewRating, title: reviewTitle, comment: reviewComment, images: [] }) });
      const json = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !json.success) throw new Error(json.message || "Failed to submit review");
      toast.success(json.message || "Review pending approval");
      setReviewTitle("");
      setReviewComment("");
    } catch (submissionError) {
      toast.error(submissionError instanceof Error ? submissionError.message : "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const hasApprovedReviews = reviews.total > 0;

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] space-y-16 px-6 py-16">
        <section className="product-detail-grid grid gap-6 md:gap-[60px] md:grid-cols-2">
          <div className="w-full">
            <ProductGallery
              images={displayImages}
              productTitle={product.title}
              brand={product.brand}
              selectedColor={selectedColor}
              priority
              badge={
                product.totalStock === 0
                  ? "SOLD OUT"
                  : product.isFeatured
                    ? "NEW"
                    : savings >= 20
                      ? "SALE"
                      : undefined
              }
            />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3"><p className="text-xs uppercase tracking-[0.3em] text-[#888888]">{product.brand}</p><GenderBadge gender={product.gender} /></div>
              <h1 className="mt-2 text-[28px] font-black text-white lg:text-[32px]">{product.title}</h1>
              {hasApprovedReviews ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#BDBDBD]">
                  <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < Math.round(product.averageRating ?? 0) ? "h-4 w-4 fill-[#818CF8] text-[#818CF8]" : "h-4 w-4 text-[#444444]"} />)}</div>
                  <span>{(product.averageRating ?? 0).toFixed(1)}</span>
                  <span>({reviews.total} reviews)</span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-y border-[#1F1F1F] py-6">
              <span className="text-[32px] font-black text-[#C7D2FE]">{formatCurrency(selectedVariantSalePrice)}</span>
              {selectedVariantCompareAtPrice > selectedVariantSalePrice ? <span className="text-lg text-[#888888] line-through">{formatCurrency(selectedVariantCompareAtPrice)}</span> : null}
              {savings > 0 ? <span className="rounded-full bg-[#4F46E5]/16 px-3 py-1 text-xs font-bold text-[#E0E7FF]">{savings}% OFF</span> : null}
            </div>
            <div className="space-y-6">
              <ProductAvailableOffers
                total={selectedVariantSalePrice * qty}
                categoryId={product.category?._id || null}
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-bold uppercase tracking-[0.18em] text-white">
                  <span>Select Size</span>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="inline-flex items-center gap-2 text-xs text-[#A5B4FC] transition hover:text-[#C7C2FF]"
                  >
                    <Ruler className="h-3.5 w-3.5" />
                    {sizeGuideLabel}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {(product.sizes?.length ? product.sizes : ["S", "M", "L", "XL", "XXL"]).map((size) => {
                    const variant = variants.find((item) => item.color.name === selectedColor && item.size === size && item.isActive !== false);
                    const disabled = !variant || variant.stock === 0;
                    return <button key={size} type="button" disabled={disabled} title={disabled ? "Out of Stock" : undefined} onClick={() => setSelectedSize(size)} className={`size-btn ${selectedSize === size ? "rounded-lg bg-[#6366F1] px-3 py-3 text-sm font-semibold text-white" : disabled ? "rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-3 text-sm font-semibold text-[#666666] line-through" : "rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-3 text-sm font-semibold text-white"}`}>{size}</button>;
                  })}
                </div>
              </div>
              {colorsForSelection.length ? <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">Color</p><p className="text-sm font-semibold text-white">{selectedColor || colorsForSelection[0]?.name}</p></div><div className="flex flex-wrap gap-3">{colorsForSelection.map((color) => { const colorHasStock = variants.some((variant) => variant.color.name === color.name && variant.stock > 0 && variant.isActive !== false); return <button key={color.name} type="button" disabled={!colorHasStock} onClick={() => handleColorSelect(color.name)} className={selectedColor === color.name ? "rounded-full ring-2 ring-[#818CF8] ring-offset-2 ring-offset-[#0A0A0A]" : "rounded-full opacity-100 disabled:opacity-50"} aria-label={color.name} title={color.name}><span className="block h-10 w-10 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} /></button>; })}</div></div> : null}
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Quantity</p>
                <div className="flex w-fit items-center rounded-lg border border-[#1F1F1F] bg-[#111111]"><button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))} className="px-4 py-3 text-lg text-white">-</button><span className="min-w-14 text-center text-sm font-semibold text-white">{qty}</span><button type="button" onClick={() => { if (qty >= variantStock) { toast.error(`Only ${variantStock} units available`); return; } setQty((v) => v + 1); }} className="px-4 py-3 text-lg text-white">+</button></div>
              </div>
              <p className={variantStock > 10 ? "text-sm font-medium text-emerald-400" : variantStock > 0 ? "text-sm font-medium text-amber-300" : "text-sm font-medium text-red-400"}>{variantStock > 10 ? "In Stock" : variantStock > 0 ? `Only ${variantStock} left!` : "Out of Stock"}</p>
              <div className="product-actions grid gap-3">
                <Button type="button" loading={addToCartLoading} loadingText="Adding..." onClick={() => void handleAddToCart()} disabled={!selectedVariant || variantStock === 0} className="h-[50px] w-full uppercase tracking-[0.12em]">Add To Cart</Button>
                <Button type="button" variant="secondary" loading={wishlistLoading} onClick={() => { if (status !== "authenticated") { toast.error("Please login to save to wishlist"); router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`); return; } if (isVerificationSyncing) { return; } if (!isVerifiedUser) { setVerificationOpen(true); return; } setWishlistLoading(true); try { wishlist.toggle({ productId: product._id, variantId: selectedVariant?._id, slug: product.slug, title: product.title, image: fallbackImage(selectedVariant?.image || product.images?.[0]), price: selectedVariantCompareAtPrice, discountPrice: selectedVariantSalePrice, compareAtPrice: selectedVariantCompareAtPrice, brand: product.brand, size: selectedVariant?.size, color: selectedVariant?.color, variantSku: selectedVariant?.sku, variantAvailable: Boolean(selectedVariant && selectedVariant.stock > 0) }); } finally { window.setTimeout(() => setWishlistLoading(false), 150); } }} className="h-[50px] w-full uppercase tracking-[0.12em]"><Heart className={inWishlist ? "h-4 w-4 fill-[#818CF8] text-[#818CF8]" : "h-4 w-4"} />Add To Wishlist</Button>
              </div>
              <div className="relative" ref={sharePopoverRef}>
                <button
                  type="button"
                  onClick={() => void handleShareClick()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#1F1F1F] px-4 text-sm font-semibold text-[#D7D7E4] transition hover:border-[#6366F1]/40 hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                  {shareCopied ? "Copied!" : "Share"}
                </button>
                {shareMenuOpen ? (
                  <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[220px] rounded-2xl border border-white/10 bg-[#111111] p-2 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                    <button
                      type="button"
                      onClick={() => void copyShareLink()}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
                    >
                      <Link2 className="h-4 w-4 text-[#A5B4FC]" />
                      {shareCopied ? "Copied!" : "Copy Link"}
                    </button>
                    {typeof navigator !== "undefined" && "share" in navigator ? (
                      <button
                        type="button"
                        onClick={() => void nativeShare()}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
                      >
                        <Share2 className="h-4 w-4 text-[#A5B4FC]" />
                        Share
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4 text-sm text-[#BDBDBD]"><div className="flex items-start gap-3"><Truck className="mt-0.5 h-5 w-5 text-[#A5B4FC]" /><div className="space-y-1"><p>Free delivery on orders above ₹499</p><p>Tracked shipping with post-delivery support.</p></div></div></div>
              <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4 text-sm text-[#BDBDBD]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Return &amp; Exchange Policy</p>
                <div className="mt-3 space-y-2">
                  {product.returnAllowed ? (
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <p>Returns accepted within {product.returnWindowDays || 7} days of delivery.</p>
                    </div>
                  ) : null}
                  {product.exchangeAllowed ? (
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <p>Exchanges accepted within {product.exchangeWindowDays || 7} days of delivery.</p>
                    </div>
                  ) : null}
                  {!product.returnAllowed && !product.exchangeAllowed ? (
                    <p className="text-[#8C8C95]">This product does not accept returns or exchanges.</p>
                  ) : null}
                </div>
              </div>
              <DescriptionSection description={product.description || product.shortDescription || "No description available."} />
              </div>
              <SizeGuideModal
                isOpen={sizeGuideOpen}
                onClose={() => setSizeGuideOpen(false)}
                selectedSize={selectedSize}
                fitNotes={product.fitNotes}
                category={product.category?.name}
              />
              <VerificationRequiredModal
                isOpen={verificationOpen}
                onClose={() => setVerificationOpen(false)}
                description="Verify your email to add products to your cart, save your wishlist, or submit reviews."
              />
            </div>
        </section>
        <section ref={reviewsRef} className="space-y-8">
          <SectionHeading eyebrow="Reviews" title="What Customers Say" />
          <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
            <RatingPanel average={product.averageRating ?? 0} total={reviews.total} breakdown={reviews.ratingBreakdown} />
            <div className="space-y-5">
              {reviewsLoading ? Array.from({ length: 3 }).map((_, index) => <ReviewSkeleton key={index} />) : reviews.reviews.length ? reviews.reviews.map((review) => <div key={review._id} className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-5"><div className="flex items-center justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{review.user?.name || "Customer"}</p>{review.isVerifiedPurchase ? <span className="rounded-full bg-[#22C55E]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#22C55E]">Verified Purchase</span> : null}</div><p className="text-xs text-[#888888]">{new Date(review.createdAt).toLocaleDateString()}</p></div><div className="flex gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < review.rating ? "h-4 w-4 fill-[#818CF8] text-[#818CF8]" : "h-4 w-4 text-[#444444]"} />)}</div></div><h4 className="mt-4 text-lg font-semibold text-white">{review.title}</h4><p className="mt-2 text-sm leading-6 text-[#BDBDBD]">{review.comment}</p></div>) : <EmptyState title="No reviews yet" />}
              <Pagination currentPage={reviews.page} totalPages={reviews.totalPages} totalItems={reviews.total} itemsPerPage={5} onPageChange={(nextPage) => { setReviewPage(nextPage); reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
              {status === "authenticated" && isVerifiedUser && canReview ? <div className="space-y-4 rounded-xl border border-[#1F1F1F] bg-[#111111] p-5"><h3 className="text-xl font-bold text-white">Write a Review</h3><div className="flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setReviewRating(value)} className="rounded-full border border-[#1F1F1F] p-2"><Star className={value <= reviewRating ? "h-5 w-5 fill-[#818CF8] text-[#818CF8]" : "h-5 w-5 text-[#555555]"} /></button>)}</div><Field label="Review Title"><TextInput leftPad={false} value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} placeholder="Review title" /></Field><Field label="Review"><TextArea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your thoughts" /></Field><Button type="button" loading={reviewSubmitting} loadingText="Submitting..." onClick={() => void submitReview()}>Submit Review</Button></div> : null}
              {status !== "authenticated" ? <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-5 text-sm text-[#BDBDBD]"><Link href={`/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`} className="font-semibold text-[#A5B4FC]">Sign in</Link> to review</div> : null}
              {status === "authenticated" && !isVerifiedUser ? <div className="rounded-xl border border-[#6366F1]/20 bg-[#4F46E5]/10 p-5 text-sm text-[#D6DCFF]"><button type="button" onClick={() => setVerificationOpen(true)} className="font-semibold text-[#A5B4FC]">Verify your email</button> to submit reviews.</div> : null}
              {status === "authenticated" && isVerifiedUser && !canReview ? <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-5 text-sm text-[#BDBDBD]">Reviewing opens after delivery.</div> : null}
            </div>
          </div>
        </section>
        <section className="space-y-8">
          <SectionHeading eyebrow="More Like This" title={`More from ${product.gender === "men" ? "Men's" : product.gender === "women" ? "Women's" : "Unisex"}`} />
          {moreFromGender.products.length ? <div className="flex gap-4 overflow-x-auto pb-2 lg:gap-5">{moreFromGender.products.filter((item) => item._id !== product._id).slice(0, 4).map((item) => <div key={item._id} className="min-w-[220px] max-w-[260px] flex-1 lg:min-w-[240px] lg:max-w-[280px]"><ProductCard product={item} /></div>)}</div> : <EmptyState compact title="No more products" />}
        </section>
        <RecentlyViewedRail
          currentProductId={product._id}
          lowStockIds={product.totalStock !== undefined && product.totalStock < 5 ? [product._id] : []}
        />
        <section className="space-y-8">
          <SectionHeading eyebrow="Related" title="You May Also Like" />
          {related.products.length ? <div className="flex gap-4 overflow-x-auto pb-2 lg:gap-5">{related.products.filter((item) => item._id !== product._id).slice(0, 4).map((item) => <div key={item._id} className="min-w-[220px] max-w-[260px] flex-1 lg:min-w-[240px] lg:max-w-[280px]"><ProductCard product={item} /></div>)}</div> : <EmptyState title="No related products" />}
        </section>
      </main>
    </PageShell>
  );
}
