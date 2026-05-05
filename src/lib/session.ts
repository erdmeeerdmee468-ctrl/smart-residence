import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export type SessionUser = {
  id: string;
  role: Role;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  unitNumber: string | null;
};

/** Cookie-ийн `userId`-аар DB-ээс баталгаажуулна — `userRole` cookie-д битгий найд */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = jar.get("userId")?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true, email: true, phoneNumber: true, unitNumber: true },
  });
  return user ?? null;
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
