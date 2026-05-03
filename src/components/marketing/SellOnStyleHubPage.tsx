"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useInView } from "react-intersection-observer";
import VendorApplyModal from "@/components/ui/VendorApplyModal";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 10000, suffix: "+", label: "Active Buyers", icon: "👥", color: "#3B82F6" },
  { value: 2, prefix: "₹", suffix: "Cr+", label: "Paid to Sellers", icon: "💰", color: "#22C55E" },
  { value: 200, suffix: "+", label: "Active Vendors", icon: "🏪", color: "#818CF8" },
  { value: 90, suffix: "%", label: "Seller Keep Rate", icon: "📊", color: "#A855F7" },
];

const benefits = [
  { icon: "💳", title: "Zero Setup Cost", desc: "No registration fees. No monthly charges. Pay nothing until you make your first sale.", accent: "#A855F7" },
  { icon: "💰", title: "Keep 90% of Every Sale", desc: "We take only 10% commission. Your hard work, your money.", accent: "#22C55E" },
  { icon: "📊", title: "Real-time Analytics", desc: "Track sales, revenue, and customer behavior with a powerful seller dashboard.", accent: "#3B82F6" },
  { icon: "⚡", title: "Fast Weekly Payouts", desc: "Get paid every week directly to your bank account.", accent: "#6366F1" },
  { icon: "📣", title: "Free Marketing Exposure", desc: "Your products can be featured in homepage drops, categories, and social campaigns.", accent: "#FF4500" },
  { icon: "🎯", title: "Seller Success Team", desc: "Dedicated support to help you grow with better listings and pricing.", accent: "#EC4899" },
];

const testimonials = [
  { name: "Arjun K.", shop: "NightCircuit", location: "Mumbai", earning: "₹1.2L/month", quote: "Started with just 5 products. Now I have 48 listings and StyleHub is my primary income." },
  { name: "Priya S.", shop: "SoftRiot", location: "Delhi", earning: "₹67K/month", quote: "StyleHub's buyer demographic is exactly my target. Sales doubled in 3 months." },
  { name: "Rishi M.", shop: "GroundTheory", location: "Bangalore", earning: "₹2.3L/month", quote: "The 90% revenue share is real. I get paid every Friday without fail." },
  { name: "Sneha P.", shop: "FormCo", location: "Ahmedabad", earning: "₹45K/month", quote: "Even with limited inventory, the earnings are solid. The seller support team actually responds fast." },
  { name: "Vikram D.", shop: "MetroUnit", location: "Chennai", earning: "₹89K/month", quote: "Moved from Instagram DMs to StyleHub. Orders, tracking, payouts — all automated." },
];

const faqs = [
  ["How long does approval take?", "We review all applications within 24-48 hours on business days. You'll receive an email with our decision."],
  ["Is there any fee to join?", "Zero. No registration fees, no monthly charges, and no listing fees. We only earn when you earn — 10% of each sale."],
  ["When do I get paid?", "Payouts are processed every Friday to your registered bank account. Minimum payout amount is ₹500."],
  ["How many products can I list?", "Approved sellers can list unlimited products. We recommend starting with your best 10-20 products and expanding from there."],
  ["Do I handle shipping?", "Currently sellers manage their own shipping. Shiprocket and Delhivery integrations are planned next."],
  ["What products can I sell?", "StyleHub focuses on fashion and streetwear: clothing, footwear, accessories, and lifestyle products. No electronics or food."],
  ["Can I sell if I'm an individual?", "Yes. Individuals, freelancers, and small businesses are all welcome. You don't need a registered company to apply."],
  ["What if my application is rejected?", "We'll tell you exactly why and you can reapply after making improvements. Common reasons are incomplete information or products outside our categories."],
];

function SectionBadge({ children }: { children: React.ReactNode }) {
  return <span style={{ display: "inline-flex", borderRadius: 999, border: "1px solid rgba(129,140,248,0.24)", background: "rgba(99,102,241,0.1)", color: "#C7D2FE", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "6px 16px" }}>{children}</span>;
}

