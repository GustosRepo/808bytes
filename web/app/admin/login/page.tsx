import Link from "next/link";
import { canUseDevAdminBypass, isAdminAuthConfigured } from "@/lib/admin-auth";
import { loginAdmin } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const devBypass = canUseDevAdminBypass();

  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-10 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-md border border-[#151515] bg-white p-6 shadow-[10px_10px_0_#151515]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Admin</p>
        <h1 className="mt-2 text-4xl font-bold [font-family:var(--font-heading)]">Sign in</h1>
        {devBypass ? (
          <p className="mt-3 text-sm font-semibold text-[#5f5d56]">
            Local admin bypass is active because no production admin token is configured.
          </p>
        ) : null}
        {!isAdminAuthConfigured() && !devBypass ? (
          <p className="mt-3 text-sm font-bold text-[#b34b44]">Admin access is not configured.</p>
        ) : null}
        {params.error ? <p className="mt-3 text-sm font-bold text-[#b34b44]">Invalid admin token.</p> : null}
        <form action={loginAdmin} className="mt-5 grid gap-3">
          <input
            className="border border-[#151515] px-3 py-2 text-sm"
            name="token"
            placeholder={devBypass ? "Token optional locally" : "Admin token"}
            type="password"
          />
          <button className="bg-[#151515] px-4 py-3 text-sm font-bold uppercase text-white" type="submit">
            Enter admin
          </button>
        </form>
        <Link className="mt-3 inline-block text-sm font-bold uppercase text-[#6f6a5e]" href="/">
          Back to site
        </Link>
      </section>
    </main>
  );
}
