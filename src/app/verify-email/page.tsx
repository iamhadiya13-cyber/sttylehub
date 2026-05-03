import type { Metadata } from "next";
import { VerifyEmailPageScreen } from "@/components/screens";
import { getSiteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Verify Email",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/verify-email`,
  },
};

export default function VerifyEmailPage() {
  return <VerifyEmailPageScreen />;
}
