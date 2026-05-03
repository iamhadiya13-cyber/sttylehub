import { AdminShell } from "@/components/admin/AdminSidebar";
import { AdminDashboardSkeleton } from "@/components/ui/skeletons/AdminDashboardSkeleton";

export default function AdminDashboardLoading() {
  return (
    <AdminShell title="Dashboard">
      <AdminDashboardSkeleton />
    </AdminShell>
  );
}
