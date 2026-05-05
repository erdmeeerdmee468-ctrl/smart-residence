import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
  if (gate instanceof NextResponse) return gate;

  const polls = await prisma.poll.findMany({
    include: { options: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(polls);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["SOH", "ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  const { question, options, expiresAt } = await req.json();
  const poll = await prisma.poll.create({
    data: {
      question,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      options: {
        create: options.map((text: string) => ({ text })),
      },
    },
    include: { options: true },
  });
  return NextResponse.json(poll);
}