import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import BrandSplash from "@/components/ui/BrandSplash";
import ConfirmModalHost from "@/components/ui/ConfirmModalHost";
import PageLoadingOverlay from "@/components/ui/PageLoadingOverlay";
import TopLoadingBar from "@/components/ui/TopLoadingBar";
import { authOptions } from "@/lib/auth";
import { absoluteUrl, getSiteUrlObject } from "@/lib/seo/site";
import { getServerSession } from "next-auth";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  title: {
    default: "StyleHub — Premium Streetwear Online India",
    template: "%s | StyleHub",
  },
  description:
    "Shop premium streetwear online in India. Oversized hoodies, jackets, joggers and accessories. New drops weekly. Free shipping above ₹999.",
  keywords: [
    "streetwear india",
    "buy hoodies online india",
    "oversized hoodies india",
    "premium streetwear",
    "stylehub",
    "street fashion india",
    "buy jackets online india",
    "joggers online india",
    "streetwear brand india",
    "urban fashion india",
  ],
  authors: [{ name: "StyleHub" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "StyleHub",
    title: "StyleHub — Premium Streetwear Online India",
    description:
      "Shop premium streetwear online in India. Oversized hoodies, jackets, joggers and accessories. New drops weekly. Free shipping above ₹999.",
    images: [
      {
        url: absoluteUrl("/og-image.jpg"),
        width: 1200,
        height: 630,
        alt: "StyleHub Premium Streetwear India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StyleHub — Premium Streetwear Online India",
    description:
      "Shop premium streetwear online in India. Oversized hoodies, jackets, joggers and accessories. New drops weekly. Free shipping above ₹999.",
    images: [absoluteUrl("/og-image.jpg")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Fill this after Google Search Console verification.
    google: "",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers session={session}>
          <BrandSplash />
          <PageLoadingOverlay />
          <TopLoadingBar />
          {children}
        </Providers>
        <ConfirmModalHost />
      </body>
    </html>
  );
}
