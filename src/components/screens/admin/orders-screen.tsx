"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import TrackingModal from "@/components/admin/TrackingModal";
import Pagination from "@/components/ui/Pagination";
import { TableRowSkeleton } from "@/components/ui/Skeletons";
import { EmptyState, fetchJson, type Order, useApi } from "@/components/screens/shared";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { canTransition, VALID_TRANSITIONS } from "@/lib/orderStatus";
import { formatCurrency } from "@/lib/utils";
import {
  statusBadge,
  tableCell,
  tableHead,
  tableWrap,
  type PaginatedOrders,
} from "@/components/screens/admin/shared";

function formatPaymentMethod(paymentMethod: string) {
  switch (paymentMethod) {
    case "upi":
      return "UPI";
    case "credit_card":
      return "Credit Card";
    case "cod":
      return "Cash on Delivery";
    default:
      return paymentMethod.toUpperCase();
  }
}

function renderPaymentDetails(order: Order) {
  if (order.paymentMethod === "upi" && order.paymentDetails?.upi?.upiId) {
    return <p className="mt-1 text-xs text-[#888888]">{order.paymentDetails.upi.upiId}</p>;
  }

  if (order.paymentMethod === "credit_card" && order.paymentDetails?.creditCard) {
    return (
      <div className="mt-1 space-y-1 text-xs text-[#888888]">
        <p>{order.paymentDetails.creditCard.cardholderName}</p>
        <p>
          {order.paymentDetails.creditCard.cardNumberMasked} / {order.paymentDetails.creditCard.expiryMonth}
          /{order.paymentDetails.creditCard.expiryYear}
        </p>
      </div>
    );
  }

  return null;
}

export function AdminOrdersScreen() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const limit = 20;

  const { data, loading, error, refetch } = useApi<PaginatedOrders>(
    `/api/admin/orders?page=${page}&limit=${limit}`,
    { orders: [], total: 0, page: 1, totalPages: 1 },
  );

  const filtered = data.orders.filter(
    (order) => tab === "all" || order.orderStatus === tab,
  );

  const updateStatus = useDebounceCallback(
    async (
      order: Order,
      status: string,
      extra?: { trackingNumber?: string; carrier?: string },
    ) => {
      if (!canTransition(order.orderStatus, status)) {
        toast.error(`Cannot change from ${order.orderStatus} to ${status}`);
        return;
      }
      setUpdatingId(order._id);
      try {
        const response = await fetchJson(`/api/admin/orders/${order._id}/status`, {
          method: "PUT",
          body: JSON.stringify({
            status,
            trackingNumber: extra?.trackingNumber,
            carrier: extra?.carrier,
          }),
        });
        toast.success(response.message || "Order updated");
        await refetch();
      } catch (errorValue) {
        toast.error(
          errorValue instanceof Error ? errorValue.message : "Failed to update order",
        );
      } finally {
        setUpdatingId(null);
      }
    },
    1000,
  );

  const renderStatusSelect = (order: Order) => {
    const validNext = VALID_TRANSITIONS[order.orderStatus] || [];

    return (
      <div>
        <select
          value={order.orderStatus}
          disabled={updatingId === order._id || validNext.length === 0}
          onChange={(event) => {
            const newStatus = event.target.value;
            if (newStatus === "shipped") {
              setTrackingModal({
                isOpen: true,
                orderId: order._id,
                orderNumber: order.orderNumber,
              });
              return;
            }
            void updateStatus(order, newStatus);
          }}
          className="h-10 w-full rounded-lg border border-[#1F1F1F] bg-[#111111] px-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value={order.orderStatus}>{order.orderStatus} (current)</option>
          {validNext.map((status) => (
            <option key={status} value={status}>
              → {status}
            </option>
          ))}
        </select>
        {updatingId === order._id ? (
          <span className="mt-2 flex items-center gap-1 text-[11px] text-[#888888]">
            <span className="inline-block h-[10px] w-[10px] animate-spin rounded-full border-2 border-[#818CF8] border-t-transparent" />
            Updating...
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <AdminShell title="Orders">
      <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-wrap gap-3">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                tab === item
                ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold uppercase text-[#C7D2FE]"
                  : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold uppercase text-[#888888]"
              }
            >
              {item}
            </button>
          ),
        )}
      </div>

      {tableWrap(
        loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {tableHead("Order #")}
                  {tableHead("Customer")}
                  {tableHead("Items")}
                  {tableHead("Total")}
                  {tableHead("Payment")}
                  {tableHead("Status")}
                  {tableHead("Date")}
                  {tableHead("Actions")}
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton cols={8} rows={limit} />
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="p-6">
            <EmptyState title="Orders unavailable" description={error} />
          </div>
        ) : filtered.length ? (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtered.map((order) => (
                <div
                  key={order._id}
                  className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        #{order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-[#888888]">
                        {order.user?.name || order.user?.email || "Customer"}
                      </p>
                      <p className="mt-2 text-xs text-[#666666]">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    <div className="text-right">
                    <p className="text-sm font-semibold text-[#C7D2FE]">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="mt-1 text-xs text-[#888888]">
                        {order.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusBadge(order.paymentStatus)}
                    {statusBadge(order.orderStatus)}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-[#888888]">{formatPaymentMethod(order.paymentMethod)}</p>
                    {renderPaymentDetails(order)}
                  </div>
                  <div className="mt-4">{renderStatusSelect(order)}</div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead>
                  <tr>
                    {tableHead("Order #")}
                    {tableHead("Customer")}
                    {tableHead("Items")}
                    {tableHead("Total")}
                    {tableHead("Payment")}
                    {tableHead("Status")}
                    {tableHead("Date")}
                    {tableHead("Actions")}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A]"
                    >
                      {tableCell(order.orderNumber)}
                      {tableCell(order.user?.name || order.user?.email || "Customer")}
                      {tableCell(order.items.length)}
                      {tableCell(formatCurrency(order.total))}
                      {tableCell(
                        <div className="space-y-1">
                          <p>{formatPaymentMethod(order.paymentMethod)}</p>
                          {renderPaymentDetails(order)}
                          {statusBadge(order.paymentStatus)}
                        </div>,
                      )}
                      {tableCell(statusBadge(order.orderStatus))}
                      {tableCell(
                        order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "-",
                      )}
                      {tableCell(renderStatusSelect(order))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No orders yet"
            />
          </div>
        ),
      )}

      <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        totalItems={data.total}
        itemsPerPage={limit}
        onPageChange={setPage}
      />
      </div>

      <TrackingModal
        isOpen={Boolean(trackingModal?.isOpen)}
        orderId={trackingModal?.orderId || ""}
        orderNumber={trackingModal?.orderNumber || ""}
        loading={Boolean(updatingId && trackingModal?.orderId === updatingId)}
        onClose={() => setTrackingModal(null)}
        onConfirm={(trackingNumber, carrier) => {
          const order = filtered.find((item) => item._id === trackingModal?.orderId);
          if (!order || !trackingModal) return;
          setTrackingModal(null);
          void updateStatus(order, "shipped", { trackingNumber, carrier });
        }}
      />
    </AdminShell>
  );
}
