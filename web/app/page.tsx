"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DawMenuBar, DawMeter, dawButtonClass } from "@/components/daw-chrome";
import { categories, getProductsByCategory, type Product } from "@/lib/store-data";

const typeLabel: Record<Product["type"], string> = {
  vst: "VST",
  pack: "PACK",
  oneshot: "ONE SHOT",
  merch: "MERCH",
};

const guideStorageKey = "808bytes-store-guide-dismissed";

export default function Home() {
  const [filterMode, setFilterMode] = useState<"all" | "free" | "paid">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => getProductsByCategory("featured")[0] ?? null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const laneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const panelButtonClass = dawButtonClass;

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
    const span = 9 + ((index + laneOffset) % 3);
    const start = 2 + index * 11 + laneOffset;

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
  const selectedActionLabel = selectedProduct?.isFree ? "Download free" : "Buy now";

  useEffect(() => {
    if (window.localStorage.getItem(guideStorageKey) !== "true") {
      const frame = window.requestAnimationFrame(() => setIsGuideOpen(true));
      return () => window.cancelAnimationFrame(frame);
    }

    return undefined;
  }, []);

  const closeGuide = () => {
    window.localStorage.setItem(guideStorageKey, "true");
    setIsGuideOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="flex min-h-screen flex-col overflow-hidden border border-black bg-[var(--frame)] xl:h-screen">
        <header className="shrink-0 border-b border-[#090a0c] bg-[#141518] shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <DawMenuBar
            items={[
              { label: "Shop", href: "/#catalog" },
              { label: "Free Downloads", href: "/#catalog" },
              { label: "Plugins", href: "/#catalog" },
              { label: "Packs", href: "/#catalog" },
              { label: "Merch", href: "/#catalog" },
              { label: "About", href: "/about" },
              { label: "Cart", href: "/#product-actions" },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <div className="grid grid-cols-[auto_auto] overflow-hidden border border-[#4a4c50] bg-[#1b1d20] text-[0.68rem]">
              <span className="border-r border-[#383b3f] px-2 py-1 text-[#9a9890]">STORE</span>
              <span className="px-3 py-1 font-semibold text-[var(--commerce)]">808bytes</span>
              <span className="border-t border-r border-[#383b3f] px-2 py-1 text-[#9a9890]">MODE</span>
              <span className="border-t border-[#383b3f] px-3 py-1 font-semibold">SHOP</span>
            </div>

            <div className="flex items-center gap-1 border border-[#4a4c50] bg-[#1b1d20] px-2 py-1 text-[0.68rem]">
              <span className="text-[#9a9890]">CATALOG</span>
              <span className="bg-[#0d0e10] px-2 py-1 font-semibold text-[var(--accent-cyan)]">Plugins / Packs / One-shots / Merch</span>
            </div>

            <div className="flex items-center gap-1 border border-[#4a4c50] bg-[#1b1d20] p-1">
              {(["all", "free", "paid"] as const).map((mode) => (
                <button
                  className={`h-7 border px-3 text-[0.66rem] font-semibold uppercase ${
                    filterMode === mode
                      ? "border-[var(--accent-cyan)] bg-[#2b2e2d] text-[#e5dfd1]"
                      : "border-[#3e4044] bg-[#202225] text-[#ada9a0]"
                  }`}
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>

            <DawMeter label="STORE BUS" />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#2a2d31] bg-[#101113] px-3 py-2 text-[0.72rem]">
            <span className="font-semibold uppercase text-[#e4dfd4]">Shop 808bytes</span>
            <span className="text-[#aaa69e]">DAW-inspired browsing for plugins, packs, one-shots, and merch. Buy and free-download actions are highlighted in green.</span>
            <div className="ml-auto flex gap-2">
              <button
                className="border border-[var(--commerce)] bg-[#1d3325] px-2.5 py-1 text-[0.68rem] font-bold uppercase text-[#dfffe8] transition hover:bg-[#284d35]"
                onClick={() => setIsGuideOpen(true)}
                type="button"
              >
                Guide
              </button>
              <a className="border border-[var(--commerce)] bg-[var(--commerce)] px-2.5 py-1 text-[0.68rem] font-bold uppercase text-[var(--commerce-text)] transition hover:bg-[var(--commerce-hover)]" href="#catalog">
                Browse catalog
              </a>
              <a className="border border-[var(--commerce)] bg-[#1d3325] px-2.5 py-1 text-[0.68rem] font-bold uppercase text-[#dfffe8] transition hover:bg-[#284d35]" href="#product-actions">
                Product actions
              </a>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[clamp(170px,15vw,220px)_minmax(0,1fr)_clamp(250px,23vw,320px)]">
          <aside className="min-h-0 border-r border-[#090a0c] bg-[#151618] xl:overflow-y-auto">
            <div className="border-b border-[#33363a] bg-[#1f2023] px-3 py-2">
              <p className="text-[0.67rem] uppercase text-[#96938b]">Shop browser</p>
              <h2 className="text-lg font-semibold [font-family:var(--font-heading)]">Catalog</h2>
            </div>

            <div className="p-2">
              <div className="mb-3">
                <p className="border border-[#34363a] bg-[#24262a] px-2 py-1 text-[0.68rem] font-semibold uppercase text-[#d4cec2]">
                  Quick filters
                </p>
                {(["all", "free", "paid"] as const).map((mode) => (
                  <button
                    className={`block w-full border-x border-b px-3 py-1.5 text-left text-[0.76rem] font-semibold transition hover:border-[var(--commerce)] hover:bg-[#24262a] ${
                      filterMode === mode
                        ? "border-[var(--commerce)] bg-[#1d3325] text-[var(--commerce-hover)]"
                        : "border-[#2d3034] bg-[#17191c] text-[#ddd6c8] hover:text-[var(--commerce-hover)]"
                    }`}
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    type="button"
                  >
                    {mode === "all" ? "All products" : mode === "free" ? "Free downloads" : "Paid products"}
                  </button>
                ))}
              </div>

              <div>
                <p className="border border-[#34363a] bg-[#24262a] px-2 py-1 text-[0.68rem] font-semibold uppercase text-[#d4cec2]">
                  Categories
                </p>
                {categories.map((category) => (
                  <button
                    className="flex w-full items-center justify-between border-x border-b border-[#2d3034] bg-[#17191c] px-3 py-1.5 text-left text-[0.76rem] font-semibold text-[#ddd6c8] transition hover:border-[var(--commerce)] hover:bg-[#24262a] hover:text-[var(--commerce-hover)]"
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

          <main className="min-h-0 overflow-hidden bg-[#121315]" id="catalog">
            <div className="grid grid-cols-[clamp(132px,14vw,170px)_repeat(16,minmax(34px,1fr))] border-b border-[#090a0c] bg-[#1c1e21] text-[0.65rem] text-[#9b978e]">
              <span className="border-r border-[#34363a] px-3 py-1.5 uppercase">Playlist</span>
              {Array.from({ length: 16 }).map((_, index) => (
                <span className="border-r border-[#34363a] px-2 py-1.5" key={`bar-${index}`}>
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
                    <section className="grid min-h-[116px] grid-cols-[clamp(132px,14vw,170px)_minmax(0,1fr)] border-b border-[#090a0c]" key={category.id}>
                      <aside className="border-r border-[#34363a] bg-[#202124]">
                        <div className="flex items-center gap-2 border-b border-[#34363a] px-2 py-1.5">
                          <span className="h-3 w-3 border border-black" style={{ backgroundColor: category.accent }} />
                          <span className="text-[0.68rem] uppercase text-[#aaa69d]">Track {laneIndex + 1}</span>
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
                            "repeating-linear-gradient(90deg, rgba(132,130,120,0.14) 0, rgba(132,130,120,0.14) 1px, transparent 1px, transparent 54px), repeating-linear-gradient(90deg, rgba(255,255,255,0.055) 0, rgba(255,255,255,0.055) 1px, transparent 1px, transparent 216px), repeating-linear-gradient(180deg, rgba(255,255,255,0.045) 0, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 31px), #181a1d",
                        }}
                      >
                        <div className="grid min-h-[136px] min-w-[720px] grid-cols-[repeat(44,minmax(0,1fr))] grid-rows-1 items-center gap-x-1.5 p-2">
                          {categoryProducts.map((product, index) => (
                            <article
                              className="min-h-[106px] overflow-hidden rounded-[3px] border border-l-[5px] bg-[#2a2b2e] shadow-[0_2px_5px_rgba(0,0,0,0.32)]"
                              key={product.id}
                              style={{
                                ...clipStyle(index, category.id),
                                borderColor: category.accent,
                                background:
                                  "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0)), linear-gradient(135deg, rgba(58,58,55,0.96), rgba(31,32,34,0.96))",
                              }}
                            >
                              <button
                                className="block w-full px-2 py-1.5 text-left"
                                onClick={() => setSelectedProduct(product)}
                                type="button"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-[0.63rem] font-semibold uppercase text-[#d9d2c4]">
                                    {typeLabel[product.type]} {product.isFree ? "FREE" : `$${product.price}`}
                                  </p>
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-green)]" />
                                </div>
                                <h4 className="mt-1 truncate text-sm font-semibold [font-family:var(--font-heading)]">{product.title}</h4>
                                <p className="mt-1 line-clamp-1 text-[0.68rem] text-[#b8b3a8]">{product.shortDescription}</p>
                                <div className="mt-2 flex h-8 items-center gap-[3px] overflow-hidden border-y border-white/10 bg-black/14 px-1">
                                  {renderWaveform(product, category.accent)}
                                </div>
                              </button>
                              <div className="flex border-t border-black/30">
                                <button
                                  className="flex-1 bg-black/15 px-2 py-1 text-[0.62rem] font-semibold uppercase text-[#b8b3a8] hover:bg-black/30"
                                  onClick={() => setSelectedProduct(product)}
                                  type="button"
                                >
                                  Inspect
                                </button>
                                <Link
                                  className="flex-1 border-l border-black/30 bg-[var(--commerce)] px-2 py-1 text-center text-[0.62rem] font-bold uppercase text-[var(--commerce-text)] hover:bg-[var(--commerce-hover)]"
                                  href={`/products/${product.slug}`}
                                >
                                  {product.isFree ? "Free" : "Buy"}
                                </Link>
                                <Link
                                  className="flex-1 border-l border-black/30 bg-black/15 px-2 py-1 text-center text-[0.62rem] font-semibold uppercase text-[#b8b3a8] hover:bg-black/30"
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

          <aside className="min-h-0 border-l border-[#090a0c] bg-[#17181b] xl:overflow-y-auto" id="product-actions">
            <div className="border-b border-[#34363a] bg-[#202124] px-3 py-2">
              <p className="text-[0.67rem] uppercase text-[#96938b]">Product actions</p>
              <h2 className="text-lg font-semibold [font-family:var(--font-heading)]">Selected item</h2>
            </div>

            {selectedProduct ? (
              <div className="p-3">
                <div className="border border-[#3d3f43] bg-[#101113]">
                  <div className="flex items-center justify-between border-b border-[#34363a] bg-[#24262a] px-2 py-1">
                    <span className="text-[0.66rem] uppercase text-[#c4beb3]">{typeLabel[selectedProduct.type]}</span>
                    <span className="text-[0.66rem] text-[var(--accent-amber)]">
                      {selectedProduct.isFree ? "FREE" : `$${selectedProduct.price}`}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-2xl font-semibold [font-family:var(--font-heading)]">{selectedProduct.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#cbc5ba]">{selectedProduct.longDescription}</p>
                    <div className="mt-4 grid grid-cols-4 gap-1.5">
                      {["VOL", "PAN", "CUT", "RES"].map((label, index) => (
                        <div className="text-center" key={label}>
                          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#595a5d] bg-[radial-gradient(circle_at_35%_30%,#464845,#17191c_68%)]">
                            <span
                              className="block h-5 w-[2px] origin-bottom bg-[var(--accent-cyan)]"
                              style={{ transform: `rotate(${-35 + index * 22}deg)` }}
                            />
                          </div>
                          <p className="mt-1 text-[0.62rem] text-[#9b978e]">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-8 gap-1">
                      {Array.from({ length: 16 }).map((_, index) => (
                        <span
                          aria-hidden="true"
                          className={`h-5 border border-black/40 ${
                            (index + selectedProduct.title.length) % 3 === 0 ? "bg-[var(--accent-green)]" : "bg-[#2c2d30]"
                          }`}
                          key={`step-${selectedProduct.id}-${index}`}
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-[0.74rem] text-[var(--muted)]">{selectedProduct.compatibility.join(" / ")}</p>
                    <div className="mt-4 grid gap-2">
                      <Link
                        className="border border-[var(--commerce)] bg-[var(--commerce)] px-3 py-2 text-center text-sm font-bold uppercase text-[var(--commerce-text)] transition hover:bg-[var(--commerce-hover)]"
                        href={`/products/${selectedProduct.slug}`}
                      >
                        {selectedActionLabel}
                      </Link>
                      <Link className={panelButtonClass} href={`/products/${selectedProduct.slug}`}>
                        View full product page
                      </Link>
                      <button className={panelButtonClass} onClick={() => setSelectedProduct(null)} type="button">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border border-[#3d3f43] bg-[#101113] p-3">
                  <p className="text-[0.67rem] uppercase text-[#96938b]">Shopping details</p>
                  <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 text-[0.74rem]">
                    <span>Price</span>
                    <span className="bg-[#24262a] px-2 py-1">{selectedProduct.isFree ? "FREE" : `$${selectedProduct.price}`}</span>
                    <span>Category</span>
                    <span className="bg-[#24262a] px-2 py-1">{selectedCategory?.name ?? "Catalog"}</span>
                    <span>Format</span>
                    <span className="bg-[#24262a] px-2 py-1">{selectedProduct.compatibility[0] ?? "Digital"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 text-sm text-[var(--muted)]">Select a clip to see price, format, and buy/download actions.</div>
            )}
          </aside>
        </div>

        {isGuideOpen ? (
          <div className="fixed inset-0 z-50 bg-black/72 px-4 py-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="store-guide-title">
            <div className="pointer-events-none absolute top-[88px] left-6 hidden max-w-[220px] border border-[var(--commerce)] bg-[#101113] p-2 text-xs font-semibold uppercase text-[#dfffe8] shadow-[0_12px_28px_rgba(0,0,0,0.45)] lg:block">
              Shop nav - start with category links
            </div>
            <div className="pointer-events-none absolute top-[240px] left-[250px] hidden max-w-[210px] border border-[var(--commerce)] bg-[#101113] p-2 text-xs font-semibold uppercase text-[#dfffe8] shadow-[0_12px_28px_rgba(0,0,0,0.45)] xl:block">
              {"<-"} filters and categories
            </div>
            <div className="pointer-events-none absolute bottom-[130px] left-1/2 hidden max-w-[230px] -translate-x-1/2 border border-[var(--commerce)] bg-[#101113] p-2 text-xs font-semibold uppercase text-[#dfffe8] shadow-[0_12px_28px_rgba(0,0,0,0.45)] lg:block">
              Product clips - inspect, buy, or open
            </div>
            <div className="pointer-events-none absolute top-[270px] right-6 hidden max-w-[230px] border border-[var(--commerce)] bg-[#101113] p-2 text-xs font-semibold uppercase text-[#dfffe8] shadow-[0_12px_28px_rgba(0,0,0,0.45)] xl:block">
              Product actions - final buy/download panel {"->"}
            </div>

            <div className="mx-auto grid min-h-full max-w-[620px] place-items-center">
              <section className="w-full border border-[#4a4c50] bg-[#101113] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
                <div className="border-b border-[#34363a] bg-[#24262a] px-4 py-2">
                  <p className="text-[0.68rem] font-semibold uppercase text-[var(--commerce)]">Project loaded</p>
                  <h2 className="text-3xl font-semibold [font-family:var(--font-heading)]" id="store-guide-title">
                    808bytes Store Guide
                  </h2>
                </div>

                <div className="p-4">
                  <p className="text-sm leading-relaxed text-[#cbc5ba]">
                    This is a DAW-inspired store, not a full music app. Use the green controls to browse, buy, and download.
                  </p>

                  <div className="mt-4 grid gap-2">
                    {[
                      ["1", "Choose a category or filter", "Use the Shop browser on the left or the top nav."],
                      ["2", "Select a product clip", "Click a clip to load details into Product actions."],
                      ["3", "Use the green action", "Buy and free-download buttons are always bright green."],
                      ["4", "Open details when needed", "Use Open or View full product page for full info."],
                    ].map(([step, title, body]) => (
                      <div className="grid grid-cols-[34px_1fr] gap-3 border border-[#34363a] bg-[#17191c] p-3" key={step}>
                        <span className="grid h-8 w-8 place-items-center border border-[var(--commerce)] bg-[var(--commerce)] text-sm font-bold text-[var(--commerce-text)]">
                          {step}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold uppercase text-[#e4dfd4]">{title}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{body}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="border border-[var(--commerce)] bg-[var(--commerce)] px-4 py-2 text-sm font-bold uppercase text-[var(--commerce-text)] transition hover:bg-[var(--commerce-hover)]"
                      onClick={closeGuide}
                      type="button"
                    >
                      Start browsing
                    </button>
                    <button className={panelButtonClass} onClick={closeGuide} type="button">
                      Do not show again
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
