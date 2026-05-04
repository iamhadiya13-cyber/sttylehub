/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ruler, X } from "lucide-react";
import { resolveSizeGuide } from "@/lib/size-guide-data";

type SizeGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedSize?: string;
  fitNotes?: string;
  category?: string;
};

type TabKey = "measurements" | "how-to-measure" | "fit-notes";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "measurements", label: "Measurements" },
  { key: "how-to-measure", label: "How to Measure" },
  { key: "fit-notes", label: "Fit Notes" },
];

function matchesSelectedSize(rowLabel: string, selectedSize?: string) {
  if (!selectedSize) {
    return false;
  }

  const normalizedSelected = selectedSize.trim().toUpperCase();
  const normalizedRow = rowLabel.trim().toUpperCase();

  if (normalizedRow === normalizedSelected) {
    return true;
  }

  return normalizedRow
    .split("/")
    .map((value) => value.trim())
    .some((value) => value === normalizedSelected || value.replace(/^UK\s+/, "") === normalizedSelected);
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  selectedSize,
  fitNotes,
  category,
}: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("measurements");
  const guide = resolveSizeGuide(category);
  const resolvedFitNote = fitNotes?.trim() || guide.fitNote;

  // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the modal should reset the active tab for the next open
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("measurements");
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-full w-full flex-col overflow-hidden bg-[#0D0D0F] text-white sm:h-auto sm:max-h-[88vh] sm:max-w-3xl sm:rounded-[28px] sm:border sm:border-white/10"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Size guide"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7F77DD]/14 text-[#C7C2FF]">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A5B4FC]">Size Guide</p>
                  <p className="text-sm text-[#B9B9C7]">Find the best fit before you buy.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 p-2 text-[#B9B9C7] transition hover:border-[#7F77DD]/45 hover:text-white"
                aria-label="Close size guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto border-b border-white/10 px-5 sm:px-6">
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative whitespace-nowrap pb-4 pt-4 text-sm font-semibold transition ${
                      active ? "text-white" : "text-[#8D8D98] hover:text-white"
                    }`}
                  >
                    {tab.label}
                    {active ? <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#7F77DD]" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {activeTab === "measurements" ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111114]">
                  {guide.type === "table" ? (
                    <div className="max-h-[58vh] overflow-auto">
                      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-[#131318] text-[11px] uppercase tracking-[0.18em] text-[#A5A5B8]">
                          <tr>
                            {guide.columns.map((column) => (
                              <th key={column} className="px-4 py-3 font-semibold">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {guide.rows.map((row, index) => {
                            const highlighted = matchesSelectedSize(row[0], selectedSize);
                            return (
                              <tr
                                key={row[0]}
                                className={
                                  highlighted
                                    ? "bg-[#7F77DD]/14 text-white"
                                    : index % 2 === 0
                                      ? "bg-[#0F0F12] text-[#D9D9E3]"
                                      : "bg-[#141419] text-[#D9D9E3]"
                                }
                              >
                                {row.map((value, cellIndex) => (
                                  <td
                                    key={`${row[0]}-${guide.columns[cellIndex]}`}
                                    className={`px-4 py-3 ${cellIndex === 0 ? "font-semibold" : ""}`}
                                  >
                                    {value}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-5 text-sm leading-7 text-[#C9C9D6] sm:p-6">{guide.note}</div>
                  )}
                </div>
              ) : null}

              {activeTab === "how-to-measure" ? (
                <div className="space-y-4">
                  {guide.instructions.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-[#111114] p-4">
                      <div className="border-l-2 border-[#7F77DD] pl-4">
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="mt-2 text-sm leading-6 text-[#B9B9C7]">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "fit-notes" ? (
                <div className="rounded-2xl border border-white/10 bg-[#111114] p-5 text-sm leading-7 text-[#C9C9D6]">
                  {resolvedFitNote}
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
