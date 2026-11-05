import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import SoundsCatalog from "@/components/sounds-catalog";
import { listStorefrontProducts } from "@/lib/commerce";
import { categories } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sounds",
  description: "The full 808bytes catalog of Sauce packs, plugins, one-shots, and producer tools. Digital downloads with instant delivery.",
  alternates: {
    canonical: "/sounds",
  },
};

export default async function SoundsPage() {
  const products = await listStorefrontProducts();

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-[#151515]">
      <SiteHeader />
      <section className="px-4 pb-16 pt-28 sm:px-6 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Digital catalog</p>
          <h1 className="mt-3 text-4xl font-bold leading-none [font-family:var(--font-heading)] sm:text-6xl">
            Sounds
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f605c]">
            Every current 808bytes drop in one place. Packs, plugins, one-shots, and tools, delivered as instant digital downloads.
          </p>

          <div className="mt-10">
            <SoundsCatalog categories={categories} products={products} />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
