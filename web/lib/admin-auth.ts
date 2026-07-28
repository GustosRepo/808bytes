import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "808bytes_admin";

const getAdminToken = () => process.env.ADMIN_ACCESS_TOKEN;

export const isAdminAuthConfigured = () => Boolean(getAdminToken());

export const canUseDevAdminBypass = () =>
  process.env.NODE_ENV !== "production" && !isAdminAuthConfigured();

export const isAdminAuthenticated = async () => {
  if (canUseDevAdminBypass()) {
    return true;
  }

  const token = getAdminToken();
  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === token;
};

export const requireAdmin = async () => {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
};

export const setAdminCookie = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });
};

export const clearAdminCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
};

export const verifyAdminToken = (token: string) => {
  const expected = getAdminToken();
  return Boolean(expected && token === expected);
};
