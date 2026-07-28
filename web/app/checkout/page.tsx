import CheckoutClient from "@/components/checkout-client";
import { listStorefrontProducts } from "@/lib/commerce";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const products = await listStorefrontProducts();

  return <CheckoutClient products={products} />;
}
