"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,#0F1220_0%,#0B0E18_100%)] xl:rounded-[20px]">
      <div className="relative h-[220px] w-full sm:h-[260px] lg:h-[300px]">
        <SkeletonBox
          className="absolute inset-0 w-full rounded-none rounded-t-[18px] xl:rounded-t-[20px]"
          height="100%"
          borderRadius={0}
        />
      </div>
      <div className="space-y-2.5 px-3.5 pb-4 pt-3.5 xl:px-4 xl:pb-4.5">
        <SkeletonBox width="34%" height={10} borderRadius={999} />
        <div className="space-y-2">
          <SkeletonBox width="88%" height={14} borderRadius={6} />
          <SkeletonBox width="70%" height={14} borderRadius={6} />
        </div>
        <SkeletonBox width="44%" height={16} borderRadius={6} />
        <SkeletonBox width={72} height={20} borderRadius={999} />
        <SkeletonBox width="30%" height={11} borderRadius={6} />
      </div>
    </div>
  );
}
