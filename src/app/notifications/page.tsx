import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth-guards";
import { NotificationsPageScreen } from "@/components/screens/notifications-page-screen";
import { getSiteUrl } from "@/lib/seo/site";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Notifications",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/notifications`,
  },
};

export default async function NotificationsPage() {
  await requireAuthenticatedUser("/notifications");
  return <NotificationsPageScreen />;
}
