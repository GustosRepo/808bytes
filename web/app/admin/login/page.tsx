import Link from "next/link";
import { canUseDevAdminBypass, isAdminAuthConfigured } from "@/lib/admin-auth";
import { loginAdmin } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const loginErrorText: Record<string, string> = {
  config: "Supabase admin login is not configured.",
  invalid: "Invalid email or password.",
  rate_limited: "Too many login attempts. Try again later.",
  unauthorized: "That account is not allowed to access admin.",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const devBypass = canUseDevAdminBypass();
  const errorText = params.error ? loginErrorText[params.error] ?? loginErrorText.invalid : null;

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
        {errorText ? <p className="mt-3 text-sm font-bold text-[#b34b44]">{errorText}</p> : null}
        <form action={loginAdmin} className="mt-5 grid gap-3">
          <input
            className="border border-[#151515] px-3 py-2 text-sm"
            name="email"
            placeholder="Email"
            type="email"
          />
          <input
            className="border border-[#151515] px-3 py-2 text-sm"
            name="password"
            placeholder={devBypass ? "Password optional locally" : "Password"}
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
