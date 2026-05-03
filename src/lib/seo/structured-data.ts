type JsonLdContext = "https://schema.org";

type OrganizationStructuredData = {
  "@context": JsonLdContext;
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
};

type WebsiteStructuredData = {
  "@context": JsonLdContext;
  "@type": "WebSite";
  name: string;
  url: string;
  potentialAction: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
};

type BreadcrumbItem = {
  name: string;
  href: string;
};

type BreadcrumbStructuredData = {
  "@context": JsonLdContext;
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
};

type ProductStructuredDataInput = {
  name: string;
  description: string;
  brand: string;
  images: string[];
  slug: string;
  sku?: string | null;
  price: number;
  availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
  averageRating?: number | null;
  reviewCount?: number | null;
};

type ProductStructuredData = {
  "@context": JsonLdContext;
  "@type": "Product";
  name: string;
  description: string;
  brand: {
    "@type": "Brand";
    name: string;
  };
  image: string[];
  sku?: string;
  offers: {
    "@type": "Offer";
    url: string;
    priceCurrency: "INR";
    price: string;
    priceValidUntil: string;
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
    itemCondition: "https://schema.org/NewCondition";
    seller: {
      "@type": "Organization";
      name: string;
    };
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    reviewCount: string;
  };
};

export function generateOrganizationStructuredData(baseUrl: string): OrganizationStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StyleHub",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Premium streetwear brand in India. New drops weekly.",
    sameAs: [],
  };
}

export function generateWebsiteStructuredData(baseUrl: string): WebsiteStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StyleHub",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateBreadcrumbStructuredData(
  items: BreadcrumbItem[],
  baseUrl: string,
): BreadcrumbStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.href, baseUrl).toString(),
    })),
  };
}

export function generateProductStructuredData(
  product: ProductStructuredDataInput,
  baseUrl: string,
): ProductStructuredData {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    image: product.images,
    ...(product.sku ? { sku: product.sku } : {}),
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: "INR",
      price: String(product.price),
      priceValidUntil: nextYear.toISOString().slice(0, 10),
      availability: product.availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "StyleHub",
      },
    },
    ...(product.averageRating && product.reviewCount && product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: String(product.averageRating),
            reviewCount: String(product.reviewCount),
          },
        }
      : {}),
  };
}

export type {
  BreadcrumbStructuredData,
  OrganizationStructuredData,
  ProductStructuredData,
  ProductStructuredDataInput,
  WebsiteStructuredData,
};
