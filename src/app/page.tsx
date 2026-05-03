import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { HomePageScreen } from "@/components/screens";
import {
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
} from "@/lib/seo/structured-data";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "StyleHub — Premium Streetwear Online India",
  description:
    "Shop the latest streetwear drops at StyleHub. Oversized hoodies, premium jackets, joggers and accessories. New collection 2025. Free shipping above ₹999 across India.",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    title: "StyleHub — Premium Streetwear Online India",
    description:
      "Shop the latest streetwear drops at StyleHub. Oversized hoodies, premium jackets, joggers and accessories. New collection 2025. Free shipping above ₹999 across India.",
    url: baseUrl,
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

export default function HomePage() {
  return (
    <>
      <JsonLd data={generateOrganizationStructuredData(baseUrl)} />
      <JsonLd data={generateWebsiteStructuredData(baseUrl)} />
      <HomePageScreen />
    </>
  );
}
