import type { Metadata } from "next";
import { RegisterPageScreen } from "@/components/screens";
import { getSiteUrl } from "@/lib/seo/site";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Create Account — StyleHub",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/register`,
  },
};

export default function RegisterPage() {
  return <RegisterPageScreen />;
}
