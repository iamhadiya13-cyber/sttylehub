"use client";

import type { CSSProperties } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showInfo?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showInfo = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: Array<number | "..."> = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    pages.push(1);

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let index = start; index <= end; index += 1) {
      pages.push(index);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  };

  const pages = getPages();

  const btnBase: CSSProperties = {
    height: 36,
    minWidth: 36,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10px",
    transition: "all 0.15s",
    border: "1px solid #2A2A2A",
    background: "transparent",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 32,
        padding: "16px 0",
        borderTop: "1px solid #1F1F1F",
      }}
    >
      {showInfo && totalItems && itemsPerPage ? (
        <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
          Showing <span style={{ color: "#888" }}>{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
          <span style={{ color: "#888" }}>{totalItems}</span> results
        </p>
      ) : <span />}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            ...btnBase,
            color: currentPage === 1 ? "#333" : "#888",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            borderColor: currentPage === 1 ? "#1A1A1A" : "#2A2A2A",
          }}
        >
          ← Prev
        </button>

        {pages.map((page, index) =>
          page === "..." ? (
            <span
              key={`dots-${index}`}
              style={{ color: "#555", fontSize: 13, padding: "0 4px" }}
            >
              •••
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                ...btnBase,
                background: currentPage === page ? "rgba(79,70,229,0.14)" : "transparent",
                color: currentPage === page ? "#C7D2FE" : "#888",
                borderColor: currentPage === page ? "#6366F1" : "#2A2A2A",
                fontWeight: currentPage === page ? 700 : 500,
              }}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            ...btnBase,
            color: currentPage === totalPages ? "#333" : "#888",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            borderColor: currentPage === totalPages ? "#1A1A1A" : "#2A2A2A",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
