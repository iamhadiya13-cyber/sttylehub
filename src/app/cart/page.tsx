import type { Metadata } from "next";
import { CartPageScreen } from "@/components/screens";
import { getSiteUrl } from "@/lib/seo/site";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Cart",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/cart`,
  },
};

export default function CartPage() {
  return <CartPageScreen />;
}
