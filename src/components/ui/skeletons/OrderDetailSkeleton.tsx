"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBox width={220} height={34} borderRadius={8} />

      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
        <div className="hidden items-center justify-between gap-3 sm:flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-1 items-center gap-3">
              <SkeletonBox width={20} height={20} borderRadius="999px" />
              {index < 4 ? <SkeletonBox width="100%" height={2} borderRadius={2} /> : null}
            </div>
          ))}
        </div>
        <div className="space-y-4 sm:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <SkeletonBox width={20} height={20} borderRadius="999px" />
              <SkeletonBox width={2} height={32} borderRadius={2} className={index === 4 ? "opacity-0" : undefined} />
              <SkeletonBox width={120} height={12} borderRadius={6} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
            <SkeletonBox width={120} height={22} borderRadius={8} />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex gap-4 rounded-2xl border border-[#1F1F1F] bg-black/20 p-3">
                  <SkeletonBox width={80} height={96} borderRadius={12} />
                  <div className="flex-1 space-y-3">
                    <SkeletonBox width="62%" height={16} borderRadius={6} />
                    <SkeletonBox width="30%" height={12} borderRadius={6} />
                    <SkeletonBox width="26%" height={16} borderRadius={6} className="mt-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
            <SkeletonBox width={100} height={18} borderRadius={6} />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <SkeletonBox width={92} height={13} borderRadius={6} />
                  <SkeletonBox width={72} height={13} borderRadius={6} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
            <SkeletonBox width={140} height={18} borderRadius={6} />
            <div className="mt-4 space-y-3">
              <SkeletonBox width="72%" height={13} borderRadius={6} />
              <SkeletonBox width="88%" height={13} borderRadius={6} />
              <SkeletonBox width="64%" height={13} borderRadius={6} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
