import type { Metadata } from "next";
import SellOnStyleHubPage from "@/components/marketing/SellOnStyleHubPage";
import { getSiteUrl } from "@/lib/seo/site";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Sell on StyleHub — Become a Streetwear Seller",
  description:
    "Join StyleHub as a seller. Reach thousands of streetwear buyers across India. Easy onboarding, fast payouts, full seller dashboard.",
  alternates: {
    canonical: `${baseUrl}/sell-on-stylehub`,
  },
};

export default function SellOnStyleHubRoute() {
  return <SellOnStyleHubPage />;
}
