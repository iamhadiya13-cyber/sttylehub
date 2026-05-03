"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
  brand?: string;
  selectedColor?: string;
  badge?: string;
  priority?: boolean;
}

export default function ProductGallery({
  images,
  productTitle,
  brand,
  selectedColor,
  badge,
  priority = false,
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const validImages = images.filter(Boolean);
  const total = validImages.length;

  const goTo = useCallback((index: number, dir = 0) => {
    setDirection(dir);
    setCurrentIndex(index);
    setIsZoomed(false);
  }, []);

  const goPrev = useCallback(() => {
    const newIndex = currentIndex === 0 ? total - 1 : currentIndex - 1;
    goTo(newIndex, -1);
  }, [currentIndex, total, goTo]);

  const goNext = useCallback(() => {
    const newIndex = currentIndex === total - 1 ? 0 : currentIndex + 1;
    goTo(newIndex, 1);
  }, [currentIndex, total, goTo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const diffX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (diffX > diffY && diffX > 10) {
      isDragging.current = true;
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 50 && isDragging.current) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  if (total === 0) {
    return (
      <div
        style={{
          aspectRatio: "4 / 5",
          background: "#111",
          border: "1px solid #1F1F1F",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#333",
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        {productTitle[0]?.toUpperCase()}
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div
        className="product-gallery"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 5",
          borderRadius: 12,
          overflow: "hidden",
          background: "#111",
          border: "1px solid #1F1F1F",
          cursor: isZoomed ? "zoom-out" : "zoom-in",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onClick={() => setIsZoomed((value) => !value)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.15 },
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <Image
              src={validImages[currentIndex]}
              alt={`${productTitle} by ${brand || "StyleHub"}${selectedColor ? ` in ${selectedColor}` : ""}`}
              fill
              draggable={false}
              priority={priority}
              sizes="(max-width: 768px) 92vw, (max-width: 1280px) 52vw, 40vw"
              style={{
                objectFit: "cover",
                objectPosition: "center top",
                transform: isZoomed ? "scale(2)" : "scale(1)",
                transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : "center",
                transition: isZoomed ? "transform 0s" : "transform 0.3s ease",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {badge ? (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 10,
              background:
                badge === "SOLD OUT"
                  ? "rgba(0,0,0,0.8)"
                  : badge === "NEW"
                    ? "#6366F1"
                    : "#FF4500",
              color: "#F8FAFC",
              fontSize: 10,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 4,
              letterSpacing: 1,
            }}
          >
            {badge}
          </div>
        ) : null}

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s",
              }}
              className="gallery-arrow"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s",
              }}
              className="gallery-arrow"
            >
              ›
            </button>
          </>
        ) : null}

        {total > 1 ? (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
              zIndex: 10,
            }}
          >
            {validImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i, i > currentIndex ? 1 : -1);
                }}
                style={{
                  width: i === currentIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: i === currentIndex ? "#818CF8" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        ) : null}

        {total > 1 ? (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 99,
              zIndex: 10,
            }}
          >
            {currentIndex + 1}/{total}
          </div>
        ) : null}

        {!isZoomed ? (
          <div
            className="zoom-hint"
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              background: "rgba(0,0,0,0.5)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 4,
              zIndex: 10,
            }}
          >
            Hover to zoom
          </div>
        ) : null}
      </div>

      {total > 1 ? (
        <div
          className="thumbnail-strip"
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {validImages.map((url, i) => (
            <button
              key={`${url}${i}`}
              type="button"
              onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
              style={{
                flexShrink: 0,
                width: 64,
                height: 80,
                borderRadius: 8,
                overflow: "hidden",
                border: i === currentIndex ? "2px solid #818CF8" : "2px solid transparent",
                cursor: "pointer",
                background: "#111",
                padding: 0,
                transition: "border-color 0.15s",
                opacity: i === currentIndex ? 1 : 0.6,
              }}
            >
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <Image
                  src={url}
                  alt={`${productTitle} by ${brand || "StyleHub"} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                    display: "block",
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <style>{`
        @media (hover: hover) {
          .product-gallery:hover .gallery-arrow {
            opacity: 1 !important;
          }
          .zoom-hint {
            display: block;
          }
        }

        @media (max-width: 768px) {
          .zoom-hint {
            display: none !important;
          }
          .gallery-arrow {
            display: none !important;
          }
        }

        .thumbnail-strip::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
