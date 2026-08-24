import type { MetadataRoute } from "next";
import { policyLinks, siteConfig } from "@/lib/site-content";
import { products } from "@/lib/store-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/about", "/cart", "/checkout", ...policyLinks.map((link) => link.href)];
  const productRoutes = products.map((product) => `/products/${product.slug}`);

  return [...staticRoutes, ...productRoutes].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: route.startsWith("/products") ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/products") ? 0.8 : 0.6,
  }));
}
