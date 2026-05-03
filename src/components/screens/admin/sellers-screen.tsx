"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Button, EmptyState, fetchJson } from "@/components/screens/shared";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { formatCurrency } from "@/lib/utils";
import { SellerRecord, tableCell, tableHead, tableWrap, timeAgo } from "@/components/screens/admin/shared";

function PendingSellerCard({
  seller,
  rejectingSellerId,
  rejectReason,
  setRejectReason,
  setRejectingSellerId,
  setSellerToApprove,
  setConfirmOpen,
  busySellerId,
  reject,
}: {
  seller: SellerRecord;
  rejectingSellerId: string | null;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  setRejectingSellerId: (value: string | null) => void;
  setSellerToApprove: (value: SellerRecord | null) => void;
  setConfirmOpen: (value: boolean) => void;
  busySellerId: string | null;
  reject: (sellerId: string) => Promise<void>;
}) {
  return (
    <div
      key={seller._id}
      id={`seller-${seller._id}`}
      className="rounded-2xl border border-[#1F1F1F] border-l-[3px] border-l-[#6366F1] bg-[#111111] p-4 sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-white">{seller.shopName}</h3>
          <p className="mt-1 text-sm text-[#888888]">
            {seller.user?.name || "Seller"} • {seller.user?.email || "No email"}
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <Badge variant="warning">PENDING</Badge>
          <span className="text-[11px] text-[#555555]">{timeAgo(seller.appliedAt)}</span>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Category", seller.shopCategory || "Not specified"],
          ["Phone", seller.phone || "—"],
          ["Business", seller.businessType || "individual"],
          ["GST", seller.gstNumber || "Not provided"],
          ["Bank", seller.bankDetails?.bankName || "—"],
          ["IFSC", seller.bankDetails?.ifscCode || "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#555555]">{label}</p>
            <p className="mt-1 truncate text-sm text-[#888888]">{value}</p>
          </div>
        ))}
      </div>

      {seller.description ? (
        <div className="mb-4 rounded-lg bg-[#0A0A0A] px-3 py-3">
          <p className="text-sm leading-6 text-[#888888]">{seller.description}</p>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {["Incomplete info", "Invalid GST", "Poor description", "Suspicious activity"].map((reason) => (
          <button
            key={reason}
            type="button"
            onClick={() => setRejectReason(reason)}
            className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-xs text-[#888888]"
          >
            {reason}
          </button>
        ))}
      </div>

      {rejectingSellerId === seller._id ? (
        <div className="mb-4 rounded-2xl border border-[#1F1F1F] bg-black/20 p-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Explain why this application is being rejected..."
            className="w-full rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3 text-sm text-white outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              loading={busySellerId === seller._id}
              loadingText="Rejecting..."
              className="bg-red-500 text-white hover:brightness-95"
              onClick={() => void reject(seller._id)}
            >
              Submit Rejection
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setRejectingSellerId(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-[#1A1A1A] pt-4 sm:flex-row">
        <button
          onClick={() => {
            setSellerToApprove(seller);
            setConfirmOpen(true);
          }}
          className="h-10 flex-1 rounded-lg border border-green-500/30 bg-green-500/10 text-sm font-bold text-green-400"
        >
          Approve
        </button>
        <button
          onClick={() => {
            setRejectingSellerId(seller._id);
            setRejectReason("");
          }}
          className="h-10 flex-1 rounded-lg border border-red-500/30 bg-red-500/10 text-sm font-bold text-red-400"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export function AdminSellersScreen() {
  const { confirm } = useConfirmModal();
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [sellerToApprove, setSellerToApprove] = useState<SellerRecord | null>(null);
  const [rejectingSellerId, setRejectingSellerId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busySellerId, setBusySellerId] = useState<string | null>(null);

  const fetchSellers = async (status: "pending" | "approved" | "rejected" = activeTab) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/sellers?status=${status}`);
      const json = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: {
          sellers: SellerRecord[];
          counts: { pending: number; approved: number; rejected: number };
        };
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message || "Failed to fetch sellers");
      }

      setSellers(json.data.sellers || []);
      setCounts(json.data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch sellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSellers(activeTab);
  }, [activeTab]);

  const approve = async () => {
    if (!sellerToApprove) return;
    setConfirmLoading(true);
    try {
      const response = await fetchJson(`/api/admin/sellers/${sellerToApprove._id}/approve`, { method: "PUT" });
      toast.success(response.message || "Seller approved");
      setConfirmOpen(false);
      setSellerToApprove(null);
      await fetchSellers(activeTab);
      window.dispatchEvent(new Event("notification-refresh"));
    } catch (approveError) {
      toast.error(approveError instanceof Error ? approveError.message : "Failed to approve seller");
    } finally {
      setConfirmLoading(false);
    }
  };

  const reject = async (sellerId: string) => {
    if (rejectReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }

    await confirm({
      title: "Reject seller application?",
      message: "This seller will be notified of the rejection.",
      confirmText: "Reject",
      variant: "warning",
      action: async () => {
        try {
          setBusySellerId(sellerId);
          const response = await fetchJson(`/api/admin/sellers/${sellerId}/reject`, {
            method: "PUT",
            body: JSON.stringify({ reason: rejectReason.trim() }),
          });
          toast.success(response.message || "Seller rejected");
          setRejectingSellerId(null);
          setRejectReason("");
          await fetchSellers(activeTab);
          window.dispatchEvent(new Event("notification-refresh"));
        } catch (rejectError) {
          toast.error(rejectError instanceof Error ? rejectError.message : "Failed to reject seller");
          throw rejectError;
        } finally {
          setBusySellerId(null);
        }
      },
    });
  };

  const toggleSeller = async (seller: SellerRecord) => {
    try {
      setBusySellerId(seller._id);
      const response = await fetchJson(`/api/admin/sellers/${seller._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !seller.isActive }),
      });
      toast.success(response.message || "Seller updated");
      await fetchSellers(activeTab);
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : "Failed to update seller");
    } finally {
      setBusySellerId(null);
    }
  };

  const allowReapply = async (seller: SellerRecord) => {
    try {
      setBusySellerId(seller._id);
      const response = await fetchJson(`/api/admin/sellers/${seller._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ allowReapply: true }),
      });
      toast.success(response.message || "Seller can reapply now");
      await fetchSellers(activeTab);
    } catch (reapplyError) {
      toast.error(reapplyError instanceof Error ? reapplyError.message : "Failed to allow reapply");
    } finally {
      setBusySellerId(null);
    }
  };

  return (
    <AdminShell
      title="Sellers"
      action={
        <span className="rounded-full bg-[#4F46E5]/14 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C7D2FE]">
          {counts.pending} pending
        </span>
      }
    >
      <div className="mb-5 flex flex-wrap gap-3">
        {([
          ["pending", `Pending (${counts.pending})`],
          ["approved", `Approved (${counts.approved})`],
          ["rejected", `Rejected (${counts.rejected})`],
        ] as const).map(([item, label]) => (
          <button
            key={item}
            type="button"
            onClick={() => setActiveTab(item)}
            className={
              activeTab === item
                ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold uppercase text-[#C7D2FE]"
                : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold uppercase text-[#888888]"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-[420px] animate-pulse rounded-3xl border border-[#1F1F1F] bg-[#111111]" />
      ) : error ? (
        <EmptyState title="Sellers unavailable" description={error} />
      ) : null}

      {!loading && !error && activeTab === "pending" ? (
        sellers.length ? (
          <div className="grid gap-4">
            {sellers.map((seller) => (
              <PendingSellerCard
                key={seller._id}
                seller={seller}
                rejectingSellerId={rejectingSellerId}
                rejectReason={rejectReason}
                setRejectReason={setRejectReason}
                setRejectingSellerId={setRejectingSellerId}
                setSellerToApprove={setSellerToApprove}
                setConfirmOpen={setConfirmOpen}
                busySellerId={busySellerId}
                reject={reject}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No pending applications" />
        )
      ) : null}

      {!loading && !error && activeTab === "approved" ? (
        tableWrap(
          sellers.length ? (
            <>
              <div className="grid gap-4 p-4 md:hidden">
                {sellers.map((seller) => (
                  <div key={seller._id} className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4F46E5] text-sm font-bold text-[#F8FAFC]">
                          {seller.shopName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{seller.shopName}</p>
                          <p className="text-xs text-[#666666]">{seller.shopCategory || "General"}</p>
                        </div>
                      </div>
                      <Badge variant={seller.isActive ? "success" : "default"}>
                        {seller.isActive ? "ACTIVE" : "PAUSED"}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Owner</p>
                        <p className="mt-1 text-white">{seller.user?.name || "-"}</p>
                        <p className="mt-1 text-xs text-[#888888]">{seller.user?.email || "-"}</p>
                      </div>
                      <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Products</p>
                        <p className="mt-1 text-white">{seller.productCount || 0}</p>
                      </div>
                      <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Earnings</p>
                        <p className="mt-1 text-white">{formatCurrency(seller.totalEarnings || 0)}</p>
                      </div>
                      <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Approved</p>
                        <p className="mt-1 text-white">
                          {seller.approvedAt ? new Date(seller.approvedAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        loading={busySellerId === seller._id}
                        loadingText={seller.isActive ? "Saving..." : "Saving..."}
                        className="h-10 px-3"
                        onClick={() => void toggleSeller(seller)}
                      >
                        {seller.isActive ? "Suspend" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {tableHead("Shop")}
                      {tableHead("Owner")}
                      {tableHead("Products")}
                      {tableHead("Earnings")}
                      {tableHead("Date")}
                      {tableHead("Actions")}
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((seller) => (
                      <tr key={seller._id} className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A]">
                        {tableCell(
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4F46E5] text-sm font-bold text-[#F8FAFC]">
                              {seller.shopName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{seller.shopName}</p>
                              <p className="text-xs text-[#666666]">{seller.shopCategory || "General"}</p>
                            </div>
                          </div>,
                        )}
                        {tableCell(
                          <div>
                            <p>{seller.user?.name || "-"}</p>
                            <p className="text-xs text-[#888888]">{seller.user?.email || "-"}</p>
                          </div>,
                        )}
                        {tableCell(seller.productCount || 0)}
                        {tableCell(formatCurrency(seller.totalEarnings || 0))}
                        {tableCell(seller.approvedAt ? new Date(seller.approvedAt).toLocaleDateString() : "-")}
                        {tableCell(
                          <Button
                            type="button"
                            variant="secondary"
                            loading={busySellerId === seller._id}
                            loadingText={seller.isActive ? "Saving..." : "Saving..."}
                            className="h-10 px-3"
                            onClick={() => void toggleSeller(seller)}
                          >
                            {seller.isActive ? "Suspend" : "Activate"}
                          </Button>,
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyState title="No approved sellers" />
            </div>
          ),
        )
      ) : null}

      {!loading && !error && activeTab === "rejected" ? (
        sellers.length ? (
          <div className="grid gap-4">
            {sellers.map((seller) => (
              <div key={seller._id} className="rounded-2xl border border-red-500/20 bg-[#111111] p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white sm:text-xl">{seller.shopName}</h3>
                    <p className="text-sm text-[#888888]">
                      {seller.user?.name || "Seller"} • {seller.user?.email || "No email"}
                    </p>
                  </div>
                  <span className="text-xs text-[#666666]">
                    Rejected {seller.rejectedAt ? new Date(seller.rejectedAt).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-7 text-[#FCA5A5]">
                  {seller.rejectionReason || "No reason provided."}
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busySellerId === seller._id}
                    loadingText="Saving..."
                    onClick={() => void allowReapply(seller)}
                  >
                    Allow Reapply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No rejected applications" />
        )
      ) : null}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          if (!confirmLoading) {
            setConfirmOpen(false);
            setSellerToApprove(null);
          }
        }}
        onConfirm={approve}
        title={sellerToApprove ? `Approve ${sellerToApprove.shopName}?` : "Approve Seller"}
        message={
          sellerToApprove
            ? `${sellerToApprove.user?.name || "This seller"} will get seller access immediately and can start listing products on StyleHub.`
            : "Approve this seller application?"
        }
        confirmLabel="Yes, Approve"
        variant="info"
        loading={confirmLoading}
        loadingLabel="Approving..."
      />
    </AdminShell>
  );
}
