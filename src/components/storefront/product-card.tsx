"use client";

import { type ReactNode, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";
import VerificationRequiredModal from "@/components/ui/VerificationRequiredModal";
import { toast } from "react-hot-toast";
import { useVerifiedSessionState } from "@/hooks/useVerifiedSessionState";
import { productImageAlt } from "@/lib/seo/site";
import { cn, formatCurrency } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlist-store";
import { fallbackImage, isPollinationsImage } from "@/components/storefront/media";
import type { Product } from "@/components/storefront/types";

function StatusBadge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-[10px] py-[3px] text-[10px] font-bold uppercase tracking-[1px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const router = useRouter();
  const { status, resolvedIsVerified, isVerificationSyncing } = useVerifiedSessionState();
  const isVerifiedUser = Boolean(status === "authenticated" && resolvedIsVerified);
  const wishlist = useWishlistStore();
  const isWished = wishlist.has(product._id);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const discount =
    product.price > product.discountPrice
      ? Math.round(
          ((product.price - product.discountPrice) / product.price) * 100,
        )
      : 0;
  const hasReviewSummary =
    Number(product.totalReviews || 0) > 0 &&
    Number(product.averageRating || 0) > 0;

  const totalStock = product.totalStock ?? 0;

  const requireLoginForWishlist = () => {
    toast.error("Please login to save to wishlist");
    router.push(
      `/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`,
    );
  };

  return (
    <>
    <motion.article
      whileHover={{ y: -3 }}
      onMouseEnter={() => router.prefetch(`/products/${product.slug}`)}
      onFocus={() => router.prefetch(`/products/${product.slug}`)}
      onClick={() => router.push(`/products/${product.slug}`)}
      className="group cursor-pointer overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,#0F1220_0%,#0B0E18_100%)] transition-all duration-300 hover:border-[#6366F1]/30 hover:shadow-[0_20px_44px_rgba(2,6,23,0.42)] xl:rounded-[20px]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#141827]">
        {isPollinationsImage(product.images?.[0]) ? (
          <img
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <Image
            src={fallbackImage(product.images?.[0])}
            alt={productImageAlt(product)}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,19,0.02)_0%,rgba(8,11,19,0.08)_38%,rgba(8,11,19,0.42)_100%)]" />
        <div className="absolute left-0 top-0 flex gap-1 p-[10px]">
          {product.flashSale ? (
            <StatusBadge className="bg-red-500/18 text-red-200">Flash Sale</StatusBadge>
          ) : null}
          {discount > 0 ? (
            <StatusBadge className="bg-[#4F46E5]/16 text-[#E0E7FF]">Sale</StatusBadge>
          ) : null}
          {product.isFeatured ? (
            <StatusBadge className="bg-[#4F46E5]/14 text-[#C7D2FE]">New</StatusBadge>
          ) : null}
          {totalStock === 0 ? (
            <StatusBadge className="bg-black/70 text-white">Sold Out</StatusBadge>
          ) : null}
          {totalStock > 0 && totalStock < 5 ? (
            <StatusBadge className="bg-amber-500/15 text-amber-300">
              Almost Gone
            </StatusBadge>
          ) : null}
        </div>
        <LoadingButton
          type="button"
          loading={wishlistLoading}
          onClick={(event) => {
            event.stopPropagation();
            if (status !== "authenticated") {
              requireLoginForWishlist();
              return;
            }
            if (!isVerifiedUser) {
              setVerificationOpen(true);
              return;
            }
            setWishlistLoading(true);
            try {
              wishlist.toggle({
                productId: product._id,
                slug: product.slug,
                title: product.title,
                image: fallbackImage(product.images?.[0]),
                price: product.price,
                discountPrice: product.discountPrice,
                compareAtPrice: product.price,
                brand: product.brand,
              });
            } finally {
              window.setTimeout(() => setWishlistLoading(false), 150);
            }
          }}
          className="absolute right-2 top-2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/60"
        >
          <Heart
            className={cn(
              "h-4 w-4 text-[#9CA3AF]",
              isWished && "fill-[#EF4444] text-[#EF4444]",
            )}
          />
        </LoadingButton>
        {!!product.colors?.length ? (
          <div className="absolute bottom-0 left-0 flex items-center gap-1 px-[10px] py-2">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="h-[10px] w-[10px] rounded-full border border-white/20"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {product.colors.length > 4 ? (
              <span className="text-[10px] text-white/70">
                +{product.colors.length - 4}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="space-y-2.5 px-3.5 pb-4 pt-3.5 xl:px-4 xl:pb-4.5">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
            {product.brand}
          </p>
          <div className="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-[#F4F1EA] xl:text-[14px]">
            {product.title}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[15px] font-bold text-[#C7D2FE] xl:text-[16px]">
            {formatCurrency(product.discountPrice)}
          </span>
          {discount > 0 ? (
            <span className="text-[12px] text-[#555555] line-through xl:text-[13px]">
              {formatCurrency(product.price)}
            </span>
          ) : null}
          {discount > 0 ? (
            <StatusBadge className="bg-[#1A1A1A] text-[#888888]">
              {discount}% Off
            </StatusBadge>
          ) : null}
        </div>
        {hasReviewSummary ? (
          <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] xl:text-[11px]">
            <Star className="h-3 w-3 fill-[#818CF8] text-[#818CF8]" />
            <span>
              {(product.averageRating ?? 0).toFixed(1)} ({product.totalReviews})
            </span>
          </div>
        ) : null}
      </div>
    </motion.article>
    <VerificationRequiredModal
      isOpen={verificationOpen}
      onClose={() => setVerificationOpen(false)}
      description="Verify your email to add products to your cart or wishlist."
    />
    </>
  );
}
