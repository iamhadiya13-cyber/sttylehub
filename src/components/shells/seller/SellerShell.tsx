"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Receipt, RefreshCcw, Wallet, Store } from "lucide-react";
import type { ReactNode } from "react";
import NotificationBell from "@/components/ui/NotificationBell";

const sellerLinks = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: Receipt },
  { href: "/seller/returns", label: "Returns", icon: RefreshCcw },
  { href: "/seller/payouts", label: "Payouts", icon: Wallet },
  { href: "/seller/profile", label: "Profile", icon: Store },
] as const;

function isActive(pathname?: string | null, href?: string) {
  if (!pathname || !href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SellerShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--seller-bg)] text-white">
      <div className="sticky top-0 z-30 border-b border-white/8 bg-[#070B18]/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#666666]">StyleHub Seller</p>
            <p className="text-sm font-semibold text-white">{title}</p>
          </div>
          <NotificationBell mobileTopOffsetClassName="top-[72px]" />
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sellerLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "inline-flex items-center gap-2 rounded-full bg-[#4F46E5]/14 px-4 py-2 text-xs font-semibold text-[#C7D2FE]"
                    : "inline-flex items-center gap-2 rounded-full border border-[#1F1F1F] px-4 py-2 text-xs font-semibold text-[#888888]"
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      <aside className="fixed inset-y-0 left-0 hidden w-[220px] border-r border-white/8 bg-[#070B18] lg:block">
        <div className="flex items-center gap-3 border-b border-[#1F1F1F] px-4 py-5 text-sm font-bold uppercase tracking-[0.08em] text-white">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#4F46E5] text-[15px] font-extrabold text-[#F8FAFC]">
            S
          </span>
          Seller
        </div>
        <nav className="grid gap-[2px] p-2">
          {sellerLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "flex items-center gap-2.5 rounded-lg border-l-[3px] border-[#6366F1] bg-[#11162A] px-3 py-2.5 pl-[9px] text-[13px] font-medium text-[#A5B4FC]"
                    : "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#666666] transition hover:bg-[#1A1A1A] hover:text-white"
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-h-screen px-4 py-5 pb-24 sm:px-6 lg:ml-[220px] lg:px-9 lg:py-8 lg:pb-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#666666]">StyleHub Seller</p>
              <h1 className="text-[22px] font-bold uppercase tracking-[0.08em] text-white">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <NotificationBell />
              {action}
            </div>
          </div>
          {children}
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-[#070B18]/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-6 gap-1">
          {sellerLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "flex flex-col items-center gap-1 rounded-2xl bg-[#4F46E5]/14 px-2 py-2 text-[10px] font-semibold text-[#C7D2FE]"
                    : "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold text-[#777777]"
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
