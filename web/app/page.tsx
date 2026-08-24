import type { Metadata } from "next";
import HomeClient from "@/components/home-client";
import { listStorefrontProducts } from "@/lib/commerce";
import { siteConfig } from "@/lib/site-content";
import { categories } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "808bytes Store",
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const products = await listStorefrontProducts();

  return <HomeClient categories={categories} products={products} />;
}
