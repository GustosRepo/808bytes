import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { hasCommerceDatabaseConfig, listAdminOrders } from "@/lib/commerce";

export const dynamic = "force-dynamic";

const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = hasCommerceDatabaseConfig() ? await listAdminOrders(100) : [];

  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-8 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-3 border border-[#151515] bg-white p-4 shadow-[8px_8px_0_#151515]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Admin / orders</p>
            <h1 className="text-4xl font-bold [font-family:var(--font-heading)]">Orders</h1>
          </div>
          <nav className="ml-auto flex gap-2 text-sm font-bold uppercase">
            <Link className="border border-[#151515] px-3 py-2" href="/admin">Dashboard</Link>
            <Link className="border border-[#151515] px-3 py-2" href="/admin/products">Products</Link>
          </nav>
        </div>

        <div className="mt-6 overflow-x-auto border border-[#151515] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#151515] text-xs font-bold uppercase text-white">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Grants</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr className="border-t border-[#d8d0c0]" key={order.id}>
                  <td className="px-3 py-2 font-bold">
                    <Link className="text-[#b34b44]" href={`/admin/orders/${order.id}`}>{order.id}</Link>
                  </td>
                  <td className="px-3 py-2">{order.email}</td>
                  <td className="px-3 py-2 font-bold uppercase">{order.status} / {order.fulfillmentStatus}</td>
                  <td className="px-3 py-2">{order.itemCount}</td>
                  <td className="px-3 py-2">{order.grantCount}</td>
                  <td className="px-3 py-2 font-bold">{formatUsd(order.total)}</td>
                  <td className="px-3 py-2">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
