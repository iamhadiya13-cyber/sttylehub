/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  CircleUser,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { fallbackImage, isPollinationsImage } from "@/components/storefront/media";
import { fetchJson, useApi } from "@/components/storefront/api";
import { MobileBottomNav } from "@/components/storefront/mobile-nav";
import { MobileDrawer } from "@/components/storefront/mobile-drawer";
import FlashSaleSiteBanner from "@/components/storefront/flash-sale-banner";
import { GuardedNavLink } from "@/components/ui/GuardedNavLink";
import NotificationBell from "@/components/ui/NotificationBell";
import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { productImageAlt } from "@/lib/seo/site";
import { useLoadingStore } from "@/stores/loading-store";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import type { Category, Product } from "@/components/storefront/types";

function Footer() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <footer className="border-t border-[#1F1F1F] bg-[#0A0A0A] px-6 pb-28 pt-12 lg:pb-6">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-bold uppercase tracking-[0.28em]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#4F46E5] text-[#F8FAFC]">
                S
              </span>
              StyleHub
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#888888]">
              Streetwear for bold wardrobes, curated drops, and a storefront
              built to keep fashion culture feeling sharp on every screen.
            </p>
          </div>
          <div className="space-y-4">
            <p className="app-section-heading">Shop</p>
            <div className="space-y-2 text-sm text-[#888888]">
              <Link href="/products" className="block transition hover:text-white">
                All Products
              </Link>
              <Link href="/search" className="block transition hover:text-white">
                Search
              </Link>
              {isLoggedIn ? (
                <GuardedNavLink href="/wishlist" className="block transition hover:text-white">
                  Wishlist
                </GuardedNavLink>
              ) : null}
            </div>
          </div>
          <div className="space-y-4">
            <p className="app-section-heading">Company</p>
            <div className="space-y-2 text-sm text-[#888888]">
              {isLoggedIn ? (
                <GuardedNavLink href="/orders" className="block transition hover:text-white">
                  Orders
                </GuardedNavLink>
              ) : (
                <Link href="/login" className="block transition hover:text-white">
                  Login
                </Link>
              )}
              {isLoggedIn ? (
                <GuardedNavLink href="/profile" className="block transition hover:text-white">
                  Profile
                </GuardedNavLink>
              ) : (
                <Link href="/register" className="block transition hover:text-white">
                  Register
                </Link>
              )}
              <Link href="/sell-on-stylehub" className="block transition hover:text-white">
                Sell on StyleHub
              </Link>
              <Link href="/sell-on-stylehub" className="block transition hover:text-white">
                Want to be a Vendor?
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <p className="app-section-heading">Social</p>
            <div className="space-y-2 text-sm text-[#888888]">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="block transition hover:text-white">
                Instagram
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="block transition hover:text-white">
                X / Twitter
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="block transition hover:text-white">
                YouTube
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#1F1F1F] pt-6 text-sm text-[#888888] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} StyleHub. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            {isLoggedIn ? (
              <>
                <GuardedNavLink href="/orders" className="transition hover:text-white">My Orders</GuardedNavLink>
                <GuardedNavLink href="/profile" className="transition hover:text-white">My Profile</GuardedNavLink>
                <GuardedNavLink href="/wishlist" className="transition hover:text-white">Wishlist</GuardedNavLink>
              </>
            ) : (
              <>
                <Link href="/login" className="transition hover:text-white">Login</Link>
                <Link href="/register" className="transition hover:text-white">Register</Link>
                <Link href="/login?callbackUrl=%2Forders" className="transition hover:text-white">Track Order</Link>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col flex-wrap items-start justify-between gap-4 rounded-xl border border-[rgba(245,245,0,0.1)] bg-[linear-gradient(135deg,rgba(245,245,0,0.06)_0%,rgba(245,245,0,0.02)_100%)] px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="m-0 text-[15px] font-bold text-white">Sell on StyleHub</p>
            <p className="m-0 mt-1 text-[13px] text-[#888888]">Join 100+ sellers. Reach thousands of buyers.</p>
          </div>
          <Link href="/sell-on-stylehub" className="shrink-0 whitespace-nowrap rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-5 py-2.5 text-sm font-semibold text-[#F8FAFC]">
            Apply Now →
          </Link>
        </div>
      </div>
    </footer>
  );
}

