"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, Home, Package2, ShoppingBag, SquareUserRound, LayoutDashboard, Boxes } from "lucide-react";
import { GuardedNavLink } from "@/components/ui/GuardedNavLink";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  match?: (pathname: string) => boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const { data: session, status } = useSession();
  const cartCount = useCartStore((state) => state.totalItems);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const items: NavItem[] =
    session?.user.role === "admin"
      ? [
          { href: "/", label: "Home", icon: Home },
          { href: "/admin/orders", label: "Orders", icon: Package2 },
          { href: "/admin/products", label: "Products", icon: Boxes },
          { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/profile", label: "Account", icon: SquareUserRound },
        ]
      : session?.user.role === "seller"
        ? [
            { href: "/", label: "Home", icon: Home },
            { href: "/seller/orders", label: "Orders", icon: Package2 },
            { href: "/seller/products", label: "Products", icon: Boxes },
            { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/profile", label: "Account", icon: SquareUserRound },
          ]
        : [
            { href: "/", label: "Home", icon: Home },
            { href: "/products", label: "Shop", icon: ShoppingBag, match: (current) => current === "/products" || current.startsWith("/products") || current === "/search" || current.startsWith("/search") },
            { href: "/cart", label: "Cart", icon: ShoppingBag, badge: cartCount, match: (current) => current === "/cart" || current === "/checkout" || current.startsWith("/checkout") },
            { href: "/wishlist", label: "Wishlist", icon: Heart, badge: wishlistCount },
            { href: "/profile", label: "Account", icon: SquareUserRound, match: (current) => current === "/profile" || current.startsWith("/profile") || current === "/orders" || current.startsWith("/orders") },
          ];

  if (status === "loading") {
    return null;
  }

  const useGuardedNav = (href: string) =>
    href === "/profile" ||
    href === "/orders" ||
    href === "/wishlist" ||
    href.startsWith("/seller/") ||
    href.startsWith("/admin/");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)",
        borderColor: "var(--border-default)",
        background: "var(--bg-elevated)",
      }}
      aria-label="Mobile bottom navigation"
    >
      <div className="mx-auto grid max-w-xl grid-cols-5 px-2 pt-2">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <div key={item.label}>
              {useGuardedNav(item.href) ? (
                <GuardedNavLink
                  href={item.href}
                  className={cn(
                    "relative flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition",
                    active ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-x-2 top-1 h-[42px] rounded-2xl transition",
                      active ? "bg-[var(--accent-muted)]" : "bg-transparent",
                    )}
                  />
                  <div className="relative">
                    <Icon className={cn("h-5 w-5", active ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]")} />
                    {item.badge ? (
                      <span className="absolute -right-2 -top-2 rounded-full px-1.5 text-[9px] font-bold leading-4 text-[var(--text-on-accent)]" style={{ background: "var(--accent-primary)" }}>
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="relative">{item.label}</span>
                </GuardedNavLink>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition",
                    active ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-x-2 top-1 h-[42px] rounded-2xl transition",
                      active ? "bg-[var(--accent-muted)]" : "bg-transparent",
                    )}
                  />
                  <div className="relative">
                    <Icon className={cn("h-5 w-5", active ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]")} />
                    {item.badge ? (
                      <span className="absolute -right-2 -top-2 rounded-full px-1.5 text-[9px] font-bold leading-4 text-[var(--text-on-accent)]" style={{ background: "var(--accent-primary)" }}>
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="relative">{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
