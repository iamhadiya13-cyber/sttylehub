"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export function OrderHistorySkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBox width={180} height={34} borderRadius={8} />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonBox key={index} width={88} height={36} borderRadius={999} />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <SkeletonBox width={160} height={12} borderRadius={6} />
                <SkeletonBox width={200} height={28} borderRadius={8} />
                <SkeletonBox width={148} height={13} borderRadius={6} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SkeletonBox width={84} height={24} borderRadius={999} />
                <SkeletonBox width={104} height={38} borderRadius={12} />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                {Array.from({ length: 3 }).map((__, thumbIndex) => (
                  <SkeletonBox key={thumbIndex} width={56} height={64} borderRadius={12} />
                ))}
              </div>
              <SkeletonBox width={96} height={18} borderRadius={6} className="ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
