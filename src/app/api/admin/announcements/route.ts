import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
  if (gate instanceof NextResponse) return gate;

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json(announcements);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN", "SOH"]);
  if (gate instanceof NextResponse) return gate;

  const { title, content, type } = await req.json();
  const announcement = await prisma.announcement.create({
    data: { title, content, type },
  });
  return NextResponse.json(announcement);
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  const { id } = await req.json();
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}