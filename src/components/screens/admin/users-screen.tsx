"use client";

import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import { TableRowSkeleton } from "@/components/ui/Skeletons";
import { Button, EmptyState, fetchJson, TextInput, useApi } from "@/components/screens/shared";
import { AdminUser, PaginatedUsers, tableCell, tableHead, tableWrap } from "@/components/screens/admin/shared";

export function AdminUsersScreen() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, loading, error, refetch } = useApi<PaginatedUsers>(`/api/admin/users?page=${page}&limit=${limit}`, { users: [], total: 0, page: 1, totalPages: 1 });
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const filtered = data.users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()) && (role === "all" || user.role === role));

  const updateUser = async (userId: string, payload: Record<string, unknown>) => {
    try {
      await fetchJson("/api/admin/users", { method: "PUT", body: JSON.stringify({ userId, ...payload }) });
      toast.success("User updated");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    }
  };

  const deleteUser = async (userId: string) => {
    const target = data.users.find((user) => user._id === userId) || null;
    setUserToDelete(target);
    setConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setConfirmLoading(true);
      await fetchJson("/api/admin/users", { method: "DELETE", body: JSON.stringify({ userId: userToDelete._id }) });
      toast.success("User deleted");
      await refetch();
      setConfirmOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <AdminShell title="Users">
      <div className="flex flex-col gap-4 lg:flex-row"><div className="relative max-w-md flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" /><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email" className="pl-10" /></div><select value={role} onChange={(e) => setRole(e.target.value)} className="h-12 rounded-lg border border-[#1F1F1F] bg-[#111111] px-4 text-sm text-white outline-none"><option value="all">All</option><option value="user">Users</option><option value="seller">Sellers</option><option value="admin">Admin</option></select></div>
      {tableWrap(loading ? <div className="overflow-x-auto"><table className="min-w-full"><thead><tr>{tableHead("Avatar")}{tableHead("Name")}{tableHead("Email")}{tableHead("Role")}{tableHead("Joined")}{tableHead("Status")}{tableHead("Actions")}</tr></thead><tbody><TableRowSkeleton cols={7} rows={limit} /></tbody></table></div> : error ? <div className="p-6"><EmptyState title="Users unavailable" description={error} /></div> : filtered.length ? <>
        <div className="grid gap-3 p-4 md:hidden">
          {filtered.map((user) => (
            <div key={user._id} className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                  {user.avatar ? <Image src={user.avatar} alt={user.name} fill className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#C7D2FE]">{user.name.slice(0, 1)}</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-[#888888]">{user.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase text-[#DDD]">{user.role}</span>
                    {user.isBanned ? <span className="inline-flex rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-300">Banned</span> : <span className="inline-flex rounded-full bg-green-500/15 px-3 py-1 text-[11px] font-semibold text-green-300">Active</span>}
                  </div>
                  <p className="mt-3 text-xs text-[#666666]">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.role === "user" ? <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => void updateUser(user._id, { role: "seller" })}>Make Seller</Button> : null}
                <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => void updateUser(user._id, { isBanned: !user.isBanned })}>{user.isBanned ? "Unban" : "Ban"}</Button>
                <Button type="button" className="h-10 bg-red-500 px-3 text-white hover:brightness-95" onClick={() => void deleteUser(user._id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block"><table className="min-w-full"><thead><tr>{tableHead("Avatar")}{tableHead("Name")}{tableHead("Email")}{tableHead("Role")}{tableHead("Joined")}{tableHead("Status")}{tableHead("Actions")}</tr></thead><tbody>{filtered.map((user) => <tr key={user._id} className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A]">{tableCell(<div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/10">{user.avatar ? <Image src={user.avatar} alt={user.name} fill className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#C7D2FE]">{user.name.slice(0, 1)}</div>}</div>)}{tableCell(user.name)}{tableCell(user.email, "text-[#888888]")}{tableCell(user.role)}{tableCell(user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-")}{tableCell(user.isBanned ? <span className="inline-flex rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-300">Banned</span> : <span className="inline-flex rounded-full bg-green-500/15 px-3 py-1 text-[11px] font-semibold text-green-300">Active</span>)}{tableCell(<div className="flex flex-wrap gap-2">{user.role === "user" ? <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => void updateUser(user._id, { role: "seller" })}>Make Seller</Button> : null}<Button type="button" variant="secondary" className="h-10 px-3" onClick={() => void updateUser(user._id, { isBanned: !user.isBanned })}>{user.isBanned ? "Unban" : "Ban"}</Button><Button type="button" className="h-10 bg-red-500 px-3 text-white hover:brightness-95" onClick={() => void deleteUser(user._id)}>Delete</Button></div>)}</tr>)}</tbody></table></div>
      </> : <div className="p-6"><EmptyState title="No users yet" /></div>)}
      <Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={limit} onPageChange={setPage} />
      <ConfirmModal isOpen={confirmOpen} onClose={() => { if (!confirmLoading) setConfirmOpen(false); }} onConfirm={confirmDeleteUser} title="Delete User" message={userToDelete ? `Delete ${userToDelete.name}? This action cannot be undone.` : "Delete this user?"} confirmLabel="Delete User" variant="danger" loading={confirmLoading} loadingLabel="Deleting..." />
    </AdminShell>
  );
}
