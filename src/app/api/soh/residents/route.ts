import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["SOH", "ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  const residents = await prisma.user.findMany({
    where: { role: "RESIDENT" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      unitNumber: true,
    },
  });
  return NextResponse.json(residents);
}