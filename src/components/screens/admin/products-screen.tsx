"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import Pagination from "@/components/ui/Pagination";
import { TableRowSkeleton } from "@/components/ui/Skeletons";
import { Button, EmptyState, fallbackImage, fetchJson, TextInput, type Product, useApi } from "@/components/screens/shared";
import { useButtonLoading } from "@/hooks/useButtonLoading";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { formatCurrency } from "@/lib/utils";
import { tableCell, tableHead, tableWrap, type PaginatedProducts } from "@/components/screens/admin/shared";
import { useLoadingStore } from "@/stores/loading-store";

type BulkAction = "publish" | "unpublish" | "feature" | "unfeature" | "set_priority" | "assign_campaign" | "clear_campaign" | "archive" | "restore";

export function AdminProductsScreen() {
  const [page, setPage] = useState(1);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "featured">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [campaignKey, setCampaignKey] = useState("");
  const [displayPriority, setDisplayPriority] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const limit = 15;
  const query = `/api/admin/products?page=${page}&limit=${limit}&stock=${stockFilter}&status=${statusFilter}`;
  const { data, loading, error, refetch } = useApi<PaginatedProducts>(
    query,
    { products: [], total: 0, page: 1, totalPages: 1 },
  );
  const router = useRouter();
  const setLoading = useLoadingStore((state) => state.setLoading);
  const { loading: navLoading, trigger: triggerNavigation } = useButtonLoading();
  const { confirm } = useConfirmModal();
  const [navTarget, setNavTarget] = useState<string | null>(null);

  const lowStockCount = useMemo(
    () => data.products.filter((product) => Number(product.totalStock ?? 0) > 0 && Number(product.totalStock ?? 0) <= 5).length,
    [data.products],
  );
  const outOfStockCount = useMemo(
    () => data.products.filter((product) => Number(product.totalStock ?? 0) === 0).length,
    [data.products],
  );

  const removeProduct = async (product: Product) => {
    await confirm({
      title: "Delete product?",
      message: "This product will be permanently deleted and removed from all listings.",
      confirmText: "Delete product",
      variant: "danger",
      action: async () => {
        try {
          const response = await fetchJson(`/api/products/${product._id}`, { method: "DELETE" });
          toast.success(response.message || "Product deleted");
          await refetch();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to delete product");
          throw error;
        }
      },
    });
  };

  const toggleSelection = (productId: string) => {
    setSelectedIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  };

  const togglePageSelection = () => {
    const pageIds = data.products.map((product) => product._id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])),
    );
  };

  const runBulkAction = async (action: BulkAction) => {
    if (!selectedIds.length) {
      toast.error("Select products first");
      return;
    }
    if (action === "assign_campaign" && !campaignKey.trim()) {
      toast.error("Enter a campaign key");
      return;
    }
    if (action === "set_priority" && displayPriority.trim() === "") {
      toast.error("Enter a display priority");
      return;
    }

    try {
      setBulkLoading(true);
      await fetchJson("/api/admin/products/bulk", {
        method: "PUT",
        body: JSON.stringify({
          productIds: selectedIds,
          action,
          campaignKey: campaignKey.trim(),
          displayPriority: Number(displayPriority || 0),
        }),
      });
      toast.success("Products updated");
      setSelectedIds([]);
      if (action === "assign_campaign" || action === "clear_campaign") {
        setCampaignKey("");
      }
      if (action === "set_priority") {
        setDisplayPriority("");
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const stockTone = (stock: number) =>
    stock > 10 ? "text-emerald-400" : stock > 0 ? "text-amber-300" : "text-red-400";

  const filterChip = (active: boolean) =>
    active
      ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold uppercase text-[#C7D2FE]"
      : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold uppercase text-[#888888]";

  return (
    <AdminShell title="Products" action={<Button type="button" loading={navLoading && navTarget === "/admin/products/new"} loadingText="Loading..." onClick={() => void triggerNavigation(async () => { setNavTarget("/admin/products/new"); setLoading(true); router.push("/admin/products/new"); })}><Plus className="h-4 w-4" />Add Product</Button>}>
      <div className="space-y-6 lg:space-y-7">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">Visible on this page</p>
            <p className="mt-3 text-3xl font-black text-white">{data.products.length}</p>
          </div>
          <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">Low stock</p>
            <p className="mt-3 text-3xl font-black text-[#C7D2FE]">{lowStockCount}</p>
          </div>
          <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">Out of stock</p>
            <p className="mt-3 text-3xl font-black text-red-400">{outOfStockCount}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
          <div className="flex flex-wrap gap-3">
            {(["all", "published", "draft", "featured"] as const).map((value) => (
              <button key={value} type="button" onClick={() => { setStatusFilter(value); setPage(1); }} className={filterChip(statusFilter === value)}>
                {value}
              </button>
            ))}
            {(["all", "low", "out"] as const).map((value) => (
              <button key={value} type="button" onClick={() => { setStockFilter(value); setPage(1); }} className={filterChip(stockFilter === value)}>
                {value === "all" ? "all stock" : value === "low" ? "low stock" : "out of stock"}
              </button>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr,180px,auto] xl:items-end">
            <TextInput label="Campaign Key" leftPad={false} placeholder="summer-drop" value={campaignKey} onChange={(e) => setCampaignKey(e.target.value)} />
            <TextInput label="Display Priority" leftPad={false} type="number" placeholder="100" value={displayPriority} onChange={(e) => setDisplayPriority(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="h-11 px-3" disabled={bulkLoading || !selectedIds.length} onClick={() => void runBulkAction("publish")}>Publish</Button>
              <Button type="button" variant="secondary" className="h-11 px-3" disabled={bulkLoading || !selectedIds.length} onClick={() => void runBulkAction("unpublish")}>Unpublish</Button>
              <Button type="button" variant="secondary" className="h-11 px-3" disabled={bulkLoading || !selectedIds.length} onClick={() => void runBulkAction("feature")}>Feature</Button>
              <Button type="button" variant="secondary" className="h-11 px-3" disabled={bulkLoading || !selectedIds.length} onClick={() => void runBulkAction("set_priority")}>Set Priority</Button>
              <Button type="button" variant="secondary" className="h-11 px-3" disabled={bulkLoading || !selectedIds.length} onClick={() => void runBulkAction("assign_campaign")}>Assign Campaign</Button>
              <Button type="button" variant="danger" className="h-11 px-3" disabled={bulkLoading || !selectedIds.length} onClick={() => void runBulkAction("archive")}>Archive</Button>
            </div>
          </div>
          {selectedIds.length ? (
            <p className="text-sm text-[#888888]">{selectedIds.length} selected</p>
          ) : null}
        </div>

        {tableWrap(
          loading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    {tableHead("")}
                    {tableHead("Image")}
                    {tableHead("Title")}
                    {tableHead("Price")}
                    {tableHead("Stock")}
                    {tableHead("Merchandising")}
                    {tableHead("Status")}
                    {tableHead("Actions")}
                  </tr>
                </thead>
                <tbody><TableRowSkeleton cols={8} rows={limit} /></tbody>
              </table>
            </div>
          ) : error ? (
            <div className="p-6"><EmptyState title="Products unavailable" description={error} /></div>
          ) : data.products.length ? (
            <>
              <div className="grid gap-3 p-4 md:hidden">
                {data.products.map((product) => (
                  <div key={product._id} className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-4">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selectedIds.includes(product._id)} onChange={() => toggleSelection(product._id)} className="mt-2 h-4 w-4 accent-[#6366F1]" />
                      <div className="relative h-[76px] w-[62px] shrink-0 overflow-hidden rounded-xl bg-black/20">
                        <Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{product.title}</p>
                        <p className="mt-1 text-xs text-[#888888]">{product.brand}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-[#4F46E5]/12 px-2.5 py-1 text-[#C7D2FE]">Priority {product.displayPriority || 0}</span>
                          {product.campaignKey ? <span className="rounded-full border border-white/10 px-2.5 py-1 text-[#BDBDBD]">{product.campaignKey}</span> : null}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#C7D2FE]">{formatCurrency(product.discountPrice || product.price)}</span>
                          <span className={`text-xs ${stockTone(Number(product.totalStock ?? 0))}`}>{product.totalStock ?? 0} in stock</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={product.isPublished ? "inline-flex rounded-full bg-green-500/15 px-3 py-1 text-[11px] font-semibold text-green-300" : "inline-flex rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-300"}>{product.isPublished ? "Published" : "Draft"}</span>
                      {product.isFeatured ? <span className="inline-flex rounded-full bg-[#4F46E5]/14 px-3 py-1 text-[11px] font-semibold text-[#C7D2FE]">Featured</span> : null}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button type="button" variant="secondary" loading={navLoading && navTarget === `/admin/products/${product._id}/edit`} loadingText="Loading..." className="h-10 flex-1 px-3" onClick={() => void triggerNavigation(async () => { setNavTarget(`/admin/products/${product._id}/edit`); setLoading(true); router.push(`/admin/products/${product._id}/edit`); })}><Pencil className="h-4 w-4" />Edit</Button>
                      <Button type="button" className="h-10 flex-1 border border-[#FF4444] bg-transparent px-3 text-[#FF4444] hover:bg-[#FF4444]/10" onClick={() => void removeProduct(product)}><Trash2 className="h-4 w-4" />Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {tableHead(
                        <input
                          type="checkbox"
                          checked={data.products.length > 0 && data.products.every((product) => selectedIds.includes(product._id))}
                          onChange={togglePageSelection}
                          className="h-4 w-4 accent-[#6366F1]"
                        />,
                      )}
                      {tableHead("Image")}
                      {tableHead("Title")}
                      {tableHead("Price")}
                      {tableHead("Stock")}
                      {tableHead("Merchandising")}
                      {tableHead("Status")}
                      {tableHead("Actions")}
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((product) => (
                      <tr key={product._id} className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A]">
                        {tableCell(<input type="checkbox" checked={selectedIds.includes(product._id)} onChange={() => toggleSelection(product._id)} className="h-4 w-4 accent-[#6366F1]" />, "w-12")}
                        {tableCell(
                          <div className="relative h-[60px] w-[48px] overflow-hidden rounded-md bg-black/20">
                            <Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" />
                          </div>,
                        )}
                        {tableCell(
                          <div>
                            <p className="max-w-[220px] truncate font-medium text-white">{product.title}</p>
                            <p className="text-xs text-[#888888]">{product.brand}</p>
                          </div>,
                        )}
                        {tableCell(
                          <div>
                            <p className="text-white">{formatCurrency(product.price)}</p>
                            <p className="text-sm font-semibold text-[#C7D2FE]">{formatCurrency(product.discountPrice || product.price)}</p>
                          </div>,
                        )}
                        {tableCell(<span className={stockTone(Number(product.totalStock ?? 0))}>{product.totalStock ?? 0}</span>)}
                        {tableCell(
                          <div className="space-y-1">
                            <p className="text-sm text-white">Priority {product.displayPriority || 0}</p>
                            <p className="text-xs text-[#888888]">{product.campaignKey || "No campaign"}</p>
                          </div>,
                        )}
                        {tableCell(
                          <div className="flex flex-wrap gap-2">
                            <span className={product.isPublished ? "inline-flex rounded-full bg-green-500/15 px-3 py-1 text-[11px] font-semibold text-green-300" : "inline-flex rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-300"}>{product.isPublished ? "Published" : "Draft"}</span>
                            {product.isFeatured ? <span className="inline-flex rounded-full bg-[#4F46E5]/14 px-3 py-1 text-[11px] font-semibold text-[#C7D2FE]">Featured</span> : null}
                          </div>,
                        )}
                        {tableCell(
                          <div className="flex gap-2">
                            <Button type="button" variant="secondary" loading={navLoading && navTarget === `/admin/products/${product._id}/edit`} loadingText="Loading..." className="h-10 px-3" onClick={() => void triggerNavigation(async () => { setNavTarget(`/admin/products/${product._id}/edit`); setLoading(true); router.push(`/admin/products/${product._id}/edit`); })}><Pencil className="h-4 w-4" />Edit</Button>
                            <Button type="button" className="h-10 border border-[#FF4444] bg-transparent px-3 text-[#FF4444] hover:bg-[#FF4444]/10" onClick={() => void removeProduct(product)}><Trash2 className="h-4 w-4" />Delete</Button>
                          </div>,
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-6"><EmptyState title="No products yet" /></div>
          )
        )}
        <Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={limit} onPageChange={setPage} />
      </div>
    </AdminShell>
  );
}
