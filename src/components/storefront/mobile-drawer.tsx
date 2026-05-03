"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { useThemeStore, type ThemeName } from "@/stores/theme-store";
import type { Category } from "@/components/storefront/types";

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
};

export function MobileDrawer({ isOpen, onClose, categories }: MobileDrawerProps) {
  const { data: session, status } = useSession();
  const { confirm } = useConfirmModal();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const persistTheme = useThemeStore((state) => state.persistTheme);
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

  const themeOptions: Array<{ name: ThemeName; label: string; color: string }> = [
    { name: "void", label: "VOID", color: "#7F77DD" },
    { name: "infrared", label: "INFRARED", color: "#FF4D1C" },
    { name: "arctic", label: "ARCTIC", color: "#2563EB" },
  ];

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
    await signOut({ callbackUrl: "/" });
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(var(--shadow-color-rgb), 0.82)" }} onClick={onClose} />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.35 }} className="fixed inset-y-0 left-0 z-50 flex h-dvh w-full flex-col lg:hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <div className="flex items-center justify-between border-b px-5 py-5" style={{ borderColor: "var(--border-default)" }}>
              <div className="flex items-center gap-3 font-bold uppercase tracking-[0.28em]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-on-accent)]" style={{ background: "var(--accent-primary)" }}>S</span>
                StyleHub
              </div>
              <button type="button" onClick={onClose} className="rounded-xl border p-2" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-2">
                {mobilePrimaryLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={onClose} className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3.5 text-sm font-medium transition hover:bg-white/5" style={{ color: "var(--text-primary)" }}>
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
                  </Link>
                ))}
                <div className="rounded-2xl border p-2" style={{ borderColor: "var(--border-default)", background: "var(--bg-secondary)" }}>
                  <button type="button" onClick={() => setCategoriesMenuOpen((current) => !current)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    <span>Categories</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", categoriesMenuOpen ? "rotate-180" : "")} style={{ color: "var(--text-secondary)" }} />
                  </button>
                  <AnimatePresence initial={false}>
                    {categoriesMenuOpen ? (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-2 px-1 pb-1">
                          {(["men", "women", "unisex"] as const).map((gender) => (
                            <div key={gender} className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-tertiary)" }}>
                              <button type="button" onClick={() => setCategoryGroupsOpen((current) => ({ ...current, [gender]: !current[gender] }))} className="flex w-full items-center justify-between px-3 py-3 text-left">
                    <span className={cn("text-xs font-bold uppercase tracking-[0.24em]", gender === "men" ? "text-[#7C3AED]" : gender === "women" ? "text-[#A855F7]" : "text-[#818CF8]")}>
                                  {gender}
                                </span>
                                <ChevronDown className={cn("h-4 w-4 transition-transform", categoryGroupsOpen[gender] ? "rotate-180" : "")} style={{ color: "var(--text-secondary)" }} />
                              </button>
                              <AnimatePresence initial={false}>
                                {categoryGroupsOpen[gender] ? (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="grid gap-1 border-t px-3 py-3" style={{ borderColor: "var(--border-subtle)" }}>
                                      {groupedCategories[gender].map((category) => (
                                        <Link key={category._id} href={`/products?category=${category.slug}&gender=${gender}`} onClick={onClose} className="rounded-lg px-2 py-2 text-sm transition hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
                                          {category.name}
                                        </Link>
                                      ))}
                                      {!groupedCategories[gender].length ? (
                                        <p className="px-2 py-2 text-sm" style={{ color: "var(--text-tertiary)" }}>No categories yet</p>
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
                <div className="pt-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
                    Colorway
                  </p>
                  <div className="grid gap-2">
                    {themeOptions.map((option) => {
                      const active = option.name === theme;

                      return (
                        <button
                          key={option.name}
                          type="button"
                          onClick={(event) => {
                            setTheme(option.name, event.clientX, event.clientY);
                            persistTheme(option.name, session?.user.id);
                            window.setTimeout(() => onClose(), 100);
                          }}
                          className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-left"
                          style={{
                            borderColor: active ? "var(--border-strong)" : "var(--border-default)",
                            background: active ? "var(--accent-muted)" : "var(--bg-secondary)",
                          }}
                        >
                          <span className="h-4 w-4 rounded-full" style={{ background: option.color }} />
                          <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {option.label}
                          </span>
                          {active ? <Check className="h-4 w-4" style={{ color: "var(--accent-primary)" }} /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t px-5 py-5" style={{ borderColor: "var(--border-default)", background: "var(--bg-elevated)" }}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
                {isLoggedIn ? "Session" : "Account"}
              </p>
              <div className="grid gap-2">
                {isLoggedIn ? (
                  <>
                    {mobileUtilityLinks.length ? mobileUtilityLinks.map((link) => (
                      <Link key={link.href} href={link.href} onClick={onClose} className="rounded-2xl border px-4 py-3 text-sm transition hover:bg-white/5" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>
                        {link.label}
                      </Link>
                    )) : null}
          <button type="button" onClick={() => void requestSignOut()} className="rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-on-accent)]" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)" }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={onClose} className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>
                      Login
                    </Link>
        <Link href="/register" onClick={onClose} className="rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-on-accent)]" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)" }}>
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
