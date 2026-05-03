import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireVerifiedUser } from "@/lib/auth-guards";
import { getSiteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/wishlist`,
  },
};

export default async function WishlistLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireVerifiedUser("/wishlist");
  return children;
}
