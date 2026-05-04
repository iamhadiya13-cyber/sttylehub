/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Menu,
  MessageSquareQuote,
  Package,
  Settings,
  ShoppingBag,
  Store,
  TicketPercent,
  Users,
  Zap,
  X,
} from "lucide-react";
import NotificationBell from "@/components/ui/NotificationBell";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sellers", label: "Sellers", icon: Store },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

const mobileNavLinks = adminLinks.slice(0, 4);

function isActivePath(pathname?: string | null, href?: string) {
  if (!pathname || !href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminMobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname?: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-40 bg-black/75 lg:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col border-r border-white/8 bg-[#0A0D18] lg:hidden">
        <div className="flex items-center justify-between border-b border-[#1F1F1F] px-4 py-5">
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.08em] text-white">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#4F46E5] text-[15px] font-extrabold text-[#F8FAFC]">
              S
            </span>
            StyleHub
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-2 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="grid gap-1 overflow-y-auto p-3">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = isActivePath(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={
                  active
                    ? "flex items-center gap-3 rounded-xl border border-[#6366F1]/25 bg-[#4F46E5]/12 px-4 py-3 text-sm font-semibold text-[#C7D2FE]"
                    : "flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-[#888888] hover:bg-[#151515] hover:text-white"
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function AdminMobileNav({
  pathname,
  onMore,
}: {
  pathname?: string | null;
  onMore: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#0A0D18]/98 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileNavLinks.map((link) => {
          const Icon = link.icon;
          const active = isActivePath(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl bg-[#4F46E5]/12 text-[11px] font-semibold text-[#C7D2FE]"
                  : "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium text-[#888888]"
              }
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium text-[#888888]"
        >
          <Menu className="h-4 w-4" />
          More
        </button>
      </div>
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[220px] border-r border-white/8 bg-[#0A0D18] lg:block">
      <div className="flex items-center gap-3 border-b border-[#1F1F1F] px-4 py-5 text-sm font-bold uppercase tracking-[0.08em] text-white">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#4F46E5] text-[15px] font-extrabold text-[#F8FAFC]">
          S
        </span>
        StyleHub
      </div>
      <nav className="grid gap-[2px] p-2">
        {adminLinks.map((link) => {
          const active = isActivePath(pathname, link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "flex items-center gap-2.5 rounded-lg border-l-[3px] border-[#6366F1] bg-[#11162A] px-3 py-2.5 pl-[9px] text-[13px] font-medium text-[#C7D2FE]"
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
  );
}

export function AdminShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeMobileLabel = useMemo(() => {
    return adminLinks.find((link) => isActivePath(pathname, link.href))?.label || title;
  }, [pathname, title]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- route changes should always collapse the temporary mobile drawer
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <AdminSidebar />
      <AdminMobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
      />
      <AdminMobileNav pathname={pathname} onMore={() => setDrawerOpen(true)} />
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-6 pb-28 sm:px-6 sm:py-7 lg:ml-[220px] lg:px-10 lg:py-10 lg:pb-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-8 flex flex-col gap-5 lg:mb-10">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3 text-white"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 text-center">
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.22em] text-[#666666]">
                  StyleHub Admin
                </p>
                <h1 className="truncate text-[18px] font-bold uppercase tracking-[0.08em] text-white">
                  {activeMobileLabel}
                </h1>
              </div>
              <div className="relative">
                <NotificationBell scope="admin" mobileTopOffsetClassName="top-[72px]" />
              </div>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="hidden lg:block">
                <h1 className="text-[22px] font-bold uppercase tracking-[1px] text-white">
                  {title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative hidden lg:block">
                  <NotificationBell scope="admin" />
                </div>
                <div className="w-full sm:w-auto">{action}</div>
              </div>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
