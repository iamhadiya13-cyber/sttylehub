import type { Metadata } from "next";
import { LoginPageScreen } from "@/components/screens";
import { getSiteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Login — StyleHub",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/login`,
  },
};

export default function LoginPage() {
  return <LoginPageScreen />;
}
