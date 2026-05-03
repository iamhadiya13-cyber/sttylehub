"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export function CartPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBox width={180} height={34} borderRadius={8} />
      <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid gap-4 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-4 sm:grid-cols-[120px,1fr]">
              <SkeletonBox width={80} height={80} borderRadius={12} className="sm:h-[120px] sm:w-[120px]" />
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <SkeletonBox width={180} height={18} borderRadius={6} />
                    <SkeletonBox width={120} height={13} borderRadius={6} />
                  </div>
                  <SkeletonBox width={36} height={36} borderRadius="999px" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <SkeletonBox width={96} height={30} borderRadius={8} />
                  <SkeletonBox width={90} height={18} borderRadius={6} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
          <SkeletonBox width={140} height={24} borderRadius={8} />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <SkeletonBox width={96} height={13} borderRadius={6} />
                <SkeletonBox width={72} height={13} borderRadius={6} />
              </div>
            ))}
            <SkeletonBox width="100%" height={1} borderRadius={1} className="opacity-50" />
            <div className="flex items-center justify-between gap-4">
              <SkeletonBox width={72} height={20} borderRadius={6} />
              <SkeletonBox width={92} height={20} borderRadius={6} />
            </div>
            <SkeletonBox width="100%" height={48} borderRadius={12} />
          </div>
        </aside>
      </div>
    </div>
  );
}
