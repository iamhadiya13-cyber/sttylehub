"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import type { Category } from "@/components/storefront/types";
import { useCartStore } from "@/stores/cart-store";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useWishlistStore } from "@/stores/wishlist-store";

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
};

export function MobileDrawer({ isOpen, onClose, categories }: MobileDrawerProps) {
  const { data: session, status } = useSession();
  const { confirm } = useConfirmModal();
  const isLoggedIn = status === "authenticated";
  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const [categoryGroupsOpen, setCategoryGroupsOpen] = useState<Record<"men" | "women" | "unisex", boolean>>({
    men: false,
    women: false,
    unisex: false,
  });

  const groupedCategories = {
    men: categories.filter((category) => category.gender === "men"),
    women: categories.filter((category) => category.gender === "women"),
    unisex: categories.filter((category) => category.gender === "unisex"),
  };

  const mobilePrimaryLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/products?sort=price-desc", label: "Sale" },
    { href: "/search", label: "Search" },
  ];

  const mobileUtilityLinks =
    session?.user.role === "seller"
      ? [
          { href: "/seller/payouts", label: "Payouts" },
        ]
      : session?.user.role === "admin"
        ? [
            { href: "/admin/users", label: "Users / Sellers" },
          ]
        : [];

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

    onClose();
    useCartStore.getState().clearStore();
    useWishlistStore.getState().clearStore();
    useRecentlyViewedStore.getState().clearStore();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/85 lg:hidden" onClick={onClose} />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.35 }} className="fixed inset-y-0 left-0 z-50 flex h-dvh w-full flex-col bg-[#090909] lg:hidden">
            <div className="flex items-center justify-between border-b border-[#1F1F1F] px-5 py-5">
              <div className="flex items-center gap-3 font-bold uppercase tracking-[0.28em]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#4F46E5] text-[#F8FAFC]">S</span>
                StyleHub
              </div>
              <button type="button" onClick={onClose} className="rounded-xl border border-[#1F1F1F] p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-2">
                {mobilePrimaryLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={onClose} className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3.5 text-sm font-medium text-white/90 transition hover:border-[#1F1F1F] hover:bg-white/5">
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4 text-white/30" />
                  </Link>
                ))}
                <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-2">
                  <button type="button" onClick={() => setCategoriesMenuOpen((current) => !current)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-white">
                    <span>Categories</span>
                    <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", categoriesMenuOpen ? "rotate-180" : "")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {categoriesMenuOpen ? (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-2 px-1 pb-1">
                          {(["men", "women", "unisex"] as const).map((gender) => (
                            <div key={gender} className="overflow-hidden rounded-xl border border-[#1A1A1A] bg-[#0C0C0C]">
                              <button type="button" onClick={() => setCategoryGroupsOpen((current) => ({ ...current, [gender]: !current[gender] }))} className="flex w-full items-center justify-between px-3 py-3 text-left">
                    <span className={cn("text-xs font-bold uppercase tracking-[0.24em]", gender === "men" ? "text-[#7C3AED]" : gender === "women" ? "text-[#A855F7]" : "text-[#818CF8]")}>
                                  {gender}
                                </span>
                                <ChevronDown className={cn("h-4 w-4 text-white/50 transition-transform", categoryGroupsOpen[gender] ? "rotate-180" : "")} />
                              </button>
                              <AnimatePresence initial={false}>
                                {categoryGroupsOpen[gender] ? (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="grid gap-1 border-t border-[#1A1A1A] px-3 py-3">
                                      {groupedCategories[gender].map((category) => (
                                        <Link key={category._id} href={`/products?category=${category.slug}&gender=${gender}`} onClick={onClose} className="rounded-lg px-2 py-2 text-sm text-[#A1A1A1] transition hover:bg-white/5 hover:text-white">
                                          {category.name}
                                        </Link>
                                      ))}
                                      {!groupedCategories[gender].length ? (
                                        <p className="px-2 py-2 text-sm text-[#555555]">No categories yet</p>
                                      ) : null}
                                    </div>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="border-t border-[#1F1F1F] bg-black px-5 py-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[#666666]">
                {isLoggedIn ? "Session" : "Account"}
              </p>
              <div className="grid gap-2">
                {isLoggedIn ? (
                  <>
                    {mobileUtilityLinks.length ? mobileUtilityLinks.map((link) => (
                      <Link key={link.href} href={link.href} onClick={onClose} className="rounded-2xl border border-[#1F1F1F] px-4 py-3 text-sm text-white/90 transition hover:bg-white/5">
                        {link.label}
                      </Link>
                    )) : null}
          <button type="button" onClick={() => void requestSignOut()} className="rounded-2xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-3 text-sm font-semibold text-[#F8FAFC]">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={onClose} className="rounded-2xl border border-[#1F1F1F] px-4 py-3 text-sm text-white/90">
                      Login
                    </Link>
        <Link href="/register" onClick={onClose} className="rounded-2xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-3 text-sm font-semibold text-[#F8FAFC]">
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
