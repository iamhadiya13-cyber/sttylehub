import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAuthenticatedUser } from "@/lib/auth-guards";
import { getSiteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/checkout`,
  },
};

export default async function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedUser("/checkout");
  return children;
}
