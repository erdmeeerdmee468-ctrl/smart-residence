import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  const [totalResidents, payments, recentUsers] = await Promise.all([
    prisma.user.count({ where: { role: "RESIDENT" } }),
    prisma.payment.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.user.findMany({
      where: { role: "RESIDENT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, unitNumber: true, createdAt: true },
    }),
  ]);

  const paidCount = payments.find((p) => p.status === "PAID")?._count ?? 0;
  const pendingCount = payments.find((p) => p.status === "PENDING")?._count ?? 0;
  const overdueCount = payments.find((p) => p.status === "OVERDUE")?._count ?? 0;

  return NextResponse.json({
    totalResidents,
    activeResidents: totalResidents,
    paidCount,
    pendingCount,
    overdueCount,
    recentUsers,
  });
}