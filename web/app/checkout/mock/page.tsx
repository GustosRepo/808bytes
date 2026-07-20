import { notFound } from "next/navigation";
import { Suspense } from "react";
import MockCheckoutClient from "@/components/mock-checkout-client";

export default function MockCheckoutPage() {
  if (process.env.COMMERCE_MOCK_CHECKOUT !== "true") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-10 text-[#151515] sm:px-6">
      <Suspense
        fallback={
          <section className="mx-auto max-w-2xl border border-[#151515] bg-white p-6 shadow-[10px_10px_0_#151515] sm:p-8">
            <p className="text-sm font-semibold">Loading development checkout...</p>
          </section>
        }
      >
        <MockCheckoutClient />
      </Suspense>
    </main>
  );
}
