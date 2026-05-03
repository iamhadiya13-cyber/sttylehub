"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

function StatCard() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
      <SkeletonBox width="36%" height={12} borderRadius={999} />
      <SkeletonBox width="58%" height={40} borderRadius={14} className="mt-4" />
      <SkeletonBox width="24%" height={10} borderRadius={999} className="mt-3" />
    </div>
  );
}

function ActivityRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <SkeletonBox width={40} height={40} borderRadius="9999px" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <SkeletonBox width="58%" height={12} borderRadius={999} />
        <SkeletonBox width="42%" height={10} borderRadius={999} className="mt-2.5" />
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCard key={index} />
        ))}
      </div>

      <div className="grid gap-7 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
          <SkeletonBox width="28%" height={20} borderRadius={999} />
          <SkeletonBox width="100%" height={320} borderRadius={24} className="mt-6" />
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
          <SkeletonBox width="42%" height={20} borderRadius={999} />
          <div className="mt-6 space-y-3.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <ActivityRow key={index} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
        <SkeletonBox width="24%" height={20} borderRadius={999} />
        <SkeletonBox width="100%" height={280} borderRadius={24} className="mt-6" />
      </div>
    </div>
  );
}
