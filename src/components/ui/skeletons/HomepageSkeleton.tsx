"use client";

import { ProductCardSkeleton } from "@/components/ui/skeletons/ProductCardSkeleton";
import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

function RailSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <section className="mx-auto max-w-[1340px] space-y-5 px-4 py-10 sm:px-6 lg:px-8">
      <SkeletonBox width={titleWidth} height={14} borderRadius={6} />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={index >= 2 ? "hidden lg:block lg:min-w-[calc((100%-48px)/4)]" : "min-w-[calc((100%-16px)/2)] lg:min-w-[calc((100%-48px)/4)]"}>
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid min-h-[300px] gap-8 overflow-hidden rounded-[28px] border border-[#1F1F1F] bg-[#111111] p-6 sm:min-h-[380px] lg:min-h-[500px] lg:grid-cols-[1.05fr,0.95fr] lg:p-10">
          <div className="flex flex-col justify-center gap-5">
            <div className="space-y-3">
              <SkeletonBox width="68%" height={18} borderRadius={8} />
              <SkeletonBox width="82%" height={44} borderRadius={10} />
              <SkeletonBox width="58%" height={44} borderRadius={10} />
            </div>
            <div className="flex gap-3">
              <SkeletonBox width={132} height={44} borderRadius={999} />
              <SkeletonBox width={124} height={44} borderRadius={999} />
            </div>
          </div>
          <div className="hidden lg:flex lg:items-center lg:justify-end">
            <SkeletonBox width="88%" height={320} borderRadius={24} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1340px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBox key={index} className="aspect-square w-full rounded-xl" height="auto" borderRadius={12} />
          ))}
        </div>
      </section>

      <RailSkeleton titleWidth="22%" />
      <RailSkeleton titleWidth="18%" />

      <section className="mx-auto max-w-[1340px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[28px] border border-[#1F1F1F] bg-[#111111] p-6 lg:grid-cols-[1fr,340px] lg:items-center">
          <div className="space-y-4">
            <SkeletonBox width="26%" height={14} borderRadius={6} />
            <SkeletonBox width="62%" height={34} borderRadius={10} />
            <SkeletonBox width="74%" height={14} borderRadius={6} />
          </div>
          <SkeletonBox width="100%" height={180} borderRadius={22} />
        </div>
      </section>
    </div>
  );
}
