"use client";

import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-16 px-6 py-16">
      <section className="grid gap-6 md:gap-[60px] md:grid-cols-2">
        <div className="w-full space-y-3">
          <SkeletonBox
            className="w-full rounded-[18px] lg:rounded-[22px]"
            height={320}
            borderRadius={22}
          />
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBox
                key={index}
                className="aspect-square w-full rounded-xl"
                height="auto"
                borderRadius={12}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <SkeletonBox width="22%" height={11} borderRadius={6} />
          <div className="space-y-2">
            <SkeletonBox width="82%" height={30} borderRadius={8} />
            <SkeletonBox width="56%" height={30} borderRadius={8} />
          </div>
          <SkeletonBox width="60%" height={34} borderRadius={10} />
          <SkeletonBox width="100%" height={1} borderRadius={1} className="opacity-50" />

          <div className="space-y-3">
            <SkeletonBox width={96} height={12} borderRadius={6} />
            <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonBox key={index} className="h-[46px] w-full sm:w-[58px] rounded-lg" height={46} borderRadius={10} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <SkeletonBox width={72} height={12} borderRadius={6} />
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBox key={index} width={40} height={40} borderRadius="999px" />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <SkeletonBox width={94} height={12} borderRadius={6} />
            <SkeletonBox width={140} height={46} borderRadius={10} />
          </div>

          <SkeletonBox width={116} height={13} borderRadius={6} />
          <SkeletonBox width="100%" height={50} borderRadius={12} />
          <SkeletonBox width="100%" height={46} borderRadius={12} />
        </div>
      </section>
    </div>
  );
}
