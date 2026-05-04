/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Layers3, MonitorSmartphone, Search, Sparkles, Store, Workflow } from "lucide-react";
import Link from "next/link";
import { type ComponentType, type ReactNode, useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/screens/shared";

function MotionSection({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <section className={className}>{children}</section>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function CountUpStat({
  value,
  suffix = "",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion || !inView) {
      if (reduceMotion) setDisplayValue(value);
      return;
    }

    const controls = animate(0, value, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(10,14,23,0.9))] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur xl:p-6"
    >
      <div className="text-[2.1rem] font-black uppercase tracking-[-0.04em] text-[#F4F1EA] sm:text-[2.4rem]">
        {displayValue}
        {suffix}
      </div>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">{label}</p>
    </motion.div>
  );
}

function PlatformFeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  index: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? {} : { y: -6, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 backdrop-blur transition-colors duration-300 hover:border-[#6366F1]/28 sm:p-6"
    >
      <motion.div
        aria-hidden
        className="absolute inset-x-8 top-0 h-24 rounded-full bg-[#4F46E5]/18 blur-3xl"
        animate={reduceMotion ? {} : { opacity: [0.2, 0.4, 0.2], y: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: index * 0.35 }}
      />
      <div className="relative">
        <div className="inline-flex rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/14 p-3 text-[#C7D2FE] transition-colors duration-300 group-hover:border-[#6366F1]/34 group-hover:bg-[#4F46E5]/18">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[#A8A29A]">{description}</p>
      </div>
    </motion.div>
  );
}

function StoryBlock({
  eyebrow,
  title,
  copy,
  aside,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  aside: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,21,35,0.94),rgba(10,14,23,0.96))] p-6 shadow-[0_40px_140px_rgba(15,23,42,0.32)] sm:p-8 lg:grid-cols-[0.9fr,1.1fr] lg:p-10">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: -24 }}
        whileInView={reduceMotion ? {} : { opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">{eyebrow}</p>
        <h2 className="mt-4 text-[2rem] font-black uppercase leading-[0.95] tracking-[-0.03em] text-[#F4F1EA] sm:text-[2.5rem]">
          {title}
        </h2>
        <p className="mt-4 max-w-[34rem] text-sm leading-7 text-[#A8A29A] sm:text-[15px]">{copy}</p>
      </motion.div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 24 }}
        whileInView={reduceMotion ? {} : { opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        {aside}
      </motion.div>
    </div>
  );
}

export function StyleHubPlatformPageScreen() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 80]);
  const orbOpacity = useTransform(scrollYProgress, [0, 1], [0.75, 0.24]);
  const heroCopy = [
    "StyleHub is the flagship layer of a complete commerce platform.",
    "The experience is shaped through polished discovery, smoother transitions, responsive structure, and the operational systems that keep the storefront credible behind the scenes.",
  ];

  return (
    <PageShell>
      <main className="relative overflow-hidden pb-20">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(79,70,229,0.18),transparent_30%),radial-gradient(circle_at_50%_75%,rgba(30,41,59,0.42),transparent_40%)]"
          style={{ opacity: orbOpacity }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[-10%] top-28 h-[360px] w-[360px] rounded-full bg-[#4F46E5]/18 blur-[120px]"
          style={{ y: orbY }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-44 h-[320px] w-[320px] rounded-full bg-[#6366F1]/14 blur-[120px]"
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -60]) }}
        />

        <section ref={heroRef} className="relative px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-20">
          <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[1.02fr,0.98fr] lg:gap-10">
            <div className="space-y-8">
              <motion.span
                initial={reduceMotion ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex rounded-full border border-[#6366F1]/30 bg-[#4F46E5]/12 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#C7D2FE]"
              >
                StyleHub Platform
              </motion.span>

              <div className="space-y-4">
                {["More Than", "A Shopping", "Site"].map((line, index) => (
                  <motion.div
                    key={line}
                    initial={reduceMotion ? false : { opacity: 0, y: 30, filter: "blur(14px)" }}
                    animate={reduceMotion ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.78,
                      delay: index * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="overflow-hidden"
                  >
                    <h1 className="text-[3.2rem] font-black uppercase leading-[0.88] tracking-[-0.05em] text-[#F4F1EA] sm:text-[4.4rem] lg:text-[5.8rem]">
                      {line}
                    </h1>
                  </motion.div>
                ))}
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-[42rem] text-[15px] leading-8 text-[#B8B6B0] sm:text-base"
                >
                  StyleHub is designed as a connected commerce system. The storefront, seller workspace, and admin controls move with the same premium rhythm while staying grounded in real product, order, inventory, and merchandising logic.
                </motion.p>
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap gap-3"
              >
                <Link
                  href="/products"
                  className="group inline-flex h-11 items-center justify-center rounded-full border border-[#6366F1] bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F8FAFC] shadow-[0_14px_40px_rgba(79,70,229,0.26)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95"
                >
                  Explore Store
                </Link>
                <Link
                  href="/search"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.035] px-5 text-[12px] font-medium uppercase tracking-[0.16em] text-[#D6D3D1] transition duration-300 hover:border-white/24 hover:bg-white/[0.07] hover:text-[#F4F1EA]"
                >
                  Browse Products
                </Link>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8E99C8]"
              >
                <span className="h-px w-10 bg-gradient-to-r from-[#6366F1] to-transparent" />
                Smooth by design
              </motion.div>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute inset-x-12 top-8 h-24 rounded-full bg-[#4F46E5]/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(12,17,28,0.98),rgba(8,11,18,0.98))] p-5 shadow-[0_40px_140px_rgba(10,14,23,0.55)] sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Premium UI", value: "Refined hierarchy with layered motion and cleaner emphasis." },
                    { label: "Responsive", value: "Tuned across mobile, tablet, laptop, and wide layouts." },
                    { label: "Connected", value: "Storefront, seller, and admin all use one commerce core." },
                    { label: "Operational", value: "Real merchandising, payouts, moderation, and inventory behind the interface." },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: 0.38 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={reduceMotion ? {} : { y: -4 }}
                      className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">{item.label}</p>
                      <p className="mt-4 text-sm leading-7 text-[#D6D3D1]">{item.value}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  animate={reduceMotion ? {} : { y: [0, -6, 0] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                  className="mt-5 rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(79,70,229,0.14),rgba(255,255,255,0.02))] p-5"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <CountUpStat value={3} label="Connected modes" />
                    <CountUpStat value={4} label="Responsive tiers" />
                    <CountUpStat value={100} suffix="%" label="Shared platform" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <MotionSection className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8" delay={0.04}>
          <StoryBlock
            eyebrow="What StyleHub Is"
            title="A full shopping platform, not only a listing surface"
            copy="The storefront is only one layer. StyleHub connects discovery, cart, checkout, seller workflows, merchandising, inventory visibility, and operational controls so the user experience stays coherent from browsing to fulfillment."
            aside={
              <div className="grid gap-4 md:grid-cols-3">
                <PlatformFeatureCard index={0} icon={Store} title="Commerce Frontend" description="Editorial browsing, cleaner discovery, responsive product surfaces, and a smoother purchase flow." />
                <PlatformFeatureCard index={1} icon={Workflow} title="Operational Core" description="Real orders, coupon rules, stock updates, shipping settings, and session-aware behavior behind the interface." />
                <PlatformFeatureCard index={2} icon={Layers3} title="Multi-Surface System" description="Storefront, admin, and seller tools stay aligned through one shared platform instead of disconnected apps." />
              </div>
            }
          />
        </MotionSection>

        <MotionSection className="mx-auto mt-10 max-w-[1280px] px-4 sm:mt-12 sm:px-6 lg:mt-14 lg:px-8" delay={0.06}>
          <div className="grid gap-4 lg:grid-cols-2">
            <PlatformFeatureCard index={0} icon={Sparkles} title="What Makes It Different" description="The design is treated as a system. Navigation, state changes, surfaces, and page rhythm stay consistent while each mode keeps its own purpose." />
            <PlatformFeatureCard index={1} icon={Search} title="Built For Better Discovery" description="Browsing, filtering, search, and featured rails are shaped to feel clearer and faster, with less noise between the user and the product." />
            <PlatformFeatureCard index={2} icon={MonitorSmartphone} title="Responsive Everywhere" description="The platform is tuned across phones, tablets, laptops, and wide desktop screens so quality does not collapse at the edges." />
            <PlatformFeatureCard index={3} icon={Workflow} title="More Than A Frontend" description="Merchandising controls, inventory visibility, review moderation, payouts, and seller operations support the live shopping experience." />
          </div>
        </MotionSection>

        <MotionSection className="mx-auto mt-10 max-w-[1280px] px-4 sm:mt-12 sm:px-6 lg:mt-14 lg:px-8" delay={0.08}>
          <StoryBlock
            eyebrow="Smooth By Design"
            title="Motion that supports flow instead of competing with it"
            copy="Transitions are tuned to make the platform feel responsive, calm, and clear. Cards lift lightly, rails move with control, drawers settle cleanly, and state changes feel intentional instead of abrupt."
            aside={
              <div className="grid gap-4 sm:grid-cols-2">
                {heroCopy.map((copy, index) => (
                  <motion.div
                    key={copy}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                    whileInView={reduceMotion ? {} : { opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.62, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 text-sm leading-7 text-[#CFC9BE]"
                  >
                    {copy}
                  </motion.div>
                ))}
              </div>
            }
          />
        </MotionSection>

        <MotionSection className="mx-auto mt-10 max-w-[1280px] px-4 sm:mt-12 sm:px-6 lg:mt-14 lg:px-8" delay={0.1}>
          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,30,0.98),rgba(10,14,23,0.96))] p-6 shadow-[0_50px_180px_rgba(15,23,42,0.34)] sm:p-8 lg:p-10">
            <motion.div
              aria-hidden
              className="absolute inset-y-10 left-[-8%] w-[240px] rounded-full bg-[#4338CA]/18 blur-[110px]"
              animate={reduceMotion ? {} : { x: [0, 18, 0], opacity: [0.18, 0.3, 0.18] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute inset-y-16 right-[-8%] w-[240px] rounded-full bg-[#6366F1]/16 blur-[110px]"
              animate={reduceMotion ? {} : { x: [0, -14, 0], opacity: [0.14, 0.26, 0.14] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[0.82fr,1.18fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">Responsive Everywhere</p>
                <h2 className="mt-4 text-[2rem] font-black uppercase leading-[0.95] tracking-[-0.03em] text-[#F4F1EA] sm:text-[2.5rem]">
                  One brand system across every screen size
                </h2>
                <p className="mt-4 max-w-[34rem] text-sm leading-7 text-[#A8A29A] sm:text-[15px]">
                  StyleHub is composed so the premium feel survives mobile compression, tablet browsing, laptop shopping, and wide-screen merchandising. Motion scales down where needed, but the experience stays deliberate.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: "Mobile", value: "Compact navigation, cleaner cards, and touch-friendly motion." },
                  { label: "Tablet", value: "Balanced discovery rails, stronger spacing, and adaptive layouts." },
                  { label: "Desktop", value: "Editorial composition, richer transitions, and clearer hierarchy." },
                  { label: "Wide Screens", value: "Confident width usage without oversized or empty-feeling surfaces." },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={reduceMotion ? {} : { y: -4 }}
                    className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">{item.label}</p>
                    <p className="mt-3 text-sm leading-7 text-[#D6D3D1]">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </MotionSection>

        <MotionSection className="mx-auto mt-10 max-w-[1280px] px-4 sm:mt-12 sm:px-6 lg:mt-14 lg:px-8" delay={0.12}>
          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(11,14,22,0.98),rgba(9,12,19,0.98))] p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">Final CTA</p>
                <h2 className="mt-4 text-[2rem] font-black uppercase leading-[0.95] tracking-[-0.03em] text-[#F4F1EA] sm:text-[2.5rem]">
                  See the platform, then jump back into the store
                </h2>
                <p className="mt-4 max-w-[34rem] text-sm leading-7 text-[#A8A29A] sm:text-[15px]">
                  StyleHub is built to make discovery, shopping, seller operations, and admin control feel like one connected system.
                </p>
              </div>
              <motion.div whileHover={reduceMotion ? {} : { y: -3 }} whileTap={reduceMotion ? {} : { scale: 0.985 }}>
                <Link
                  href="/products"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#6366F1]/60 bg-[linear-gradient(135deg,rgba(79,70,229,0.95),rgba(67,56,202,0.88))] px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F8FAFC] shadow-[0_18px_50px_rgba(79,70,229,0.28)] transition duration-300 hover:brightness-110 active:brightness-95"
                >
                  Start shopping
                  <motion.span
                    className="inline-flex"
                    animate={reduceMotion ? {} : { x: [0, 4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
              </motion.div>
            </div>
          </div>
        </MotionSection>
      </main>
    </PageShell>
  );
}
