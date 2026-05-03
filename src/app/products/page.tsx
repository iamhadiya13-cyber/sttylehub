import type { Metadata } from "next";
import { ProductsPageScreen } from "@/components/screens";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Shop All Streetwear — Hoodies, Jackets, Joggers & More",
  description:
    "Browse all premium streetwear at StyleHub. Hoodies, jackets, joggers, caps, sneakers and accessories. Filter by size, color and price. New drops every week.",
  alternates: {
    canonical: `${baseUrl}/products`,
  },
  openGraph: {
    title: "Shop All Streetwear — Hoodies, Jackets, Joggers & More",
    description:
      "Browse all premium streetwear at StyleHub. Hoodies, jackets, joggers, caps, sneakers and accessories. Filter by size, color and price. New drops every week.",
    url: `${baseUrl}/products`,
    images: [
      {
        url: absoluteUrl("/og-image.jpg"),
        width: 1200,
        height: 630,
        alt: "StyleHub Premium Streetwear India",
      },
    ],
  },
};

export default function ProductsPage() {
  return <ProductsPageScreen />;
}
