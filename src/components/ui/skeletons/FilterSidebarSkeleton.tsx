"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export function FilterSidebarSkeleton() {
  return (
    <aside className="hidden w-[280px] shrink-0 md:block">
      <div className="sticky top-20 rounded-xl border border-[#1F1F1F] bg-[#111111] p-5">
        <div className="space-y-4">
          <div className="space-y-3">
            <SkeletonBox width={96} height={12} borderRadius={6} />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBox height={48} borderRadius={10} />
              <SkeletonBox height={48} borderRadius={10} />
            </div>
          </div>

          <div className="space-y-3">
            <SkeletonBox width={74} height={12} borderRadius={6} />
            <div className="flex gap-2">
              <SkeletonBox width={72} height={36} borderRadius={999} />
              <SkeletonBox width={88} height={36} borderRadius={999} />
              <SkeletonBox width={84} height={36} borderRadius={999} />
            </div>
          </div>

          <div className="space-y-3">
            <SkeletonBox width={88} height={12} borderRadius={6} />
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <SkeletonBox width={16} height={16} borderRadius={4} />
                  <SkeletonBox width={`${52 + (index % 3) * 12}%`} height={12} borderRadius={6} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
