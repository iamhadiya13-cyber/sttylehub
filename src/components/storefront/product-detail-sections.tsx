"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { Heart, Ruler, Star, Truck } from "lucide-react";
import { Button, EmptyState, Field, GenderBadge, SectionHeading, TextArea, TextInput, type Product, type Review } from "@/components/screens/shared";
import { cn, formatCurrency } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";

export function RatingPanel({ average, total, breakdown }: { average: number; total: number; breakdown: { _id: number; count: number }[] }) {
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

export function DescriptionSection({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = description.length > 220 ? `${description.slice(0, 220)}...` : description;
  return (
    <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">Description</p>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="text-sm font-medium text-white">{expanded ? "Show Less" : "Read More"}</button>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#BDBDBD]">{expanded ? description : preview}</p>
    </div>
  );
}

type ProductPurchasePanelProps = {
  product: Product;
  reviewsTotal: number;
  selectedVariantSalePrice: number;
  selectedVariantCompareAtPrice: number;
  savings: number;
  selectedColor: string;
  selectedSize: string;
  qty: number;
  variantStock: number;
  variants: NonNullable<Product["variants"]>;
  colorsForSelection: NonNullable<Product["colors"]>;
  sizeGuideLabel: string;
  inWishlist: boolean;
  onOpenSizeGuide: () => void;
  onSizeSelect: (size: string) => void;
  onColorSelect: (colorName: string) => void;
  onQtyChange: (nextQty: number) => void;
  onAddToCart: () => void;
  onToggleWishlist?: () => void;
  addToCartDisabled?: boolean;
  addToCartLoading?: boolean;
  addToCartLoadingText?: string;
  wishlistLoading?: boolean;
  showWishlist?: boolean;
  showDescription?: boolean;
  showShippingCard?: boolean;
  description?: string;
  footer?: ReactNode;
  headingLevel?: "h1" | "h2";
};

export function ProductPurchasePanel({
  product,
  reviewsTotal,
  selectedVariantSalePrice,
  selectedVariantCompareAtPrice,
  savings,
  selectedColor,
  selectedSize,
  qty,
  variantStock,
  variants,
  colorsForSelection,
  sizeGuideLabel,
  inWishlist,
  onOpenSizeGuide,
  onSizeSelect,
  onColorSelect,
  onQtyChange,
  onAddToCart,
  onToggleWishlist,
  addToCartDisabled,
  addToCartLoading = false,
  addToCartLoadingText = "Adding...",
  wishlistLoading = false,
  showWishlist = true,
  showDescription = true,
  showShippingCard = true,
  description,
  footer,
  headingLevel = "h1",
}: ProductPurchasePanelProps) {
  const hasApprovedReviews = reviewsTotal > 0 && Number(product.averageRating || 0) > 0;
  const TitleTag = headingLevel;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3"><p className="text-xs uppercase tracking-[0.3em] text-[#888888]">{product.brand}</p><GenderBadge gender={product.gender} /></div>
        <TitleTag className="mt-2 text-[28px] font-black text-white lg:text-[32px]">{product.title}</TitleTag>
        {hasApprovedReviews ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#BDBDBD]">
            <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < Math.round(product.averageRating ?? 0) ? "h-4 w-4 fill-[#818CF8] text-[#818CF8]" : "h-4 w-4 text-[#444444]"} />)}</div>
            <span>{(product.averageRating ?? 0).toFixed(1)}</span>
            <span>({reviewsTotal} reviews)</span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-y border-[#1F1F1F] py-6">
        <span className="text-[32px] font-black text-[#C7D2FE]">{formatCurrency(selectedVariantSalePrice)}</span>
        {selectedVariantCompareAtPrice > selectedVariantSalePrice ? <span className="text-lg text-[#888888] line-through">{formatCurrency(selectedVariantCompareAtPrice)}</span> : null}
        {savings > 0 ? <span className="rounded-full bg-[#4F46E5]/16 px-3 py-1 text-xs font-bold text-[#E0E7FF]">{savings}% OFF</span> : null}
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-bold uppercase tracking-[0.18em] text-white">
            <span>Select Size</span>
            <button
              type="button"
              onClick={onOpenSizeGuide}
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
              return <button key={size} type="button" disabled={disabled} title={disabled ? "Out of Stock" : undefined} onClick={() => onSizeSelect(size)} className={selectedSize === size ? "rounded-lg bg-[#6366F1] px-3 py-3 text-sm font-semibold text-white" : disabled ? "rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-3 text-sm font-semibold text-[#666666] line-through" : "rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 py-3 text-sm font-semibold text-white"}>{size}</button>;
            })}
          </div>
        </div>
        {colorsForSelection.length ? <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">Color</p><p className="text-sm font-semibold text-white">{selectedColor || colorsForSelection[0]?.name}</p></div><div className="flex flex-wrap gap-3">{colorsForSelection.map((color) => { const colorHasStock = variants.some((variant) => variant.color.name === color.name && variant.stock > 0 && variant.isActive !== false); return <button key={color.name} type="button" disabled={!colorHasStock} onClick={() => onColorSelect(color.name)} className={selectedColor === color.name ? "rounded-full ring-2 ring-[#818CF8] ring-offset-2 ring-offset-[#0A0A0A]" : "rounded-full opacity-100 disabled:opacity-50"} aria-label={color.name} title={color.name}><span className="block h-10 w-10 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} /></button>; })}</div></div> : null}
        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Quantity</p>
          <div className="flex w-fit items-center rounded-lg border border-[#1F1F1F] bg-[#111111]"><button type="button" onClick={() => onQtyChange(Math.max(1, qty - 1))} className="px-4 py-3 text-lg text-white">-</button><span className="min-w-14 text-center text-sm font-semibold text-white">{qty}</span><button type="button" onClick={() => onQtyChange(qty + 1)} className="px-4 py-3 text-lg text-white">+</button></div>
        </div>
        <p className={variantStock > 10 ? "text-sm font-medium text-emerald-400" : variantStock > 0 ? "text-sm font-medium text-amber-300" : "text-sm font-medium text-red-400"}>{variantStock > 10 ? "In Stock" : variantStock > 0 ? `Only ${variantStock} left!` : "Out of Stock"}</p>
        <div className="product-actions grid gap-3">
          <Button type="button" loading={addToCartLoading} loadingText={addToCartLoadingText} onClick={onAddToCart} disabled={addToCartDisabled} className="h-[50px] w-full uppercase tracking-[0.12em]">Add To Cart</Button>
          {showWishlist && onToggleWishlist ? <Button type="button" variant="secondary" loading={wishlistLoading} onClick={onToggleWishlist} className="h-[50px] w-full uppercase tracking-[0.12em]"><Heart className={inWishlist ? "h-4 w-4 fill-[#818CF8] text-[#818CF8]" : "h-4 w-4"} />Add To Wishlist</Button> : null}
        </div>
        {showShippingCard ? <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4 text-sm text-[#BDBDBD]"><div className="flex items-start gap-3"><Truck className="mt-0.5 h-5 w-5 text-[#A5B4FC]" /><div className="space-y-1"><p>Free delivery on orders above ₹499</p><p>Easy 7-day returns</p></div></div></div> : null}
        {showDescription && description ? <DescriptionSection description={description} /> : null}
        {footer}
      </div>
    </div>
  );
}

type ProductReviewsSectionProps = {
  product: Product;
  reviews: Review[];
  reviewsLoading: boolean;
  total: number;
  breakdown: { _id: number; count: number }[];
  page: number;
  totalPages: number;
  onPageChange?: (nextPage: number) => void;
  reviewForm?: ReactNode;
  loginPrompt?: ReactNode;
};

export function ProductReviewsSection({
  product,
  reviews,
  reviewsLoading,
  total,
  breakdown,
  page,
  totalPages,
  onPageChange,
  reviewForm,
  loginPrompt,
}: ProductReviewsSectionProps) {
  return (
    <section className="space-y-8">
      <SectionHeading eyebrow="Reviews" title="What Customers Say" />
      <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
        <RatingPanel average={product.averageRating ?? 0} total={total} breakdown={breakdown} />
        <div className="space-y-5">
          {reviewsLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-xl border border-[#1F1F1F] bg-[#111111]" />) : reviews.length ? reviews.map((review) => <div key={review._id} className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-5"><div className="flex items-center justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{review.user?.name || "Customer"}</p>{review.isVerifiedPurchase ? <span className="rounded-full bg-[#22C55E]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#22C55E]">Verified Purchase</span> : null}</div><p className="text-xs text-[#888888]">{new Date(review.createdAt).toLocaleDateString()}</p></div><div className="flex gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < review.rating ? "h-4 w-4 fill-[#818CF8] text-[#818CF8]" : "h-4 w-4 text-[#444444]"} />)}</div></div><h4 className="mt-4 text-lg font-semibold text-white">{review.title}</h4><p className="mt-2 text-sm leading-6 text-[#BDBDBD]">{review.comment}</p></div>) : <EmptyState title="No reviews yet" />}
          {onPageChange ? <Pagination currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={5} onPageChange={onPageChange} /> : null}
          {reviewForm}
          {loginPrompt}
        </div>
      </div>
    </section>
  );
}
