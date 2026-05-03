"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import { Button, EmptyState, fetchJson, useApi } from "@/components/screens/shared";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { type AdminReviewRecord } from "@/components/screens/admin/shared";

export function AdminReviewsScreen() {
  const [status, setStatus] = useState<"pending" | "approved" | "all">("pending");
  const [lowRating, setLowRating] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ status });
    if (lowRating) params.set("lowRating", "1");
    if (verified) params.set("verified", "1");
    if (hasMedia) params.set("hasMedia", "1");
    return `/api/admin/reviews?${params.toString()}`;
  }, [hasMedia, lowRating, status, verified]);

  const { data, loading, error, refetch } = useApi<AdminReviewRecord[]>(query, []);
  const { confirm } = useConfirmModal();
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"approve" | "delete" | null>(null);

  const approveReview = useDebounceCallback(async (reviewId: string) => {
    try {
      setBusyReviewId(reviewId);
      setBusyAction("approve");
      await fetchJson(`/api/admin/reviews/${reviewId}/approve`, { method: "PUT" });
      toast.success("Review approved");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve review");
    } finally {
      setBusyReviewId(null);
      setBusyAction(null);
    }
  }, 1000);

  const deleteReview = useDebounceCallback(
    async (reviewId: string) => {
      await confirm({
        title: "Reject review?",
        message: "This review will not be published.",
        confirmText: "Reject",
        variant: "warning",
        action: async () => {
          try {
            setBusyReviewId(reviewId);
            setBusyAction("delete");
            await fetchJson("/api/admin/reviews", {
              method: "DELETE",
              body: JSON.stringify({ reviewId }),
            });
            toast.success("Review deleted");
            await refetch();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete review");
            throw error;
          } finally {
            setBusyReviewId(null);
            setBusyAction(null);
          }
        },
      });
    },
    1000,
  );

  const chipClass = (active: boolean) =>
    active
      ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold uppercase text-[#C7D2FE]"
      : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold uppercase text-[#888888]";

  return (
    <AdminShell title="Reviews">
      <div className="space-y-6 lg:space-y-7">
        <div className="flex flex-wrap gap-3">
          {(["pending", "approved", "all"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setStatus(item)} className={chipClass(status === item)}>
              {item}
            </button>
          ))}
          <button type="button" onClick={() => setLowRating((value) => !value)} className={chipClass(lowRating)}>
            Low Rating
          </button>
          <button type="button" onClick={() => setVerified((value) => !value)} className={chipClass(verified)}>
            Verified
          </button>
          <button type="button" onClick={() => setHasMedia((value) => !value)} className={chipClass(hasMedia)}>
            Media
          </button>
        </div>

        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-[24px] border border-[#1F1F1F] bg-[#111111]" />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="Reviews unavailable" description={error} />
        ) : data.length ? (
          <div className="space-y-5">
            {data.map((review) => (
              <div key={review._id} className="rounded-[24px] border border-white/10 bg-[#111111] p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-[#888888]">{review.product?.title || "Product"}</p>
                      {review.isVerifiedPurchase ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                          Verified
                        </span>
                      ) : null}
                      {review.images?.length ? (
                        <span className="rounded-full bg-[#4F46E5]/14 px-3 py-1 text-[11px] font-semibold text-[#C7D2FE]">
                          {review.images.length} media
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold text-white">{review.title}</h3>
                    <p className="text-sm leading-7 text-[#BDBDBD]">{review.comment}</p>
                    <p className="text-xs text-[#666666]">
                      By {review.user?.name || "Customer"}
                      {review.user?.email ? ` · ${review.user.email}` : ""}
                      {review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <span className="rounded-full bg-[#6366F1]/12 px-3 py-1 text-xs font-semibold text-[#C7D2FE]">
                      {review.rating}/5
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {!review.isApproved ? (
                        <Button type="button" loading={busyReviewId === review._id && busyAction === "approve"} loadingText="Approving..." onClick={() => void approveReview(review._id)}>
                          Approve
                        </Button>
                      ) : null}
                      <Button type="button" variant="danger" loading={busyReviewId === review._id && busyAction === "delete"} loadingText="Rejecting..." onClick={() => void deleteReview(review._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No reviews found" />
        )}
      </div>
    </AdminShell>
  );
}
