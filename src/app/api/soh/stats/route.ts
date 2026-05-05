import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["SOH", "ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      newRequests,
      totalResidents,
      monthPayments,
      announcements,
      requests,
      polls,
    ] = await Promise.all([
      prisma.request.count({ where: { status: "OPEN" } }),
      prisma.user.count({ where: { role: "RESIDENT" } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.request.findMany({
        where: { status: "OPEN" },
        include: { resident: { select: { name: true, unitNumber: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.poll.findMany({
        include: { options: true },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
    ]);

    return NextResponse.json({
      stats: {
        newRequests,
        totalResidents,
        monthIncome: monthPayments._sum.amount ?? 0,
        activePolls: polls.length,
      },
      requests,
      announcements,
      polls,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}