import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CartPageScreen } from "@/components/screens";
import { authOptions } from "@/lib/auth";
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

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  return <CartPageScreen />;
}