function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { confirm } = useConfirmModal();
  const setLoading = useLoadingStore((state) => state.setLoading);
  const isLoggedIn = status === "authenticated";
  const { data: categoriesData } = useApi<Category[]>("/api/categories", []);
  const categories = categoriesData ?? [];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const desktopSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
  const cartCount = useCartStore((state) => state.totalItems);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const searchQueryFromUrl = pathname === "/search" ? (searchParams?.get("q") || "") : "";
  const groupedCategories = {
    men: categories.filter((category) => category.gender === "men"),
    women: categories.filter((category) => category.gender === "women"),
    unisex: categories.filter((category) => category.gender === "unisex"),
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/products?sort=price-desc", label: "Sale" },
  ];

  const showSearchDropdown = searchOpen && Boolean(searchValue.trim());

  useEffect(() => {
    const nextQuery = searchQueryFromUrl.trim();
    if (pathname === "/search" && nextQuery) {
      setSearchOpen(true);
      setSearchValue(nextQuery);
      setDebouncedSearch(nextQuery);
      return;
    }

    if (pathname !== "/search") {
      setSearchOpen(false);
      setSearchValue("");
      setDebouncedSearch("");
      setSearchResults([]);
      setSearchTotal(0);
      setSearchLoading(false);
    }
  }, [pathname, searchQueryFromUrl]);

  useEffect(() => {
    if (!searchOpen) {
      setDebouncedSearch("");
      return;
    }

    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchOpen, searchValue]);

  useEffect(() => {
    if (!searchOpen || !debouncedSearch) {
      setSearchLoading(false);
      setSearchResults([]);
      setSearchTotal(0);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    void fetchJson<{ products: Product[]; total: number }>(
      `/api/products?search=${encodeURIComponent(debouncedSearch)}&page=1&limit=5`,
      { method: "GET" },
      { cacheTtlMs: 30_000 },
    )
      .then((json) => {
        if (cancelled) return;
        setSearchResults(json.data?.products || []);
        setSearchTotal(json.data?.total || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setSearchResults([]);
        setSearchTotal(0);
      })
      .finally(() => {
        if (!cancelled) {
          setSearchLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !desktopSearchContainerRef.current?.contains(target)
      ) {
        setSearchOpen(false);
        setSearchValue("");
        setSearchResults([]);
        setSearchTotal(0);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearchValue("");
        setSearchResults([]);
        setSearchTotal(0);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => {
        desktopSearchInputRef.current?.focus();
      }, 40);
    }
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue("");
    setSearchResults([]);
    setSearchTotal(0);
  };

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const requestSignOut = async () => {
    const confirmed = await confirm({
      title: "Sign out?",
      message: "You will be signed out of your account.",
      confirmText: "Sign out",
      variant: "default",
    });

    if (!confirmed) {
      return;
    }

    setProfileOpen(false);
    useCartStore.getState().clearStore();
    useWishlistStore.getState().clearStore();
    useRecentlyViewedStore.getState().clearStore();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#1F1F1F] bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:hidden">
        <button type="button" className="rounded-xl border border-[#1F1F1F] p-2 text-white" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1" />
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <NotificationBell mobileTopOffsetClassName="top-[72px]" />
            <div className="relative">
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center rounded-xl border border-[#1F1F1F] p-2 text-sm text-white/85">
                <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  {session.user.avatar ? (
                    <Image src={session.user.avatar} alt={session.user.name ?? "User"} width={32} height={32} sizes="32px" className="h-8 w-8 object-cover" />
                  ) : (
                    <CircleUser className="h-5 w-5" />
                  )}
                </span>
              </button>
              <AnimatePresence>
                {profileOpen ? (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} className="absolute right-0 top-12 grid min-w-[220px] gap-1 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-2 shadow-2xl">
                  {session.user.role === "seller" ? (
                    <>
                      <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Seller</p>
                      <GuardedNavLink href="/seller/dashboard" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#C7D2FE] hover:bg-white/5">Seller Dashboard</GuardedNavLink>
                      <GuardedNavLink href="/seller/products" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">My Products</GuardedNavLink>
                      <GuardedNavLink href="/seller/orders" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">My Orders</GuardedNavLink>
                      <GuardedNavLink href="/seller/payouts" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">Payouts</GuardedNavLink>
                      <div className="my-1 h-px bg-[#1F1F1F]" />
                    </>
                  ) : null}
                  <GuardedNavLink href="/profile" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">
                    {session.user.role === "seller" ? "Profile" : "Profile"}
                  </GuardedNavLink>
                  <GuardedNavLink href="/orders" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">
                    {session.user.role === "seller" ? "My Purchases" : "My Orders"}
                  </GuardedNavLink>
                  {(session.user.role === "user" || session.user.role === "seller") ? (
                    <GuardedNavLink href="/wishlist" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">
                      Wishlist
                    </GuardedNavLink>
                  ) : null}
                  {(session.user.role === "seller" || session.user.role === "admin") ? <div className="my-1 h-px bg-[#1F1F1F]" /> : null}
                  {session.user.role === "admin" ? (
                    <GuardedNavLink href="/admin/dashboard" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">
                      Admin Dashboard
                    </GuardedNavLink>
                  ) : null}
                  <button type="button" onClick={() => void requestSignOut()} className="rounded-xl px-3 py-2 text-left text-sm text-[#FF7A5C] hover:bg-white/5">
                    Logout
                  </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        ) : status === "loading" ? (
          <div className="h-10 w-10 rounded-xl bg-[#1A1A1A]" />
        ) : (
          <Link href="/login" className="flex items-center justify-center rounded-xl border border-[#1F1F1F] p-2 text-white/85">
            <CircleUser className="h-5 w-5" />
          </Link>
        )}
      </div>

      <div className="mx-auto hidden max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:flex lg:px-8">
        <div className="flex items-center gap-3 lg:min-w-[220px]">
          <button type="button" className="rounded-xl border border-[#1F1F1F] p-2 text-white lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-3 font-bold uppercase tracking-[0.28em]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#4F46E5] text-[#F8FAFC]">S</span>
            <span className="hidden sm:inline">StyleHub</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="group relative text-sm font-medium text-white/80 transition hover:text-white">
              {link.label}
              <motion.span
                layoutId="nav-underline"
                className={cn("absolute -bottom-2 left-0 h-0.5 bg-[#6366F1]", pathname === link.href ? "w-full" : "w-0 group-hover:w-full")}
              />
            </Link>
          ))}
          <div
            className="relative"
            onMouseEnter={() => {
              if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
              setCategoriesOpen(true);
            }}
            onMouseLeave={() => {
              closeTimeoutRef.current = window.setTimeout(() => setCategoriesOpen(false), 150);
            }}
          >
            <button type="button" className="flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white">
              Categories <ChevronDown className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {categoriesOpen ? (
                <motion.div initial={{ opacity: 0, scaleY: 0.92 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0.92 }} className="absolute left-1/2 top-10 z-[100] grid min-w-[600px] -translate-x-1/2 origin-top grid-cols-3 gap-8 rounded-xl border border-[#1F1F1F] bg-[#111111] p-6 shadow-2xl">
                  {(["men", "women", "unisex"] as const).map((gender) => (
                    <div key={gender} className="space-y-3">
                      <p className={cn("text-xs font-bold uppercase tracking-[0.24em]", gender === "men" ? "text-[#7C3AED]" : gender === "women" ? "text-[#A855F7]" : "text-[#818CF8]")}>
                        {gender}
                      </p>
                      <div className="space-y-1">
                        {groupedCategories[gender].map((category) => (
                          <Link key={category._id} href={`/products?category=${category.slug}&gender=${gender}`} onClick={() => setCategoriesOpen(false)} className="block py-1.5 text-sm text-[#888888] transition hover:text-white">
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </nav>

        <div className="relative flex items-center justify-end gap-3 lg:min-w-[220px]">
          {isLoggedIn && session.user.role === "seller" ? (
            <GuardedNavLink href="/seller/dashboard" className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-[#6366F1]/25 bg-[#4F46E5]/10 px-3.5 py-2 text-[12px] font-bold tracking-[0.04em] text-[#C7D2FE] lg:inline-flex">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#818CF8]" />
              Seller Dashboard
            </GuardedNavLink>
          ) : null}
          {isLoggedIn && session.user.role === "admin" ? (
            <GuardedNavLink href="/admin/dashboard" className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-[#6366F1]/25 bg-[#4F46E5]/10 px-3.5 py-2 text-[12px] font-bold tracking-[0.04em] text-[#C7D2FE] lg:inline-flex">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#818CF8]" />
              Admin Panel
            </GuardedNavLink>
          ) : null}

          <div className="relative flex items-center gap-2">
            <div ref={desktopSearchContainerRef} className="relative z-20 hidden lg:block">
              <div
                className={cn(
                  "pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 overflow-hidden transition-[width] duration-250 ease-out",
                  searchOpen ? "w-[220px]" : "w-0",
                )}
              >
                <input
                  ref={desktopSearchInputRef}
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitSearch(searchValue);
                    }
                  }}
                  placeholder="Search products..."
                  className="pointer-events-auto h-10 w-[220px] border-0 border-b border-[#7F77DD] bg-transparent px-0 pr-11 text-[14px] text-white outline-none placeholder:text-[#8A8F9F]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (searchOpen) {
                    closeSearch();
                    return;
                  }
                  setSearchOpen(true);
                }}
                className="relative z-10 rounded-xl border border-[#1F1F1F] p-2 text-white/80 transition hover:border-[#6366F1] hover:text-white"
                aria-label={searchOpen ? "Close search" : "Open search"}
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>

              {showSearchDropdown ? (
                <div className="absolute right-0 top-[calc(100%+10px)] w-[320px] max-w-[320px] rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#101523_0%,#0B0E17_100%)] p-3 shadow-[0_24px_60px_rgba(2,6,23,0.4)] backdrop-blur">
                  <div className="space-y-1.5">
                    {searchLoading
                      ? Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                            <SkeletonBox width={40} height={40} borderRadius={10} />
                            <div className="min-w-0 flex-1 space-y-2">
                              <SkeletonBox width="72%" height={12} borderRadius={6} />
                              <SkeletonBox width="38%" height={12} borderRadius={6} />
                            </div>
                          </div>
                        ))
                      : searchResults.map((product) => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => {
                              setLoading(true);
                              router.push(`/products/${product.slug}`);
                            }}
                            className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/[0.04]"
                          >
                            <div className="relative h-10 w-10 overflow-hidden rounded-[10px] bg-black/30">
                              {isPollinationsImage(product.images?.[0]) ? (
                                <img src={fallbackImage(product.images?.[0])} alt={product.title} className="h-full w-full object-cover object-center" />
                              ) : (
                                <Image src={fallbackImage(product.images?.[0])} alt={productImageAlt(product)} fill sizes="40px" className="object-cover object-center" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#F4F1EA]">{product.title}</p>
                              <p className="mt-1 text-xs text-[#A5B4FC]">{formatCurrency(product.discountPrice)}</p>
                            </div>
                          </button>
                        ))}

                    {!searchLoading && searchResults.length === 0 ? (
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-[#BDBDBD]">
                        No products found.
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => submitSearch(searchValue)}
                      className="mt-2 flex w-full items-center justify-between rounded-2xl border border-[#7F77DD]/25 bg-[#7F77DD]/10 px-3 py-3 text-left text-sm text-white transition hover:border-[#7F77DD]/40 hover:bg-[#7F77DD]/14"
                    >
                      <span>
                        See all results for{" "}
                        <span className="font-semibold text-[#C7C2FF]">&quot;{searchValue.trim()}&quot;</span>
                      </span>
                      <span className="text-xs uppercase tracking-[0.16em] text-white/55">{searchTotal} found</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            {status === "loading" ? <div className="h-8 w-8 rounded-full bg-[#1A1A1A]" /> : null}
            {isLoggedIn && (session.user.role === "user" || session.user.role === "seller") ? (
              <GuardedNavLink href="/wishlist" className="relative rounded-xl border border-[#1F1F1F] p-2 text-white/80 transition hover:border-[#6366F1] hover:text-white">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-[#4F46E5] px-1.5 text-[10px] font-bold text-[#F8FAFC]">{wishlistCount}</span> : null}
              </GuardedNavLink>
            ) : null}
            {isLoggedIn ? <NotificationBell /> : null}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  router.push("/cart");
                }}
                className="relative rounded-xl border border-[#1F1F1F] p-2 text-white/80 transition hover:border-[#6366F1] hover:text-white"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount ? <span className="absolute -right-1 -top-1 rounded-full bg-[#4F46E5] px-1.5 text-[10px] font-bold text-[#F8FAFC]">{cartCount}</span> : null}
              </button>
            ) : null}
            {isLoggedIn ? (
              <div className="relative">
                <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-1.5 rounded-xl border border-[#1F1F1F] px-3 py-2 text-sm text-white/85">
                  <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10">
                    {session.user.avatar ? (
                      <Image src={session.user.avatar} alt={session.user.name ?? "User"} width={32} height={32} sizes="32px" className="h-8 w-8 object-cover" />
                    ) : (
                      <CircleUser className="h-5 w-5" />
                    )}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 sm:block" />
                </button>
                <AnimatePresence>
                  {profileOpen ? (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} className="absolute right-0 top-12 grid min-w-[220px] gap-1 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-2 shadow-2xl">
                    {session.user.role === "seller" ? (
                      <>
                        <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Seller</p>
                        <GuardedNavLink href="/seller/dashboard" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#C7D2FE] hover:bg-white/5">Seller Dashboard</GuardedNavLink>
                        <GuardedNavLink href="/seller/products" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">My Products</GuardedNavLink>
                        <GuardedNavLink href="/seller/orders" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">My Orders</GuardedNavLink>
                        <GuardedNavLink href="/seller/payouts" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">Payouts</GuardedNavLink>
                        <div className="my-1 h-px bg-[#1F1F1F]" />
                      </>
                    ) : null}
                    <GuardedNavLink href="/profile" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">
                      {session.user.role === "seller" ? "Profile" : "Profile"}
                    </GuardedNavLink>
                    <GuardedNavLink href="/orders" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">
                      {session.user.role === "seller" ? "My Purchases" : "My Orders"}
                    </GuardedNavLink>
                    {(session.user.role === "user" || session.user.role === "seller") ? (
                      <GuardedNavLink href="/wishlist" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">
                        Wishlist
                      </GuardedNavLink>
                    ) : null}
                    {(session.user.role === "seller" || session.user.role === "admin") ? <div className="my-1 h-px bg-[#1F1F1F]" /> : null}
                    {session.user.role === "admin" ? (
                      <GuardedNavLink href="/admin/dashboard" onClick={() => setProfileOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white">
                        Admin Dashboard
                      </GuardedNavLink>
                    ) : null}
                    <button type="button" onClick={() => void requestSignOut()} className="rounded-xl px-3 py-2 text-left text-sm text-[#FF7A5C] hover:bg-white/5">
                      Logout
                    </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : status === "loading" ? null : (
              <Link href="/login" className="rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-2 text-sm font-semibold text-[#F8FAFC]">
                Login
              </Link>
            )}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {mobileOpen ? <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} /> : null}
      </AnimatePresence>
    </header>
  );
}

export function PageShell({
  children,
  hideFooter = false,
}: {
  children: ReactNode;
  hideFooter?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Header />
      <FlashSaleSiteBanner />
      <div className="pb-[calc(82px+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      {!hideFooter ? <Footer /> : null}
      <MobileBottomNav />
    </div>
  );
}