function StatCard({ stat, index }: { stat: (typeof stats)[number]; index: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.35 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const target = { value: 0 };
    const tween = gsap.to(target, { value: stat.value, duration: 2, ease: "power2.out", onUpdate: () => setCount(Math.round(target.value)) });
    return () => {
      tween.kill();
    };
  }, [inView, stat.value]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
      <div style={{ fontSize: 48, fontWeight: 800, color: stat.color }}>{stat.prefix || ""}{count}{stat.suffix || ""}</div>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "#888" }}>{stat.label}</p>
    </motion.div>
  );
}

function DashboardMockup() {
  const [toastVisible, setToastVisible] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setToastVisible(false);
      window.setTimeout(() => setToastVisible(true), 500);
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <AnimatePresence>{toastVisible ? <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} style={{ position: "absolute", top: -14, right: 18, zIndex: 2, borderRadius: 12, border: "1px solid rgba(34,197,94,0.2)", background: "rgba(17,17,17,0.94)", padding: "10px 14px", fontSize: 13 }}>🎉 New order! ₹2,499 — Oversized Hoodie</motion.div> : null}</AnimatePresence>
      <div style={{ border: "1px solid #1F1F1F", borderRadius: 16, overflow: "hidden", background: "#111" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, padding: 20, borderBottom: "1px solid #1F1F1F" }}>
          {[
            ["Revenue", "₹4.7L", "#818CF8"],
            ["Orders", "186", "#22C55E"],
            ["Products", "48", "#3B82F6"],
          ].map(([label, value, color]) => <div key={label} style={{ border: "1px solid #1F1F1F", borderRadius: 12, padding: 14, background: "#0D0D0D" }}><p style={{ margin: 0, fontSize: 11, color: "#666", letterSpacing: 2, textTransform: "uppercase" }}>{label}</p><p style={{ margin: "10px 0 0", fontSize: 24, fontWeight: 800, color }}>{value}</p></div>)}
        </div>
        <div style={{ padding: 20, borderBottom: "1px solid #1F1F1F" }}>
          <div style={{ height: 160, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, alignItems: "end" }}>
            {[60, 95, 70, 120, 100, 140, 110].map((height, index) => <div key={index} style={{ height, borderRadius: 10, background: "linear-gradient(180deg, rgba(245,245,0,0.95), rgba(245,245,0,0.18))" }} />)}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {[
            ["#SH-4021", "Black Cargo Jacket", "₹2,499"],
            ["#SH-4013", "Acid Wash Tee", "₹1,199"],
            ["#SH-4008", "Utility Cap", "₹799"],
          ].map(([order, item, total]) => <div key={order} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "12px 0", borderBottom: "1px solid #1A1A1A" }}><div><p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{order}</p><p style={{ margin: "4px 0 0", fontSize: 12, color: "#777" }}>{item}</p></div><span style={{ color: "#C7D2FE", fontSize: 13, fontWeight: 700 }}>{total}</span></div>)}
        </div>
      </div>
    </div>
  );
}

