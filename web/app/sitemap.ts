import type { MetadataRoute } from "next";
import { listStorefrontProducts } from "@/lib/commerce";
import { policyLinks, siteConfig } from "@/lib/site-content";
import { products as staticProducts } from "@/lib/store-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = ["", "/about", "/sounds", "/cart", "/checkout", ...policyLinks.map((link) => link.href)];
  const products = await listStorefrontProducts().catch(() => staticProducts);
  const productRoutes = products.map((product) => `/products/${product.slug}`);

  return [...staticRoutes, ...productRoutes].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: route.startsWith("/products") ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/products") || route === "/sounds" ? 0.8 : 0.6,
  }));
}
