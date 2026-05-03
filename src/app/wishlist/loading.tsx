import { ProductGridSkeleton } from "@/components/ui/skeletons/ProductGridSkeleton";
import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export default function WishlistLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBox width={180} height={34} borderRadius={8} />
      <ProductGridSkeleton />
    </div>
  );
}
