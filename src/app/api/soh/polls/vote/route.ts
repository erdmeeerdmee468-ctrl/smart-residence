import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
  if (gate instanceof NextResponse) return gate;

  const { optionId } = await req.json();
  const updated = await prisma.pollOption.update({
    where: { id: optionId },
    data: { votes: { increment: 1 } },
  });
  return NextResponse.json(updated);
}