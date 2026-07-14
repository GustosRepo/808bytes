import Link from "next/link";
import { notFound } from "next/navigation";
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
        <header className="border-b border-[#050607] bg-[#10161b]">
          <div className="flex min-h-7 flex-wrap items-center gap-4 border-b border-[#242c31] bg-[#0b0f13] px-3 text-[0.68rem] uppercase text-[#a8b6bd]">
            <span className="[font-family:var(--font-heading)] text-sm font-bold text-[#f2f8fb]">808bytes</span>
            <span>Plugin wrapper</span>
            <span>Channel settings</span>
            <span>Sample browser</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Link
              className="border border-[#4b5860] bg-[#202a31] px-2.5 py-1 text-[0.68rem] font-semibold uppercase text-[var(--text)] transition hover:border-[#6b7b84] hover:bg-[#29343b]"
              href="/"
            >
              Back to playlist
            </Link>
            <span className="border border-[#4b5860] bg-[#151d23] px-3 py-1 text-[0.68rem] text-[#a8b6bd]">
              Insert 08 / {category?.name ?? "Catalog"}
            </span>
            <span className="ml-auto border border-[#4b5860] bg-[#151d23] px-3 py-1 text-[0.68rem] font-semibold text-[var(--accent-amber)]">
              {product.isFree ? "FREE" : `$${product.price}`}
            </span>
          </div>
        </header>

        <article className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
          <section className="border-r border-[#050607] bg-[#11181d] p-3">
            <div className="border border-[#3a474f] bg-[#0e1317]">
              <div className="flex items-center justify-between border-b border-[#303b42] bg-[#202a31] px-3 py-1.5">
                <span className="text-[0.66rem] uppercase text-[#aebdc5]">{product.type}</span>
                <span className="text-[0.66rem] text-[#91a4ad]">Wrapper controls</span>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
                <div>
                  <h1 className="text-4xl font-semibold [font-family:var(--font-heading)]">{product.title}</h1>
                  <p className="mt-2 max-w-[680px] text-sm leading-relaxed text-[#c8d5dc]">{product.longDescription}</p>

                  <div
                    className="mt-5 h-[220px] border border-[#303b42] bg-[#151d23]"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, rgba(125,148,158,0.18) 0, rgba(125,148,158,0.18) 1px, transparent 1px, transparent 34px), repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 28px), #151d23",
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

                <div className="border border-[#303b42] bg-[#151d23] p-3">
                  <p className="text-[0.67rem] uppercase text-[#8c9da5]">Macro rack</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {["VOL", "PAN", "DRIVE", "TONE", "WIDTH", "MIX"].map((label, index) => (
                      <div className="text-center" key={label}>
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#56646c] bg-[radial-gradient(circle_at_35%_30%,#42515a,#141b20_68%)]">
                          <span
                            className="block h-7 w-[2px] origin-bottom bg-[var(--accent-cyan)]"
                            style={{ transform: `rotate(${-45 + index * 18}deg)` }}
                          />
                        </div>
                        <p className="mt-1 text-[0.62rem] text-[#91a4ad]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="bg-[#131a20] p-3">
            <div className="border border-[#3a474f] bg-[#0e1317]">
              <div className="border-b border-[#303b42] bg-[#202a31] px-3 py-1.5 text-[0.66rem] uppercase text-[#aebdc5]">
                Product channel
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
                        (index + product.title.length) % 3 === 0 ? "bg-[var(--accent-green)]" : "bg-[#28343b]"
                      }`}
                      key={`detail-step-${index}`}
                    />
                  ))}
                </div>

                <button
                  className="mt-5 w-full border border-[var(--accent-green)] bg-[#173221] px-3 py-2 text-sm font-semibold uppercase text-[#dfffe8] transition hover:bg-[#20442c]"
                  type="button"
                >
                  {product.isFree ? "Download free" : "Buy now"}
                </button>
              </div>
            </div>
          </aside>
        </article>
      </section>
    </main>
  );
}
