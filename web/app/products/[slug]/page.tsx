import { notFound } from "next/navigation";
import { DawButtonLink, DawMenuBar } from "@/components/daw-chrome";
import { categories, getProductBySlug } from "@/lib/store-data";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = categories.find((item) => item.id === product.categoryId);

  return (
    <main className="min-h-screen bg-[var(--bg)] p-3 text-[var(--text)]">
      <section className="mx-auto max-w-[1180px] overflow-hidden border border-black bg-[var(--frame)] shadow-[0_18px_48px_rgba(0,0,0,0.5)]">
        <header className="border-b border-[#090a0c] bg-[#141518]">
          <DawMenuBar
            items={[
              { label: "Shop", href: "/#catalog" },
              { label: "Free Downloads", href: "/#catalog" },
              { label: "Plugins", href: "/#catalog" },
              { label: "Packs", href: "/#catalog" },
              { label: "About", href: "/about" },
              { label: "Cart", href: "/#product-actions" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <DawButtonLink href="/">Back to playlist</DawButtonLink>
            <span className="border border-[#4a4c50] bg-[#1b1d20] px-3 py-1 text-[0.68rem] text-[#aaa69e]">
              Insert 08 / {category?.name ?? "Catalog"}
            </span>
            <span className="ml-auto border border-[#4a4c50] bg-[#1b1d20] px-3 py-1 text-[0.68rem] font-semibold text-[var(--accent-amber)]">
              {product.isFree ? "FREE" : `$${product.price}`}
            </span>
            <span className="border border-[var(--commerce)] bg-[var(--commerce)] px-3 py-1 text-[0.68rem] font-bold uppercase text-[var(--commerce-text)]">
              {product.isFree ? "Free download" : "Ready to buy"}
            </span>
          </div>
        </header>

        <article className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
          <section className="border-r border-[#090a0c] bg-[#151619] p-3">
            <div className="border border-[#3d3f43] bg-[#101113]">
              <div className="flex items-center justify-between border-b border-[#34363a] bg-[#24262a] px-3 py-1.5">
                <span className="text-[0.66rem] uppercase text-[#c4beb3]">{product.type}</span>
                <span className="text-[0.66rem] text-[#9b978e]">Product preview</span>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
                <div>
                  <h1 className="text-4xl font-semibold [font-family:var(--font-heading)]">{product.title}</h1>
                  <p className="mt-2 max-w-[680px] text-sm leading-relaxed text-[#cbc5ba]">{product.longDescription}</p>

                  <div
                    className="mt-5 h-[220px] border border-[#34363a] bg-[#1b1d20]"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, rgba(132,130,120,0.14) 0, rgba(132,130,120,0.14) 1px, transparent 1px, transparent 34px), repeating-linear-gradient(180deg, rgba(255,255,255,0.045) 0, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 28px), #1b1d20",
                    }}
                  >
                    <div className="flex h-full items-center gap-1 overflow-hidden px-4">
                      {Array.from({ length: 48 }).map((_, index) => (
                        <span
                          aria-hidden="true"
                          className="w-2 rounded-sm"
                          key={`detail-wave-${index}`}
                          style={{
                            height: 32 + ((index * 13 + product.title.length * 3) % 132),
                            backgroundColor: category?.accent ?? "var(--accent-cyan)",
                            opacity: index % 5 === 0 ? 0.45 : 0.85,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-[#34363a] bg-[#1b1d20] p-3">
                  <p className="text-[0.67rem] uppercase text-[#96938b]">Macro rack</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {["VOL", "PAN", "DRIVE", "TONE", "WIDTH", "MIX"].map((label, index) => (
                      <div className="text-center" key={label}>
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#595a5d] bg-[radial-gradient(circle_at_35%_30%,#464845,#17191c_68%)]">
                          <span
                            className="block h-7 w-[2px] origin-bottom bg-[var(--accent-cyan)]"
                            style={{ transform: `rotate(${-45 + index * 18}deg)` }}
                          />
                        </div>
                        <p className="mt-1 text-[0.62rem] text-[#9b978e]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="bg-[#17181b] p-3">
            <div className="border border-[#3d3f43] bg-[#101113]">
              <div className="border-b border-[#34363a] bg-[#24262a] px-3 py-1.5 text-[0.66rem] uppercase text-[#c4beb3]">
                Product actions
              </div>
              <div className="p-3">
                <div className="grid grid-cols-[1fr_auto] gap-2 text-sm">
                  <span className="text-[var(--muted)]">Type</span>
                  <span>{product.type.toUpperCase()}</span>
                  <span className="text-[var(--muted)]">Category</span>
                  <span>{category?.name ?? "Catalog"}</span>
                  <span className="text-[var(--muted)]">Price</span>
                  <span>{product.isFree ? "FREE" : `$${product.price}`}</span>
                  <span className="text-[var(--muted)]">Format</span>
                  <span>{product.compatibility.join(" / ")}</span>
                </div>

                <div className="mt-4 grid grid-cols-8 gap-1">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <span
                      aria-hidden="true"
                      className={`h-6 border border-black/40 ${
                        (index + product.title.length) % 3 === 0 ? "bg-[var(--accent-green)]" : "bg-[#2c2d30]"
                      }`}
                      key={`detail-step-${index}`}
                    />
                  ))}
                </div>

                <button
                  className="mt-5 w-full border border-[var(--commerce)] bg-[var(--commerce)] px-3 py-2 text-sm font-bold uppercase text-[var(--commerce-text)] transition hover:bg-[var(--commerce-hover)]"
                  type="button"
                >
                  {product.isFree ? "Download free" : "Buy now"}
                </button>
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                  This is the shopping action for the selected product. The DAW styling is visual context.
                </p>
              </div>
            </div>
          </aside>
        </article>
      </section>
    </main>
  );
}
