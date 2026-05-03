"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export function ReviewsSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border-b border-[#1F1F1F] py-5 last:border-b-0">
          <div className="flex items-start gap-3">
            <SkeletonBox width={40} height={40} borderRadius="999px" />
            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <SkeletonBox width={120} height={13} borderRadius={6} />
                <SkeletonBox width={92} height={12} borderRadius={6} />
              </div>
              <SkeletonBox width={88} height={12} borderRadius={6} />
              <div className="space-y-2">
                <SkeletonBox width="92%" height={13} borderRadius={6} />
                <SkeletonBox width="74%" height={13} borderRadius={6} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
