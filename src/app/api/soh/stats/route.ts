import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

type RequestRow = {
  id: string;
  residentId: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
};

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
        select: {
          id: true,
          residentId: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.poll.findMany({
        include: { options: true },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
    ]);

    const residentIds = Array.from(new Set((requests as RequestRow[]).map((request) => request.residentId)));
    const residents = await prisma.user.findMany({
      where: { id: { in: residentIds } },
      select: { id: true, name: true, unitNumber: true },
    });
    const residentMap = new Map(residents.map((resident) => [resident.id, resident]));

    return NextResponse.json({
      stats: {
        newRequests,
        totalResidents,
        monthIncome: monthPayments._sum.amount ?? 0,
        activePolls: polls.length,
      },
      requests: (requests as RequestRow[]).map((request) => ({
        ...request,
        resident: residentMap.get(request.residentId) ?? { name: null, unitNumber: null },
      })),
      announcements,
      polls,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
