import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionCookieValue } from "@/lib/auth-session";

export type SessionUser = {
  id: string;
  role: Role;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  unitNumber: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: Date | string;
};

/** Signed session cookie-г шалгаад DB-ээс хэрэглэгчийг баталгаажуулна. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const session = await verifySessionCookieValue(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, phoneNumber: true, unitNumber: true },
  });
  if (user && user.role !== session.role) return null;
  if (!user) return null;

  const raw = await prisma.$runCommandRaw({
    find: "User",
    filter: { _id: { $oid: user.id } },
    projection: { avatarUrl: 1, isActive: 1, createdAt: 1 },
    limit: 1,
  }).catch(() => null);
  const first = (raw as { cursor?: { firstBatch?: { avatarUrl?: string | null; isActive?: boolean; createdAt?: Date | string }[] } } | null)?.cursor?.firstBatch?.[0];
  const inactive = (first as Record<string, unknown> | undefined)?.isActive === false;
  if (inactive) return null;
  return { ...user, avatarUrl: first?.avatarUrl ?? null, isActive: true, createdAt: first?.createdAt };
}

export function jsonUnauthorized(message = "Нэвтрэх шаардлагатай") {
  return NextResponse.json({ message }, { status: 401 });
}

export function jsonForbidden(message = "Энэ үйлдлийг таны эрхээр хийх боломжгүй.") {
  return NextResponse.json({ message }, { status: 403 });
}

export function requireRoles(
  user: SessionUser | null,
  allowed: readonly Role[],
): SessionUser | NextResponse {
  if (!user) return jsonUnauthorized();
  if (!allowed.includes(user.role)) {
    return jsonForbidden(`Эрх хүрэхгүй (${user.role}).`);
  }
  return user;
}
