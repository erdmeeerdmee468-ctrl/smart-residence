import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const [residentCount, recentUsers, openRequests] = await Promise.all([
      prisma.user.count({ where: { role: "RESIDENT" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          unitNumber: true,
          createdAt: true,
        },
      }),
      prisma.request.count({ where: { status: "OPEN" } }),
    ]);

    return NextResponse.json({
      stats: {
        residentCount,
        totalIncome: "0 ₮",
        pendingRequests: openRequests,
        emptyApartments: 0,
      },
      latestResidents: recentUsers,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
