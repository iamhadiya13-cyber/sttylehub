import type { Metadata } from "next";
import { ForgotPasswordPageScreen } from "@/components/screens";
import { getSiteUrl } from "@/lib/seo/site";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/forgot-password`,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageScreen />;
}
