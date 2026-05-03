import type { ReactNode } from "react";
import { requireAdminUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminUser("/admin/dashboard");
  return children;
}
