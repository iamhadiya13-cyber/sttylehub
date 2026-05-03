import type { ReactNode } from "react";
import { requireSellerUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function SellerLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireSellerUser("/seller/dashboard");
  return children;
}
