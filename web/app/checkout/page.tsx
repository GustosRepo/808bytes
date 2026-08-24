import type { Metadata } from "next";
import CheckoutClient from "@/components/checkout-client";
import { listStorefrontProducts } from "@/lib/commerce";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete checkout for 808bytes digital products.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const products = await listStorefrontProducts();

  return <CheckoutClient products={products} />;
}
