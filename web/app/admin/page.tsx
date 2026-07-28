import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { hasCommerceDatabaseConfig, listAdminOrders, listProductInventory } from "@/lib/commerce";
import { logoutAdmin } from "./actions";

export const dynamic = "force-dynamic";

const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

export default async function AdminDashboardPage() {
  await requireAdmin();

  const hasDb = hasCommerceDatabaseConfig();
  const [products, orders] = hasDb ? await Promise.all([listProductInventory(), listAdminOrders(10)]) : [[], []];
  const revenue = orders.reduce((sum, order) => sum + (order.status === "paid" ? order.total : 0), 0);
  const activeProducts = products.filter((product) => product.isActive && product.isPurchasable).length;

  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-8 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-3 border border-[#151515] bg-white p-4 shadow-[8px_8px_0_#151515]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">808bytes admin</p>
            <h1 className="text-4xl font-bold [font-family:var(--font-heading)]">Dashboard</h1>
          </div>
          <nav className="ml-auto flex flex-wrap gap-2 text-sm font-bold uppercase">
            <Link className="border border-[#151515] px-3 py-2" href="/admin/products">Products</Link>
            <Link className="border border-[#151515] px-3 py-2" href="/admin/orders">Orders</Link>
            <form action={logoutAdmin}>
              <button className="border border-[#151515] px-3 py-2" type="submit">Logout</button>
            </form>
          </nav>
        </div>

        {!hasDb ? (
          <div className="mt-6 border border-[#b34b44] bg-white p-4 text-sm font-bold text-[#b34b44]">
            Postgres is not configured for this runtime.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="border border-[#151515] bg-white p-4">
            <p className="text-xs font-bold uppercase text-[#8a8376]">Active products</p>
            <p className="mt-2 text-4xl font-bold">{activeProducts}</p>
          </div>
          <div className="border border-[#151515] bg-white p-4">
            <p className="text-xs font-bold uppercase text-[#8a8376]">Recent orders</p>
            <p className="mt-2 text-4xl font-bold">{orders.length}</p>
          </div>
          <div className="border border-[#151515] bg-white p-4">
            <p className="text-xs font-bold uppercase text-[#8a8376]">Recent paid revenue</p>
            <p className="mt-2 text-4xl font-bold">{formatUsd(revenue)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="border border-[#151515] bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold [font-family:var(--font-heading)]">Inventory</h2>
              <Link className="text-xs font-bold uppercase text-[#b34b44]" href="/admin/products">Manage</Link>
            </div>
            <div className="mt-3 grid gap-2">
              {products.slice(0, 6).map((product) => (
                <div className="flex items-center justify-between border border-[#d8d0c0] bg-[#fbfaf6] px-3 py-2 text-sm" key={product.productId}>
                  <span className="font-bold">{product.title}</span>
                  <span className="font-bold">{formatUsd(product.price)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-[#151515] bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold [font-family:var(--font-heading)]">Recent orders</h2>
              <Link className="text-xs font-bold uppercase text-[#b34b44]" href="/admin/orders">View all</Link>
            </div>
            <div className="mt-3 grid gap-2">
              {orders.slice(0, 6).map((order) => (
                <Link className="flex items-center justify-between border border-[#d8d0c0] bg-[#fbfaf6] px-3 py-2 text-sm" href={`/admin/orders/${order.id}`} key={order.id}>
                  <span className="font-bold">{order.email}</span>
                  <span className="font-bold uppercase">{order.status}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
