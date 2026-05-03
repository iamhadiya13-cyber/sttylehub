import { FilterSidebarSkeleton } from "@/components/ui/skeletons/FilterSidebarSkeleton";
import { ProductGridSkeleton } from "@/components/ui/skeletons/ProductGridSkeleton";
import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="border-b border-[#1F1F1F] bg-[#0A0A0A]">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <SkeletonBox width={132} height={18} borderRadius={8} />
          <div className="flex items-center gap-3">
            <SkeletonBox width={36} height={36} borderRadius="999px" />
            <SkeletonBox width={36} height={36} borderRadius="999px" />
            <SkeletonBox width={36} height={36} borderRadius="999px" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between md:hidden">
          <SkeletonBox width={96} height={14} borderRadius={6} />
          <SkeletonBox width={96} height={40} borderRadius={12} />
        </div>

        <div className="flex gap-6">
          <FilterSidebarSkeleton />
          <section className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-col gap-2 border-b border-[#1F1F1F] pb-4 sm:flex-row sm:items-end sm:justify-between">
              <SkeletonBox width={260} height={34} borderRadius={8} />
              <SkeletonBox width={92} height={14} borderRadius={6} />
            </div>
            <ProductGridSkeleton />
          </section>
        </div>
      </main>
    </div>
  );
}
