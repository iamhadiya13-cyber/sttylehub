import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/seo/site";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Sale — Up to 40% Off Streetwear",
  description:
    "Shop StyleHub sale. Up to 40% off hoodies, jackets, joggers and accessories. Limited time deals on premium streetwear.",
  alternates: {
    canonical: `${baseUrl}/sale`,
  },
};

export default function SalePage() {
  redirect("/products?sort=price-desc");
}
