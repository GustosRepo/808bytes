import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { hasCommerceDatabaseConfig, listProductInventory } from "@/lib/commerce";
import {
  createInventoryProductAction,
  deleteInventoryProductAction,
  updateInventoryProductAction,
} from "../actions";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{ created?: string; deleted?: string; error?: string; saved?: string }>;
};

const formatMetric = (value?: number) => (value == null ? "0" : value.toLocaleString());

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const products = hasCommerceDatabaseConfig() ? await listProductInventory() : [];

  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-8 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-3 border border-[#151515] bg-white p-4 shadow-[8px_8px_0_#151515]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Admin / inventory</p>
            <h1 className="text-4xl font-bold [font-family:var(--font-heading)]">Products</h1>
          </div>
          <nav className="ml-auto flex gap-2 text-sm font-bold uppercase">
            <Link className="border border-[#151515] px-3 py-2" href="/admin">Dashboard</Link>
            <Link className="border border-[#151515] px-3 py-2" href="/admin/orders">Orders</Link>
          </nav>
        </div>

        {params.saved ? (
          <p className="mt-4 border border-[#151515] bg-white p-3 text-sm font-bold text-[#247a5b]">
            Product saved.
          </p>
        ) : null}
        {params.created ? (
          <p className="mt-4 border border-[#151515] bg-white p-3 text-sm font-bold text-[#247a5b]">
            Product created.
          </p>
        ) : null}
        {params.deleted ? (
          <p className="mt-4 border border-[#151515] bg-white p-3 text-sm font-bold text-[#247a5b]">
            Product removed or archived.
          </p>
        ) : null}
        {params.error ? (
          <p className="mt-4 border border-[#b34b44] bg-white p-3 text-sm font-bold text-[#b34b44]">
            Product action failed. Check required fields and unique IDs.
          </p>
        ) : null}

        <form action={createInventoryProductAction} className="mt-6 border border-[#151515] bg-white p-4 shadow-[6px_6px_0_#151515]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Create product</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-4">
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Title
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="title" placeholder="New Sauce" required />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              SKU
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="sku" placeholder="new-sauce-pro" required />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Product ID
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="productId" placeholder="new-sauce-pro" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Slug
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="slug" placeholder="new-sauce" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Category
              <select className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="categoryId" defaultValue="sauce-packets">
                <option value="sauce-packets">Sauce Packets</option>
                <option value="sauce-box">Sauce Box</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Price
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" min="0" name="price" step="0.01" type="number" defaultValue="19.99" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Type
              <select className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="type" defaultValue="pack">
                <option value="pack">Pack</option>
                <option value="merch">Merch</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Fulfillment
              <select className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="fulfillment" defaultValue="digital">
                <option value="digital">Digital</option>
                <option value="physical">Physical</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              S3 object key
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="objectKey" placeholder="downloads/new-sauce/new-sauce.zip" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Cover
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="cover" defaultValue="/covers/sauce-packet.svg" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Compatibility
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="compatibility" defaultValue="Digital download, ZIP" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Stock
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" min="0" name="stockQuantity" type="number" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Low threshold
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" min="0" name="lowStockThreshold" type="number" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Sort
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="sortOrder" type="number" defaultValue="100" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
              Badge
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="badge" placeholder="PRO" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e] lg:col-span-2">
              Short description
              <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="shortDescription" />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e] lg:col-span-2">
              Long description
              <textarea className="min-h-20 border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="longDescription" />
            </label>
            <div className="flex flex-wrap items-end gap-3 text-xs font-bold uppercase text-[#5f5d56]">
              <label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
              <label className="flex items-center gap-2"><input name="isPurchasable" type="checkbox" defaultChecked /> Purchasable</label>
              <label className="flex items-center gap-2"><input name="isFree" type="checkbox" /> Free</label>
              <label className="flex items-center gap-2"><input name="featured" type="checkbox" /> Featured</label>
            </div>
            <button className="bg-[#151515] px-4 py-3 text-sm font-bold uppercase text-white lg:self-end" type="submit">
              Create product
            </button>
          </div>
        </form>

        <div className="mt-6 grid gap-4">
          {products.map((product) => {
            const isLowStock =
              product.stockQuantity !== null &&
              product.lowStockThreshold !== null &&
              product.stockQuantity <= product.lowStockThreshold;

            return (
              <div key={product.productId}>
              <form
                action={updateInventoryProductAction}
                className="grid gap-4 border border-[#151515] bg-white p-4 shadow-[6px_6px_0_#151515] lg:grid-cols-[1.1fr_1fr_auto]"
              >
                <input name="productId" type="hidden" value={product.productId} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a8376]">{product.sku}</p>
                  <h2 className="mt-1 text-3xl font-bold [font-family:var(--font-heading)]">{product.title}</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Title
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="title" defaultValue={product.title} />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      SKU
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="sku" defaultValue={product.sku} />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Slug
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="slug" defaultValue={product.slug} />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Category
                      <select className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="categoryId" defaultValue={product.categoryId}>
                        <option value="sauce-packets">Sauce Packets</option>
                        <option value="sauce-box">Sauce Box</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Price
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" min="0" name="price" step="0.01" type="number" defaultValue={product.price.toFixed(2)} />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e] sm:col-span-2">
                      Short description
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="shortDescription" defaultValue={product.shortDescription} />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e] sm:col-span-2">
                      Long description
                      <textarea className="min-h-20 border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="longDescription" defaultValue={product.longDescription} />
                    </label>
                  </div>
                </div>

                <div className="grid gap-3">
                  <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                    S3 object key
                    <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="objectKey" defaultValue={product.objectKey ?? ""} />
                  </label>
                  <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                    Cover
                    <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="cover" defaultValue={product.cover} />
                  </label>
                  <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                    Compatibility
                    <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="compatibility" defaultValue={product.compatibility.join(", ")} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Stock
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" min="0" name="stockQuantity" type="number" defaultValue={product.stockQuantity ?? ""} />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Low threshold
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" min="0" name="lowStockThreshold" type="number" defaultValue={product.lowStockThreshold ?? ""} />
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Sort
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="sortOrder" type="number" defaultValue={product.sortOrder} />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Badge
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="badge" defaultValue={product.badge ?? ""} />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase text-[#6f6a5e]">
                      Status label
                      <input className="border border-[#151515] px-2 py-2 text-sm normal-case text-[#151515]" name="statusLabel" defaultValue={product.statusLabel ?? ""} />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs font-bold uppercase text-[#5f5d56]">
                    <label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={product.isActive} /> Active</label>
                    <label className="flex items-center gap-2"><input name="isPurchasable" type="checkbox" defaultChecked={product.isPurchasable} /> Purchasable</label>
                    <label className="flex items-center gap-2"><input name="isFree" type="checkbox" defaultChecked={product.isFree} /> Free</label>
                    <label className="flex items-center gap-2"><input name="featured" type="checkbox" defaultChecked={product.featured} /> Featured</label>
                  </div>
                </div>

                <div className="grid content-between gap-3">
                  <div className="grid gap-2 border border-[#d8d0c0] bg-[#fbfaf6] p-3 text-xs font-bold uppercase">
                    <span>Sold: {formatMetric(product.soldCount)}</span>
                    <span>Revenue: ${(product.revenue ?? 0).toFixed(2)}</span>
                    <span>Grants: {formatMetric(product.grantCount)}</span>
                    <span className={isLowStock ? "text-[#b34b44]" : "text-[#247a5b]"}>
                      Stock: {product.stockQuantity ?? "Unlimited"}
                    </span>
                  </div>
                  <button className="bg-[#151515] px-4 py-3 text-sm font-bold uppercase text-white" type="submit">
                    Save
                  </button>
                </div>
              </form>
              <form action={deleteInventoryProductAction} className="-mt-4 border-x border-b border-[#151515] bg-[#fff8f6] p-3 text-right shadow-[6px_6px_0_#151515]">
                <input name="productId" type="hidden" value={product.productId} />
                <button className="border border-[#b34b44] px-3 py-2 text-xs font-bold uppercase text-[#b34b44]" type="submit">
                  Delete / archive
                </button>
              </form>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