export default function SellOnStyleHubPage() {
  const [vendorOpen, setVendorOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [products, setProducts] = useState(20);
  const [price, setPrice] = useState(1499);
  const [orders, setOrders] = useState(50);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const finalHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const sectionTitles = useRef<Array<HTMLHeadingElement | null>>([]);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(10,10,10,0)", "rgba(17,17,17,0.88)"]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0.2 });
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!heroHeadingRef.current || !finalHeadingRef.current) return;
    const words = heroHeadingRef.current.querySelectorAll("[data-word]");
    const finalChars = finalHeadingRef.current.querySelectorAll("[data-char]");

    gsap.set(words, { y: 60, opacity: 0 });
    gsap.to(words, { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: "power3.out", delay: 0.2 });

    gsap.set(finalChars, { y: 80, opacity: 0, rotateX: 90, transformOrigin: "50% 50% -60" });
    gsap.to(finalChars, {
      scrollTrigger: { trigger: finalHeadingRef.current, start: "top 75%" },
      y: 0,
      opacity: 1,
      rotateX: 0,
      stagger: 0.02,
      duration: 0.55,
      ease: "power3.out",
    });

    sectionTitles.current.forEach((node) => {
      if (!node) return;
      gsap.fromTo(node, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 85%" } });
    });

    return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }, []);

  const gross = orders * price;
  const fee = Math.round(gross * 0.1);
  const net = gross - fee;
  const annual = net * 12;
  const perOrder = Math.round(price * 0.9);
  const breakEven = Math.ceil(5000 / Math.max(price, 1));
  const finalChars = useMemo(() => "Ready to start".split(""), []);

  return (
    <>
      <motion.header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 80, background: navBg, backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(31,31,31,0.75)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", textDecoration: "none", fontWeight: 800, letterSpacing: 1 }}>
            <span style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#F8FAFC", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>S</span>
            STYLEHUB
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: 14 }}>For Buyers</Link>
            <button onClick={() => setVendorOpen(true)} style={{ height: 42, borderRadius: 999, border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#F8FAFC", padding: "0 18px", fontWeight: 800, cursor: "pointer" }}>Apply Now</button>
          </div>
        </div>
      </motion.header>

      <main style={{ background: "#0A0A0A", color: "#fff", overflow: "hidden" }}>
        <section ref={heroRef} style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", padding: "96px 20px 60px" }}>
          <motion.div animate={{ y: [-20, 20] }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 8 }} style={{ position: "absolute", top: -80, right: -120, width: 600, height: 600, borderRadius: "50%", filter: "blur(120px)", background: "rgba(139,92,246,0.15)" }} />
          <motion.div animate={{ y: [20, -20] }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 8 }} style={{ position: "absolute", bottom: -120, left: -80, width: 400, height: 400, borderRadius: "50%", filter: "blur(100px)", background: "rgba(99,102,241,0.08)" }} />

          <div className="sell-hero-grid" style={{ maxWidth: 1320, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr", gap: 40, alignItems: "center", position: "relative", zIndex: 1 }}>
            <div style={{ maxWidth: 640 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}><SectionBadge>🔥 Join 200+ sellers on StyleHub</SectionBadge></motion.div>
              <h1 ref={heroHeadingRef} style={{ margin: "22px 0 0", fontSize: "clamp(48px,8vw,96px)", fontWeight: 800, lineHeight: 0.95, letterSpacing: -2 }}>
                {["YOUR BRAND.", "OUR PLATFORM.", "YOUR PROFIT."].map((line, lineIndex) => <div key={line} style={{ color: lineIndex === 1 ? "#818CF8" : "#fff" }}>{line.split(" ").map((word, index) => <span key={`${word}-${index}`} data-word style={{ display: "inline-block", marginRight: 18 }}>{word}</span>)}</div>)}
              </h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} style={{ fontSize: 18, color: "#888", lineHeight: 1.7, maxWidth: 480, marginTop: 20 }}>Start selling your streetwear to thousands of buyers across India. Zero setup fees. Keep 90% of every sale.</motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
                <button onClick={() => setVendorOpen(true)} style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#F8FAFC", border: "none", borderRadius: 10, padding: "16px 32px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Start Selling Free →</button>
                <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", color: "#fff", border: "1px solid #2A2A2A", borderRadius: 10, padding: "16px 28px", fontSize: 15, cursor: "pointer" }}>See how it works ↓</button>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center" }}>{["AK", "PS", "RM", "SP", "VD"].map((initials, index) => <div key={initials} style={{ width: 32, height: 32, borderRadius: "50%", marginLeft: index ? -10 : 0, border: "2px solid #0A0A0A", background: ["#A855F7", "#F59E0B", "#22C55E", "#3B82F6", "#EC4899"][index], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{initials}</div>)}</div>
                <span style={{ color: "#888", fontSize: 13 }}>Join 200+ sellers already earning</span>
                <span style={{ color: "#F59E0B", fontSize: 14 }}>★★★★★</span>
              </motion.div>
            </div>
            <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="sell-hero-right" style={{ display: "none", position: "relative", minHeight: 420 }}>
              <motion.div animate={{ y: [-10, 10] }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 4 }} style={{ position: "absolute", top: 10, right: 80, borderRadius: 10, border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.1)", color: "#22C55E", padding: "8px 16px", fontSize: 13, fontWeight: 700 }}>₹47,230 earned this month</motion.div>
            </motion.div>
          </div>
          <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", textAlign: "center", color: "#555", fontSize: 12 }}><motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>↓</motion.div>Scroll to explore</div>
        </section>
        <section style={{ background: "#0D0D0D", borderTop: "1px solid #1F1F1F", borderBottom: "1px solid #1F1F1F", padding: "60px 20px" }}>
          <div className="sell-stats-grid" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gap: 20, gridTemplateColumns: "repeat(4,1fr)" }}>{stats.map((stat, index) => <StatCard key={stat.label} stat={stat} index={index} />)}</div>
        </section>
        <section id="how-it-works" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 20px" }}>
          <div style={{ textAlign: "center" }}>
            <SectionBadge>Simple Process</SectionBadge>
            <h2 ref={(node) => { sectionTitles.current[0] = node; }} style={{ margin: "18px 0 10px", fontSize: 42, fontWeight: 800 }}>Start selling in 3 steps</h2>
            <p style={{ color: "#888", fontSize: 16 }}>No technical skills needed. No upfront costs. Just your products.</p>
          </div>
          <div className="sell-three-grid" style={{ marginTop: 46, display: "grid", gap: 18, gridTemplateColumns: "repeat(3,1fr)" }}>
            {[
              ["01", "📝", "Apply in minutes", "Fill out our simple 3-step application form. Tell us about your brand and products.", "#6366F1", "#F8FAFC"],
              ["02", "✅", "Get approved fast", "Our team reviews applications within 24-48 hours. We look for genuine sellers with quality products.", "#A855F7", "#fff"],
              ["03", "💸", "Start earning", "List products, receive orders, and get paid directly to your bank account every week.", "#22C55E", "#fff"],
            ].map(([step, icon, title, desc, bg, text], index) => <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15 }} style={{ background: "#111", border: "1px solid #1F1F1F", borderRadius: 16, padding: "32px 28px" }}><motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 240, damping: 18, delay: index * 0.15 }} style={{ width: 48, height: 48, borderRadius: 12, background: bg, color: text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>{step}</motion.div><div style={{ fontSize: 32, marginTop: 18 }}>{icon}</div><h3 style={{ margin: "16px 0 0", fontSize: 20, fontWeight: 700 }}>{title}</h3><p style={{ margin: "10px 0 0", color: "#888", fontSize: 14, lineHeight: 1.7 }}>{desc}</p></motion.div>)}
          </div>
        </section>
        <section style={{ background: "linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 100%)", padding: "100px 20px" }}>
          <div className="sell-benefits-layout" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gap: 28, gridTemplateColumns: "0.9fr 1.1fr", alignItems: "start" }}>
            <div style={{ position: "sticky", top: 90 }}>
              <SectionBadge>Seller Benefits</SectionBadge>
              <h2 ref={(node) => { sectionTitles.current[1] = node; }} style={{ margin: "18px 0 12px", fontSize: 40, lineHeight: 1.2, fontWeight: 800 }}>Everything you need to run a successful online store</h2>
              <p style={{ color: "#888", lineHeight: 1.7, maxWidth: 420 }}>We handle the platform. You handle the products.</p>
              <button onClick={() => setVendorOpen(true)} style={{ marginTop: 24, height: 46, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#F8FAFC", padding: "0 24px", fontWeight: 800, cursor: "pointer" }}>Apply as Vendor →</button>
            </div>
            <div className="sell-benefits-grid" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2,1fr)" }}>{benefits.map((benefit, index) => <motion.div key={benefit.title} initial={{ opacity: 0, y: 24, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} style={{ background: "#111", border: "1px solid #1F1F1F", borderRadius: 14, padding: 24 }}><div style={{ width: 52, height: 52, borderRadius: 14, background: `${benefit.accent}25`, border: `1px solid ${benefit.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{benefit.icon}</div><h3 style={{ margin: "14px 0 0", fontSize: 16, fontWeight: 700 }}>{benefit.title}</h3><p style={{ margin: "8px 0 0", color: "#888", fontSize: 14, lineHeight: 1.6 }}>{benefit.desc}</p></motion.div>)}</div>
          </div>
        </section>
        <section style={{ background: "#111", borderTop: "1px solid #1F1F1F", borderBottom: "1px solid #1F1F1F", padding: "100px 20px" }}>
          <div className="sell-calculator-layout" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gap: 28, gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <SectionBadge>Earnings Calculator</SectionBadge>
              <h2 ref={(node) => { sectionTitles.current[2] = node; }} style={{ margin: "18px 0 10px", fontSize: 42, fontWeight: 800 }}>How much can you earn?</h2>
              <p style={{ color: "#888", fontSize: 16, marginBottom: 28 }}>Move the sliders to see your potential monthly earnings</p>
              {[
                { label: "Products Listed", value: products, setter: setProducts, min: 1, max: 100, suffix: " products" },
                { label: "Average Product Price", value: price, setter: setPrice, min: 299, max: 9999, suffix: "" },
                { label: "Monthly Orders", value: orders, setter: setOrders, min: 1, max: 500, suffix: " orders" },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 26 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ color: "#C7D2FE", fontWeight: 700 }}>{item.label === "Average Product Price" ? `₹${item.value}` : `${item.value}${item.suffix}`}</span>
                  </div>
                  <input type="range" min={item.min} max={item.max} value={item.value} onChange={(e) => item.setter(Number(e.target.value))} style={{ width: "100%", accentColor: "#6366F1" }} />
                </div>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <div style={{ background: "linear-gradient(135deg, rgba(245,245,0,0.06), rgba(245,245,0,0.02))", border: "1px solid rgba(245,245,0,0.15)", borderRadius: 16, padding: 32 }}>
                <p style={{ margin: 0, fontSize: 11, color: "#888", letterSpacing: 3, textTransform: "uppercase" }}>Monthly Earnings</p>
                <div style={{ marginTop: 14, fontSize: 56, fontWeight: 800, color: "#C7D2FE" }}>₹{net}</div>
                <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
                  {[
                    ["Gross Revenue", `₹${gross}`, "#fff"],
                    ["StyleHub Fee (10%)", `-₹${fee}`, "#EF4444"],
                    ["Your Earnings", `₹${net}`, "#22C55E"],
                  ].map(([label, value, color]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "#888" }}>{label}</span><span style={{ color, fontWeight: 700 }}>{value}</span></div>)}
                  <div style={{ height: 1, background: "#1F1F1F", marginTop: 6 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: "#888" }}>Annual Potential</span><span style={{ color: "#C7D2FE", fontWeight: 800 }}>₹{annual}</span></div>
                </div>
              </div>
              <div className="sell-mini-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3,1fr)", marginTop: 14 }}>{[["Per Order", `₹${perOrder}`], ["Break-even", `${breakEven} orders`], ["ROI", "∞ (no setup cost)"]].map(([label, value]) => <div key={label} style={{ background: "#0D0D0D", border: "1px solid #1F1F1F", borderRadius: 14, padding: 16 }}><p style={{ margin: 0, color: "#666", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>{label}</p><p style={{ margin: "10px 0 0", fontSize: 18, fontWeight: 800 }}>{value}</p></div>)}</div>
              <p style={{ marginTop: 12, color: "#555", fontSize: 11 }}>Estimates only. Actual earnings vary.</p>
            </motion.div>
          </div>
        </section>
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "100px 20px" }}>
          <div className="sell-dashboard-layout" style={{ display: "grid", gap: 28, gridTemplateColumns: "0.9fr 1.1fr", alignItems: "center" }}>
            <div>
              <SectionBadge>Seller Tools</SectionBadge>
              <h2 ref={(node) => { sectionTitles.current[3] = node; }} style={{ margin: "18px 0 14px", fontSize: 42, lineHeight: 1.15, fontWeight: 800 }}>Your seller dashboard, built for growth</h2>
              <div style={{ display: "grid", gap: 18 }}>{[["Real-time order notifications", "Get notified the moment someone buys"], ["Inventory management", "Track stock per color, size, variant"], ["Revenue analytics", "Daily, weekly, monthly charts"], ["Payout history", "Complete payout records and requests"]].map(([title, desc]) => <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ color: "#A5B4FC", fontWeight: 900 }}>✓</span><div><p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</p><p style={{ margin: "6px 0 0", color: "#888", lineHeight: 1.6 }}>{desc}</p></div></div>)}</div>
            </div>
            <motion.div initial={{ opacity: 0, x: 80 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}><DashboardMockup /></motion.div>
          </div>
        </section>
        <section style={{ background: "#0D0D0D", padding: "100px 20px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <SectionBadge>Seller Stories</SectionBadge>
            <h2 ref={(node) => { sectionTitles.current[4] = node; }} style={{ margin: "18px 0 30px", fontSize: 42, fontWeight: 800 }}>Sellers love StyleHub</h2>
            <div className="testimonial-scroll" style={{ overflow: "hidden" }}>
              <div className="testimonial-track" style={{ display: "flex", gap: 20, width: "max-content" }}>{[...testimonials, ...testimonials].map((testimonial, index) => <motion.article key={`${testimonial.name}-${index}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (index % testimonials.length) * 0.08 }} style={{ minWidth: 320, maxWidth: 360, borderRadius: 14, border: "1px solid #1F1F1F", background: "#111", padding: 24, position: "relative" }}><div style={{ position: "absolute", top: -2, left: 14, fontSize: 80, lineHeight: 1, color: "rgba(245,245,0,0.22)", fontWeight: 900 }}>&ldquo;</div><div style={{ position: "relative", zIndex: 1 }}><div style={{ color: "#F59E0B", fontSize: 14, marginBottom: 16 }}>★★★★★</div><p style={{ margin: 0, color: "#888", fontSize: 15, lineHeight: 1.7, fontStyle: "italic" }}>{testimonial.quote}</p><div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22 }}><div style={{ width: 42, height: 42, borderRadius: "50%", background: ["#A855F7", "#22C55E", "#3B82F6", "#EC4899", "#F59E0B"][index % 5], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{testimonial.name.split(" ").map((part) => part[0]).join("")}</div><div><p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{testimonial.name}</p><p style={{ margin: "3px 0 0", color: "#888", fontSize: 12 }}>{testimonial.shop} · {testimonial.location}</p></div><span style={{ marginLeft: "auto", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "#22C55E", padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>{testimonial.earning}</span></div></div></motion.article>)}</div>
            </div>
          </div>
        </section>
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 20px" }}>
          <div style={{ textAlign: "center" }}>
            <SectionBadge>Why StyleHub</SectionBadge>
            <h2 ref={(node) => { sectionTitles.current[5] = node; }} style={{ margin: "18px 0 26px", fontSize: 42, fontWeight: 800 }}>The best deal for sellers</h2>
          </div>
          <div style={{ border: "1px solid #1F1F1F", borderRadius: 16, overflow: "hidden", background: "#111" }}>
            <div className="sell-table-row" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", padding: "14px 18px", background: "#0D0D0D", color: "#666", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}><div>Platform</div><div>Commission</div><div>Payout</div><div>Setup</div></div>
            {[
              { platform: "StyleHub", commission: "10%", payout: "Weekly", setup: "Free", highlight: true },
              { platform: "Amazon", commission: "15-25%", payout: "14 days", setup: "₹999/year", highlight: false },
              { platform: "Meesho", commission: "12-18%", payout: "15 days", setup: "Free", highlight: false },
              { platform: "Myntra", commission: "20-30%", payout: "30 days", setup: "Approval needed", highlight: false },
            ].map((row) => <div key={row.platform} className="sell-table-row" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", padding: "16px 18px", borderTop: "1px solid #1A1A1A", background: row.highlight ? "rgba(99,102,241,0.06)" : "transparent" }}><div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>{row.platform}{row.highlight ? <span style={{ borderRadius: 999, background: "rgba(99,102,241,0.14)", color: "#C7D2FE", padding: "4px 8px", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Best</span> : null}</div><div style={{ color: row.highlight ? "#22C55E" : "#EF4444" }}>{row.commission}</div><div>{row.payout}</div><div>{row.setup}</div></div>)}
          </div>
          <p style={{ marginTop: 12, color: "#555", fontSize: 11, textAlign: "center" }}>Competitor rates approximate. Check their sites for current rates.</p>
        </section>
        <section style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px" }}>
          <div style={{ textAlign: "center" }}>
            <SectionBadge>FAQ</SectionBadge>
            <h2 ref={(node) => { sectionTitles.current[6] = node; }} style={{ margin: "18px 0 22px", fontSize: 42, fontWeight: 800 }}>Common questions</h2>
          </div>
          <div>{faqs.map(([question, answer], index) => <div key={question} style={{ borderBottom: "1px solid #1F1F1F" }}><button onClick={() => setOpenFaq((current) => current === index ? null : index)} style={{ width: "100%", background: "transparent", border: "none", color: "#fff", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", fontSize: 16, fontWeight: 700, cursor: "pointer" }}><span>{question}</span><motion.span animate={{ rotate: openFaq === index ? 45 : 0 }}>{openFaq === index ? "−" : "+"}</motion.span></button><AnimatePresence initial={false}>{openFaq === index ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}><p style={{ margin: 0, paddingBottom: 20, color: "#888", fontSize: 14, lineHeight: 1.7 }}>{answer}</p></motion.div> : null}</AnimatePresence></div>)}</div>
        </section>
        <section style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 20px" }}>
          <motion.div animate={{ y: [18, -18] }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 8 }} style={{ position: "absolute", bottom: -80, right: -120, width: 560, height: 560, borderRadius: "50%", filter: "blur(120px)", background: "rgba(139,92,246,0.12)" }} />
          <motion.div animate={{ y: [-18, 18] }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 8 }} style={{ position: "absolute", top: -60, left: -100, width: 420, height: 420, borderRadius: "50%", filter: "blur(100px)", background: "rgba(245,245,0,0.08)" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 980, textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, borderRadius: 999, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.1)", color: "#EF4444", padding: "8px 18px", fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}><motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />Limited spots available</div>
            <h2 ref={finalHeadingRef} style={{ margin: "24px 0 0", fontSize: "clamp(56px,8vw,100px)", lineHeight: 0.95, fontWeight: 800 }}>{finalChars.map((char, index) => <span key={`${char}-${index}`} data-char style={{ display: "inline-block" }}>{char === " " ? "\u00A0" : char}</span>)}</h2>
            <div style={{ fontSize: "clamp(56px,8vw,100px)", lineHeight: 0.95, fontWeight: 800, color: "#818CF8" }}>selling?</div>
            <p style={{ margin: "24px auto 0", maxWidth: 680, fontSize: 18, color: "#888", lineHeight: 1.7 }}>Join 200+ sellers already earning on StyleHub. Apply in 5 minutes. No fees. No risk.</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} onClick={() => setVendorOpen(true)} style={{ marginTop: 32, padding: "20px 48px", fontSize: 18, fontWeight: 800, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#F8FAFC", cursor: "pointer" }}>Apply as Vendor — It&apos;s Free</motion.button>
            <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20, color: "#555", fontSize: 13 }}><span>✓ No credit card</span><span>✓ 24hr approval</span><span>✓ Free forever</span></div>
          </div>
        </section>
      </main>
      <AnimatePresence>{stickyVisible ? <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="sell-mobile-apply" style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 16px", background: "rgba(10,10,10,0.95)", backdropFilter: "blur(10px)", borderTop: "1px solid #1F1F1F", zIndex: 90, display: "none" }}><button onClick={() => setVendorOpen(true)} style={{ width: "100%", height: 50, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#F8FAFC", fontWeight: 800, fontSize: 16 }}>Apply as Vendor →</button></motion.div> : null}</AnimatePresence>
      <VendorApplyModal isOpen={vendorOpen} onClose={() => setVendorOpen(false)} />
      <style jsx global>{`
        .testimonial-track { animation: testimonial-marquee 42s linear infinite; }
        .testimonial-scroll:hover .testimonial-track { animation-play-state: paused; }
        @keyframes testimonial-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (min-width: 960px) { .sell-hero-grid { grid-template-columns: 1fr 0.9fr !important; } .sell-hero-right { display: block !important; } }
        @media (max-width: 959px) { .sell-stats-grid, .sell-three-grid, .sell-benefits-layout, .sell-calculator-layout, .sell-dashboard-layout { grid-template-columns: 1fr !important; } .sell-benefits-grid, .sell-mini-grid { grid-template-columns: 1fr !important; } .sell-table-row { grid-template-columns: 1fr 1fr !important; gap: 8px; } }
        @media (max-width: 767px) { .sell-mobile-apply { display: block !important; } }
      `}</style>
    </>
  );
}
