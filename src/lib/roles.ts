/** Клиент болон серверт аюулгүйгээр ашиглах — Prisma-г татахгүй */
export type AppRole = "ADMIN" | "SOH" | "RESIDENT";

export const ROLE_HOME: Record<AppRole, string> = {
  ADMIN: "/admin",
  SOH: "/soh",
  RESIDENT: "/resident",
};

export function isAppRole(value: string | undefined | null): value is AppRole {
  return value === "ADMIN" || value === "SOH" || value === "RESIDENT";
}
