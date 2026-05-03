"use client";

export { FilterSidebarSkeleton } from "@/components/ui/skeletons/FilterSidebarSkeleton";
export { ProductCardSkeleton } from "@/components/ui/skeletons/ProductCardSkeleton";
export { ProductDetailSkeleton } from "@/components/ui/skeletons/ProductDetailSkeleton";
export { ProductGridSkeleton } from "@/components/ui/skeletons/ProductGridSkeleton";

export function TableRowSkeleton({
  cols = 5,
  rows = 8,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <td key={colIndex} style={{ padding: "14px 16px" }}>
              <div
                className="skeleton"
                style={{
                  height: colIndex === 0 ? 48 : 14,
                  width: colIndex === 0 ? 48 : "80%",
                  borderRadius: colIndex === 0 ? 6 : 6,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function OrderCardSkeleton() {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1F1F1F",
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div className="skeleton" style={{ height: 14, width: 140 }} />
        <div
          className="skeleton"
          style={{ height: 22, width: 80, borderRadius: 99 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="skeleton"
            style={{ width: 56, height: 70, borderRadius: 6 }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ height: 12, width: 100 }} />
        <div className="skeleton" style={{ height: 12, width: 80 }} />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #1F1F1F",
          marginBottom: 28,
          overflowX: "auto",
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="skeleton"
            style={{
              height: 44,
              width: 120,
              borderRadius: 0,
              marginRight: 4,
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          background: "#111",
          border: "1px solid #1F1F1F",
          borderRadius: 14,
          padding: 28,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              style={{ gridColumn: index === 2 ? "1 / -1" : "auto" }}
            >
              <div
                className="skeleton"
                style={{ height: 11, width: 80, marginBottom: 8 }}
              />
              <div className="skeleton" style={{ height: 44, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return <div className="skeleton" style={{ aspectRatio: "1 / 1", borderRadius: 12 }} />;
}

export function StatCardSkeleton() {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1F1F1F",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        className="skeleton"
        style={{ width: 36, height: 36, borderRadius: 8, marginBottom: 16 }}
      />
      <div
        className="skeleton"
        style={{ height: 28, width: "60%", marginBottom: 8 }}
      />
      <div className="skeleton" style={{ height: 12, width: "40%" }} />
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid #1A1A1A",
        display: "flex",
        gap: 12,
      }}
    >
      <div
        className="skeleton"
        style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div
          className="skeleton"
          style={{ height: 13, width: "70%", marginBottom: 8 }}
        />
        <div className="skeleton" style={{ height: 11, width: "50%" }} />
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div style={{ padding: "20px 0", borderBottom: "1px solid #1F1F1F" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div
          className="skeleton"
          style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div
            className="skeleton"
            style={{ height: 13, width: "30%", marginBottom: 6 }}
          />
          <div className="skeleton" style={{ height: 11, width: "20%" }} />
        </div>
      </div>
      <div
        className="skeleton"
        style={{ height: 13, width: "95%", marginBottom: 6 }}
      />
      <div className="skeleton" style={{ height: 13, width: "80%" }} />
    </div>
  );
}

export function AddressCardSkeleton() {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1F1F1F",
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
      }}
    >
      <div
        className="skeleton"
        style={{ height: 12, width: "30%", marginBottom: 10 }}
      />
      <div
        className="skeleton"
        style={{ height: 15, width: "50%", marginBottom: 8 }}
      />
      <div
        className="skeleton"
        style={{ height: 13, width: "80%", marginBottom: 6 }}
      />
      <div className="skeleton" style={{ height: 13, width: "60%" }} />
    </div>
  );
}
