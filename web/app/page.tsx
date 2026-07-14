"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { categories, getProductsByCategory, type Product } from "@/lib/store-data";

const typeLabel: Record<Product["type"], string> = {
  vst: "VST",
  pack: "PACK",
  oneshot: "ONE SHOT",
  merch: "MERCH",
};

const transportControls = ["STOP", "PLAY", "REC"];

const browserSections = [
  { label: "Current project", rows: ["History", "Patterns", "Plugin database"] },
  { label: "Packs", rows: ["808bytes kits", "One shots", "Loop archive"] },
  { label: "Generators", rows: ["Neon Grain", "Tape Bloom", "Sampler"] },
];

export default function Home() {
  const [filterMode, setFilterMode] = useState<"all" | "free" | "paid">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => getProductsByCategory("featured")[0] ?? null);
  const laneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const panelButtonClass =
    "border border-[#4b5860] bg-[#202a31] px-2.5 py-1 text-[0.68rem] font-semibold uppercase text-[var(--text)] transition hover:border-[#6b7b84] hover:bg-[#29343b]";

  const transportButtonClass =
    "h-8 min-w-12 border border-[#4f5d65] bg-[#20282e] px-2 text-[0.65rem] font-semibold uppercase text-[#dfe9ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-[#2a343a]";

  const visibleCategories = useMemo(
    () =>
      categories.filter((category) => {
        const products = getProductsByCategory(category.id);

        if (filterMode === "free") {
          return products.some((product) => product.isFree);
        }

        if (filterMode === "paid") {
          return products.some((product) => !product.isFree);
        }

        return products.length > 0;
      }),
    [filterMode],
  );

  const scrollLane = (categoryId: string, direction: "left" | "right") => {
    const lane = laneRefs.current[categoryId];
    if (!lane) {
      return;
    }

    const distance = direction === "left" ? -280 : 280;
    lane.scrollBy({ left: distance, behavior: "smooth" });
  };

  const clipStyle = (index: number, categoryId: string): CSSProperties => {
    const laneOffset = categoryId.length % 3;
    const span = 7 + ((index + laneOffset) % 3);
    const start = 2 + index * 9 + laneOffset;

    return {
      gridColumn: `${start} / span ${span}`,
      gridRow: "1",
    };
  };

  const renderWaveform = (product: Product, accent: string) =>
    Array.from({ length: 20 }).map((_, barIndex) => {
      const height = 18 + ((barIndex * 9 + product.title.length * 5 + product.id.length) % 34);

      return (
        <span
          aria-hidden="true"
          className="block w-[3px] rounded-sm opacity-90"
          key={`${product.id}-wave-${barIndex}`}
          style={{ height, backgroundColor: accent }}
        />
      );
    });

  const selectedCategory = selectedProduct ? categories.find((category) => category.id === selectedProduct.categoryId) : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="flex min-h-screen flex-col overflow-hidden border border-black bg-[var(--frame)] xl:h-screen">
        <header className="shrink-0 border-b border-[#050607] bg-[#10161b] shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#242c31] bg-[#0b0f13] px-3 text-[0.66rem] uppercase text-[#a8b6bd]">
            <span className="[font-family:var(--font-heading)] text-sm font-bold text-[#f2f8fb]">808bytes</span>
            {["File", "Edit", "Add", "Patterns", "View", "Options", "Tools", "Help"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <div className="flex overflow-hidden border border-[#4b5860]">
              {transportControls.map((control) => (
                <button
                  className={`${transportButtonClass} ${
                    control === "PLAY" ? "text-[var(--accent-green)]" : control === "REC" ? "text-[var(--accent-red)]" : ""
                  }`}
                  key={control}
                  type="button"
                >
                  {control}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[auto_auto] overflow-hidden border border-[#4b5860] bg-[#151d23] text-[0.68rem]">
              <span className="border-r border-[#364248] px-2 py-1 text-[#8899a2]">TEMPO</span>
              <span className="px-3 py-1 font-semibold text-[var(--accent-amber)]">130.000</span>
              <span className="border-t border-r border-[#364248] px-2 py-1 text-[#8899a2]">TIME</span>
              <span className="border-t border-[#364248] px-3 py-1 font-semibold">4:01:000</span>
            </div>

            <div className="flex items-center gap-1 border border-[#4b5860] bg-[#151d23] px-2 py-1 text-[0.68rem]">
              <span className="text-[#8899a2]">PAT</span>
              <span className="bg-[#0a0d10] px-2 py-1 font-semibold text-[var(--accent-cyan)]">Catalog 01</span>
            </div>

            <div className="flex items-center gap-1 border border-[#4b5860] bg-[#151d23] p-1">
              {(["all", "free", "paid"] as const).map((mode) => (
                <button
                  className={`h-7 border px-3 text-[0.66rem] font-semibold uppercase ${
                    filterMode === mode
                      ? "border-[var(--accent-cyan)] bg-[#12303a] text-[#dff9ff]"
                      : "border-[#38444b] bg-[#1c252b] text-[#a9b7be]"
                  }`}
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="ml-auto hidden min-w-[160px] items-end gap-[3px] border border-[#4b5860] bg-[#0b0f13] px-2 py-1 md:flex">
              {Array.from({ length: 22 }).map((_, index) => (
                <span
                  aria-hidden="true"
                  className="w-1 bg-[var(--accent-green)]"
                  key={`master-meter-${index}`}
                  style={{ height: 5 + ((index * 7) % 24), opacity: index > 17 ? 0.45 : 0.9 }}
                />
              ))}
              <span className="ml-2 text-[0.62rem] text-[#8fa0a8]">MASTER</span>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[clamp(170px,15vw,220px)_minmax(0,1fr)_clamp(240px,22vw,300px)]">
          <aside className="min-h-0 border-r border-[#050607] bg-[#12181d] xl:overflow-y-auto">
            <div className="border-b border-[#313b42] bg-[#1a2228] px-3 py-2">
              <p className="text-[0.67rem] uppercase text-[#8c9da5]">Browser</p>
              <h2 className="text-lg font-semibold [font-family:var(--font-heading)]">Library rack</h2>
            </div>

            <div className="p-2">
              {browserSections.map((section) => (
                <div className="mb-3" key={section.label}>
                  <p className="border border-[#303a41] bg-[#1f2930] px-2 py-1 text-[0.68rem] font-semibold uppercase text-[#c5d1d7]">
                    {section.label}
                  </p>
                  {section.rows.map((row) => (
                    <button
                      className="block w-full border-x border-b border-[#283138] bg-[#141b20] px-3 py-1.5 text-left text-[0.76rem] text-[#99aab3] transition hover:bg-[#1d262c] hover:text-white"
                      key={row}
                      type="button"
                    >
                      {row}
                    </button>
                  ))}
                </div>
              ))}

              <div>
                <p className="border border-[#303a41] bg-[#1f2930] px-2 py-1 text-[0.68rem] font-semibold uppercase text-[#c5d1d7]">
                  Store tracks
                </p>
                {categories.map((category) => (
                  <button
                    className="flex w-full items-center justify-between border-x border-b border-[#283138] bg-[#141b20] px-3 py-1.5 text-left text-[0.76rem] transition hover:bg-[#1d262c]"
                    key={category.id}
                    onClick={() => scrollLane(category.id, "right")}
                    type="button"
                  >
                    <span>{category.name}</span>
                    <span className="h-2 w-6" style={{ backgroundColor: category.accent }} />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-hidden bg-[#10161a]">
            <div className="grid grid-cols-[clamp(132px,14vw,170px)_repeat(16,minmax(34px,1fr))] border-b border-[#050607] bg-[#172027] text-[0.65rem] text-[#91a4ad]">
              <span className="border-r border-[#303b42] px-3 py-1.5 uppercase">Playlist</span>
              {Array.from({ length: 16 }).map((_, index) => (
                <span className="border-r border-[#303b42] px-2 py-1.5" key={`bar-${index}`}>
                  {index + 1}
                </span>
              ))}
            </div>

            <div className="h-full overflow-auto">
              <div>
                {visibleCategories.map((category, laneIndex) => {
                  const categoryProducts = getProductsByCategory(category.id).filter((product) => {
                    if (filterMode === "free") {
                      return product.isFree;
                    }

                    if (filterMode === "paid") {
                      return !product.isFree;
                    }

                    return true;
                  });

                  if (categoryProducts.length === 0) {
                    return null;
                  }

                  return (
                    <section className="grid min-h-[116px] grid-cols-[clamp(132px,14vw,170px)_minmax(0,1fr)] border-b border-[#050607]" key={category.id}>
                      <aside className="border-r border-[#303b42] bg-[#192229]">
                        <div className="flex items-center gap-2 border-b border-[#303b42] px-2 py-1.5">
                          <span className="h-3 w-3 border border-black" style={{ backgroundColor: category.accent }} />
                          <span className="text-[0.68rem] uppercase text-[#9daeb6]">Track {laneIndex + 1}</span>
                        </div>
                        <div className="px-2 py-2">
                          <h3 className="text-base font-semibold [font-family:var(--font-heading)]">{category.name}</h3>
                          <p className="mt-1 min-h-8 text-[0.68rem] leading-snug text-[var(--muted)]">{category.description}</p>
                          <div className="mt-2 flex gap-1">
                            <button className={panelButtonClass} type="button" onClick={() => scrollLane(category.id, "left")}>
                              Back
                            </button>
                            <button className={panelButtonClass} type="button" onClick={() => scrollLane(category.id, "right")}>
                              Next
                            </button>
                          </div>
                        </div>
                      </aside>

                      <div
                        className="overflow-x-auto"
                        ref={(node) => {
                          laneRefs.current[category.id] = node;
                        }}
                        style={{
                          background:
                            "repeating-linear-gradient(90deg, rgba(125,148,158,0.2) 0, rgba(125,148,158,0.2) 1px, transparent 1px, transparent 54px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 216px), repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 31px), #162027",
                        }}
                      >
                        <div className="grid min-h-[115px] min-w-[620px] grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-1 items-center gap-x-1.5 p-2">
                          {categoryProducts.map((product, index) => (
                            <article
                              className="min-h-[82px] overflow-hidden rounded-[3px] border border-l-[5px] bg-[#26343c] shadow-[0_2px_5px_rgba(0,0,0,0.32)]"
                              key={product.id}
                              style={{
                                ...clipStyle(index, category.id),
                                borderColor: category.accent,
                                background:
                                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0)), linear-gradient(135deg, rgba(54,78,88,0.95), rgba(30,41,48,0.95))",
                              }}
                            >
                              <button
                                className="block w-full px-2 py-1.5 text-left"
                                onClick={() => setSelectedProduct(product)}
                                type="button"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-[0.63rem] font-semibold uppercase text-[#c8f5ff]">
                                    {typeLabel[product.type]} {product.isFree ? "FREE" : `$${product.price}`}
                                  </p>
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-green)]" />
                                </div>
                                <h4 className="mt-1 truncate text-sm font-semibold [font-family:var(--font-heading)]">{product.title}</h4>
                                <div className="mt-2 flex h-8 items-center gap-[3px] overflow-hidden border-y border-white/10 bg-black/14 px-1">
                                  {renderWaveform(product, category.accent)}
                                </div>
                              </button>
                              <div className="flex border-t border-black/30">
                                <button
                                  className="flex-1 bg-black/15 px-2 py-1 text-[0.62rem] font-semibold uppercase text-[#b7c6cd] hover:bg-black/30"
                                  onClick={() => setSelectedProduct(product)}
                                  type="button"
                                >
                                  Inspect
                                </button>
                                <Link
                                  className="flex-1 border-l border-black/30 bg-black/15 px-2 py-1 text-center text-[0.62rem] font-semibold uppercase text-[#b7c6cd] hover:bg-black/30"
                                  href={`/products/${product.slug}`}
                                >
                                  Open
                                </Link>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </main>

          <aside className="min-h-0 border-l border-[#050607] bg-[#131a20] xl:overflow-y-auto">
            <div className="border-b border-[#303b42] bg-[#1b242b] px-3 py-2">
              <p className="text-[0.67rem] uppercase text-[#8c9da5]">Inspector</p>
              <h2 className="text-lg font-semibold [font-family:var(--font-heading)]">Channel settings</h2>
            </div>

            {selectedProduct ? (
              <div className="p-3">
                <div className="border border-[#3a474f] bg-[#0e1317]">
                  <div className="flex items-center justify-between border-b border-[#303b42] bg-[#202a31] px-2 py-1">
                    <span className="text-[0.66rem] uppercase text-[#aebdc5]">{typeLabel[selectedProduct.type]}</span>
                    <span className="text-[0.66rem] text-[var(--accent-amber)]">
                      {selectedProduct.isFree ? "FREE" : `$${selectedProduct.price}`}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-2xl font-semibold [font-family:var(--font-heading)]">{selectedProduct.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#c8d5dc]">{selectedProduct.longDescription}</p>
                    <div className="mt-4 grid grid-cols-4 gap-1.5">
                      {["VOL", "PAN", "CUT", "RES"].map((label, index) => (
                        <div className="text-center" key={label}>
                          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#56646c] bg-[radial-gradient(circle_at_35%_30%,#42515a,#141b20_68%)]">
                            <span
                              className="block h-5 w-[2px] origin-bottom bg-[var(--accent-cyan)]"
                              style={{ transform: `rotate(${-35 + index * 22}deg)` }}
                            />
                          </div>
                          <p className="mt-1 text-[0.62rem] text-[#91a4ad]">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-8 gap-1">
                      {Array.from({ length: 16 }).map((_, index) => (
                        <span
                          aria-hidden="true"
                          className={`h-5 border border-black/40 ${
                            (index + selectedProduct.title.length) % 3 === 0 ? "bg-[var(--accent-green)]" : "bg-[#28343b]"
                          }`}
                          key={`step-${selectedProduct.id}-${index}`}
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-[0.74rem] text-[var(--muted)]">{selectedProduct.compatibility.join(" / ")}</p>
                    <div className="mt-4 flex gap-2">
                      <Link className={panelButtonClass} href={`/products/${selectedProduct.slug}`}>
                        Open product
                      </Link>
                      <button className={panelButtonClass} onClick={() => setSelectedProduct(null)} type="button">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border border-[#3a474f] bg-[#0e1317] p-3">
                  <p className="text-[0.67rem] uppercase text-[#8c9da5]">Routing</p>
                  <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 text-[0.74rem]">
                    <span>Insert</span>
                    <span className="bg-[#202a31] px-2 py-1">08</span>
                    <span>Category</span>
                    <span className="bg-[#202a31] px-2 py-1">{selectedCategory?.name ?? "Catalog"}</span>
                    <span>Status</span>
                    <span className="bg-[#202a31] px-2 py-1">{selectedProduct.featured ? "Featured" : "Ready"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 text-sm text-[var(--muted)]">Select a clip to inspect product channel settings.</div>
            )}
          </aside>
        </div>

        <footer className="shrink-0 border-t border-[#050607] bg-[#11171c]">
          <div className="flex overflow-x-auto p-1.5">
            {[...categories, { id: "master", name: "Master", slug: "master", accent: "var(--accent-blue)", description: "Output" }].map(
              (channel, index) => (
                <div className="mr-1.5 grid w-[100px] shrink-0 grid-rows-[auto_1fr_auto] border border-[#303b42] bg-[#1a2228] sm:w-[112px]" key={channel.id}>
                  <div className="flex items-center justify-between border-b border-[#303b42] px-2 py-1">
                    <span className="text-[0.62rem] uppercase text-[#91a4ad]">Insert {index + 1}</span>
                    <span className="h-2 w-2" style={{ backgroundColor: channel.accent }} />
                  </div>
                  <div className="flex items-end justify-center gap-1 px-2 py-1.5">
                    {Array.from({ length: 8 }).map((_, meterIndex) => (
                      <span
                        aria-hidden="true"
                        className="w-2 bg-[var(--accent-green)]"
                        key={`${channel.id}-meter-${meterIndex}`}
                        style={{ height: 12 + ((meterIndex * 11 + index * 6) % 48), opacity: meterIndex > 5 ? 0.52 : 0.88 }}
                      />
                    ))}
                  </div>
                  <div className="truncate border-t border-[#303b42] px-2 py-1 text-center text-[0.68rem] text-[#c5d1d7]">{channel.name}</div>
                </div>
              ),
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
