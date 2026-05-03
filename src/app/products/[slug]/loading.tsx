import { ProductDetailSkeleton } from "@/components/ui/skeletons/ProductDetailSkeleton";
import { ReviewsSkeleton } from "@/components/ui/skeletons/ReviewsSkeleton";
import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export default function ProductPageLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="border-b border-[#1F1F1F] bg-[#0A0A0A]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <SkeletonBox width={132} height={18} borderRadius={8} />
          <div className="flex items-center gap-3">
            <SkeletonBox width={36} height={36} borderRadius="999px" />
            <SkeletonBox width={36} height={36} borderRadius="999px" />
            <SkeletonBox width={36} height={36} borderRadius="999px" />
          </div>
        </div>
      </div>
      <ProductDetailSkeleton />
      <div className="mx-auto max-w-[1200px] px-6 pb-16">
        <ReviewsSkeleton />
      </div>
    </div>
  );
}
