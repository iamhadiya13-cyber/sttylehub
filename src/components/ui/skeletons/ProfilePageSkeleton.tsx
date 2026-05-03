"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export function ProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6 sm:flex-row sm:items-start">
        <SkeletonBox width={88} height={88} borderRadius="999px" />
        <div className="space-y-3 text-center sm:text-left">
          <SkeletonBox width={180} height={24} borderRadius={8} />
          <SkeletonBox width={220} height={14} borderRadius={6} />
        </div>
      </div>

      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <SkeletonBox width={180} height={18} borderRadius={6} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBox width={96} height={12} borderRadius={6} />
              <SkeletonBox width="100%" height={46} borderRadius={10} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <SkeletonBox width={152} height={18} borderRadius={6} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-5">
              <div className="space-y-3">
                <SkeletonBox width="48%" height={14} borderRadius={6} />
                <SkeletonBox width="72%" height={13} borderRadius={6} />
                <SkeletonBox width="84%" height={13} borderRadius={6} />
                <SkeletonBox width="62%" height={13} borderRadius={6} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
