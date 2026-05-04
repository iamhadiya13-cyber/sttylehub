"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

const SKELETON_STYLE_ID = "stylehub-skeleton-shimmer";
const SKELETON_ANIMATION_NAME = "stylehubSkeletonShimmer";

export const shimmerCss = `
@keyframes ${SKELETON_ANIMATION_NAME} {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;

type SkeletonBoxProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  className?: string;
};

export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 12,
  className,
}: SkeletonBoxProps) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (document.getElementById(SKELETON_STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = SKELETON_STYLE_ID;
    style.textContent = shimmerCss;
    document.head.appendChild(style);

    return () => {
      if (document.getElementById(SKELETON_STYLE_ID) === style) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn("overflow-hidden", className)}
      style={{
        width,
        height,
        borderRadius,
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: `${SKELETON_ANIMATION_NAME} 1.8s ease-in-out infinite`,
      }}
    />
  );
}
