import type { Metadata } from "next";
import CartClient from "@/components/cart-client";
import { listStorefrontProducts } from "@/lib/commerce";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your 808bytes cart before checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CartPage() {
  const products = await listStorefrontProducts();

  return <CartClient products={products} />;
}
