import CartClient from "@/components/cart-client";
import { listStorefrontProducts } from "@/lib/commerce";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const products = await listStorefrontProducts();

  return <CartClient products={products} />;
}
