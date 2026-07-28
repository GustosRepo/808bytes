import HomeClient from "@/components/home-client";
import { listStorefrontProducts } from "@/lib/commerce";
import { categories } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listStorefrontProducts();

  return <HomeClient categories={categories} products={products} />;
}
