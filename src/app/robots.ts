import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/products/", "/sale", "/search", "/sell-on-stylehub"],
        disallow: [
          "/admin/",
          "/seller/",
          "/cart",
          "/checkout",
          "/profile",
          "/orders/",
          "/api/",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/notifications",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/products", "/products/", "/sale", "/sell-on-stylehub"],
        disallow: ["/admin/", "/seller/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
