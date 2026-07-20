import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-10 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-2xl border border-[#151515] bg-white p-6 shadow-[10px_10px_0_#151515] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Checkout canceled</p>
        <h1 className="mt-2 text-4xl font-bold [font-family:var(--font-heading)] sm:text-5xl">No charge made</h1>
        <p className="mt-3 text-sm leading-6 text-[#57544d]">
          Payment was canceled before completion. Your cart choices are still local to this browser, so you can return and retry anytime.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link className="bg-[#151515] px-4 py-2 text-sm font-bold uppercase text-white" href="/checkout">
            Return to checkout
          </Link>
          <Link className="border border-[#151515] px-4 py-2 text-sm font-bold uppercase" href="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
