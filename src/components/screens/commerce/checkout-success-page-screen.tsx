"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PageShell } from "@/components/screens/shared";

export function CheckoutSuccessPageScreen() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("order");
  return (
    <PageShell>
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-2xl rounded-[36px] border border-[#1F1F1F] bg-[#111111] p-8 text-center sm:p-10">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#4F46E5]/14 text-[#A5B4FC]"><Check className="h-12 w-12" /></div>
          <h1 className="mt-6 text-4xl font-black uppercase">Order Placed!</h1>
          {orderId ? <p className="mt-5 text-sm text-[#BDBDBD]">Order ID: <span className="font-semibold text-white">{orderId}</span></p> : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href={orderId ? `/orders/${orderId}` : "/orders"} className="inline-flex h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-6 text-sm font-semibold text-[#F8FAFC]">Track Order</Link><Link href="/products" className="inline-flex h-12 items-center justify-center rounded-xl border border-[#1F1F1F] px-6 text-sm font-semibold text-white">Continue Shopping</Link></div>
        </motion.div>
      </main>
    </PageShell>
  );
}
