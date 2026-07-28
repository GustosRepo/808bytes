import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getOrderById,
  hasCommerceDatabaseConfig,
  listAdminAuditEvents,
  listOrderAdminNotes,
  listOrderDownloadGrants,
} from "@/lib/commerce";
import {
  addAdminOrderNoteAction,
  generateAdminOrderLinksAction,
  setAdminGrantRevokedAction,
  updateAdminOrderStatusAction,
} from "../../actions";

export const dynamic = "force-dynamic";

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ error?: string; links?: string; saved?: string }>;
};

type AdminDownloadLink = {
  productId: string;
  expiresAt: string;
  url: string;
};

const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

const decodeLinks = (encoded?: string): AdminDownloadLink[] => {
  if (!encoded) {
    return [];
  }

  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as AdminDownloadLink[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default async function AdminOrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  await requireAdmin();

  if (!hasCommerceDatabaseConfig()) {
    notFound();
  }

  const { orderId } = await params;
  const query = await searchParams;
  const [order, grants, notes, auditEvents] = await Promise.all([
    getOrderById(orderId),
    listOrderDownloadGrants(orderId),
    listOrderAdminNotes(orderId),
    listAdminAuditEvents("order", orderId),
  ]);
  const freshLinks = decodeLinks(query.links);

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-8 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3 border border-[#151515] bg-white p-4 shadow-[8px_8px_0_#151515]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Admin / order</p>
            <h1 className="break-all text-3xl font-bold [font-family:var(--font-heading)]">{order.id}</h1>
          </div>
          <nav className="ml-auto flex gap-2 text-sm font-bold uppercase">
            <Link className="border border-[#151515] px-3 py-2" href="/admin/orders">Orders</Link>
            <Link className="border border-[#151515] px-3 py-2" href="/admin/products">Products</Link>
          </nav>
        </div>

        {query.error === "links" ? (
          <p className="mt-4 border border-[#b34b44] bg-white p-3 text-sm font-bold text-[#b34b44]">
            Fresh download links can only be generated for paid orders.
          </p>
        ) : null}
        {query.saved ? (
          <p className="mt-4 border border-[#151515] bg-white p-3 text-sm font-bold text-[#247a5b]">
            Order updated.
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="grid gap-4">
            <div className="border border-[#151515] bg-white p-4">
              <h2 className="text-2xl font-bold [font-family:var(--font-heading)]">Items</h2>
              <div className="mt-3 grid gap-2">
                {order.items.map((item) => (
                  <div className="grid gap-2 border border-[#d8d0c0] bg-[#fbfaf6] p-3 text-sm sm:grid-cols-[1fr_auto_auto]" key={`${item.productId}-${item.title}`}>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-xs font-bold uppercase text-[#8a8376]">{item.productId}</p>
                    </div>
                    <p className="font-bold">Qty {item.quantity}</p>
                    <p className="font-bold">{formatUsd(item.lineTotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#151515] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold [font-family:var(--font-heading)]">Download grants</h2>
                <form action={generateAdminOrderLinksAction}>
                  <input name="orderId" type="hidden" value={order.id} />
                  <button className="bg-[#151515] px-4 py-2 text-sm font-bold uppercase text-white" type="submit">
                    Generate fresh links
                  </button>
                </form>
              </div>
              <div className="mt-3 grid gap-2">
                {grants.length === 0 ? (
                  <p className="border border-[#d8d0c0] bg-[#fbfaf6] p-3 text-sm font-semibold text-[#6f6a5e]">No grants yet.</p>
                ) : null}
                {grants.map((grant) => (
                  <div className="grid gap-2 border border-[#d8d0c0] bg-[#fbfaf6] p-3 text-sm sm:grid-cols-[1fr_auto_auto_auto]" key={grant.id}>
                    <div>
                      <p className="font-bold">{grant.productId}</p>
                      <p className="break-all text-xs font-semibold text-[#6f6a5e]">{grant.id}</p>
                    </div>
                    <p className="font-bold">{grant.downloadCount}/{grant.maxDownloads} used</p>
                    <p className="font-bold uppercase">{grant.revokedAt ? "revoked" : "active"}</p>
                    <form action={setAdminGrantRevokedAction}>
                      <input name="orderId" type="hidden" value={order.id} />
                      <input name="grantId" type="hidden" value={grant.id} />
                      <input name="revoked" type="hidden" value={grant.revokedAt ? "false" : "true"} />
                      <button className="border border-[#151515] px-3 py-2 text-xs font-bold uppercase" type="submit">
                        {grant.revokedAt ? "Restore" : "Revoke"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#151515] bg-white p-4">
              <h2 className="text-2xl font-bold [font-family:var(--font-heading)]">Admin notes</h2>
              <form action={addAdminOrderNoteAction} className="mt-3 grid gap-2">
                <input name="orderId" type="hidden" value={order.id} />
                <textarea className="min-h-24 border border-[#151515] p-3 text-sm" name="note" placeholder="Add support note..." required />
                <button className="w-fit bg-[#151515] px-4 py-2 text-sm font-bold uppercase text-white" type="submit">
                  Add note
                </button>
              </form>
              <div className="mt-3 grid gap-2">
                {notes.map((note) => (
                  <div className="border border-[#d8d0c0] bg-[#fbfaf6] p-3 text-sm" key={note.id}>
                    <p className="font-semibold">{note.note}</p>
                    <p className="mt-1 text-xs font-bold uppercase text-[#8a8376]">{note.actor} / {new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#151515] bg-white p-4">
              <h2 className="text-2xl font-bold [font-family:var(--font-heading)]">Audit log</h2>
              <div className="mt-3 grid gap-2">
                {auditEvents.length === 0 ? (
                  <p className="border border-[#d8d0c0] bg-[#fbfaf6] p-3 text-sm font-semibold text-[#6f6a5e]">No admin events yet.</p>
                ) : null}
                {auditEvents.map((event) => (
                  <div className="border border-[#d8d0c0] bg-[#fbfaf6] p-3 text-sm" key={event.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold uppercase">{event.action}</p>
                      <p className="text-xs font-bold uppercase text-[#8a8376]">{new Date(event.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#6f6a5e]">{event.actor}</p>
                  </div>
                ))}
              </div>
            </div>

            {freshLinks.length > 0 ? (
              <div className="border border-[#151515] bg-white p-4">
                <h2 className="text-2xl font-bold [font-family:var(--font-heading)]">Fresh links</h2>
                <div className="mt-3 grid gap-2">
                  {freshLinks.map((link) => (
                    <a className="break-all border border-[#151515] bg-[#fbfaf6] px-3 py-2 text-sm font-bold" href={link.url} key={`${link.productId}-${link.url}`}>
                      {link.productId}: {link.url}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="h-fit border border-[#151515] bg-white p-4 lg:sticky lg:top-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a8376]">Customer</p>
            <p className="mt-1 break-all text-lg font-bold">{order.email}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between"><span>Status</span><span className="font-bold uppercase">{order.status}</span></div>
              <div className="flex justify-between"><span>Fulfillment</span><span className="font-bold uppercase">{order.fulfillmentStatus}</span></div>
              <div className="flex justify-between"><span>Provider</span><span className="font-bold uppercase">{order.paymentProvider}</span></div>
              <div className="flex justify-between"><span>Total</span><span className="font-bold">{formatUsd(order.total)}</span></div>
              <div className="flex justify-between"><span>Created</span><span className="font-bold">{new Date(order.createdAt).toLocaleString()}</span></div>
            </div>
            <form action={updateAdminOrderStatusAction} className="mt-5 grid gap-2 border-t border-[#d8d0c0] pt-4">
              <input name="orderId" type="hidden" value={order.id} />
              <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                Status
                <select className="border border-[#151515] px-2 py-2 text-sm text-[#151515]" name="status" defaultValue={order.status}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                Fulfillment
                <select className="border border-[#151515] px-2 py-2 text-sm text-[#151515]" name="fulfillmentStatus" defaultValue={order.fulfillmentStatus}>
                  <option value="pending">Pending</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                Failure / support reason
                <input className="border border-[#151515] px-2 py-2 text-sm text-[#151515]" name="failureReason" defaultValue={order.failureReason ?? ""} />
              </label>
              <button className="bg-[#151515] px-4 py-2 text-sm font-bold uppercase text-white" type="submit">
                Save order state
              </button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
