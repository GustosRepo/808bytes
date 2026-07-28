import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { getAdminUserByEmail, type AdminUserRole } from "@/lib/commerce";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  role: AdminUserRole;
};

type AdminSignInResult =
  | { ok: true; admin: AuthenticatedAdmin }
  | { ok: false; reason: "config" | "invalid" | "unauthorized" };

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;

const getSupabasePublishableKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isAdminAuthConfigured = () => Boolean(getSupabaseUrl() && getSupabasePublishableKey());

export const canUseDevAdminBypass = () =>
  process.env.NODE_ENV !== "production" && !isAdminAuthConfigured();

const createSupabaseAdminClient = async () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Server Actions can.
        }
      },
    },
  });
};

const getAdminForUser = async (user: User | null): Promise<AuthenticatedAdmin | null> => {
  const email = user?.email?.toLowerCase();
  if (!user || !email) {
    return null;
  }

  const adminUser = await getAdminUserByEmail(email);
  if (!adminUser?.isActive) {
    return null;
  }

  return { id: user.id, email, role: adminUser.role };
};

export const getAuthenticatedAdmin = async () => {
  if (canUseDevAdminBypass()) {
    return {
      id: "local-dev-admin",
      email: "local-dev-admin@808bytes.test",
      role: "owner" as const,
    };
  }

  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }

  return getAdminForUser(data.user);
};

export const isAdminAuthenticated = async () => Boolean(await getAuthenticatedAdmin());

export const requireAdmin = async () => {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
};

export const signInAdmin = async (email: string, password: string): Promise<AdminSignInResult> => {
  if (canUseDevAdminBypass()) {
    return {
      ok: true,
      admin: {
        id: "local-dev-admin",
        email: "local-dev-admin@808bytes.test",
        role: "owner",
      },
    };
  }

  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, reason: "config" };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, reason: "invalid" };
  }

  const admin = await getAdminForUser(data.user);
  if (!admin) {
    await supabase.auth.signOut();
    return { ok: false, reason: "unauthorized" };
  }

  return { ok: true, admin };
};

export const signOutAdmin = async () => {
  const supabase = await createSupabaseAdminClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
};
