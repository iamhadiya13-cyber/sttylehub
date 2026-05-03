import type { Metadata } from "next";
import { SearchPageScreen } from "@/components/screens";
import { getSiteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

const baseUrl = getSiteUrl();

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { q?: string };
}): Promise<Metadata> {
  const query = searchParams?.q?.trim() || "";

  return {
    title: query
      ? `Search results for "${query}" — StyleHub`
      : "Search Streetwear — StyleHub",
    description: query
      ? `Find "${query}" streetwear at StyleHub. Browse matching hoodies, jackets, joggers and more.`
      : "Search streetwear, hoodies, jackets, joggers and more on StyleHub.",
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `${baseUrl}/search`,
    },
  };
}

export default function SearchPage() {
  return <SearchPageScreen />;
}
