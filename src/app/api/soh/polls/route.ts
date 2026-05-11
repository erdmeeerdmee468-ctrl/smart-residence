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

/** SOH (эсвэл ADMIN) санал асуулгыг устгана. */
export async function DELETE(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["SOH", "ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const body = (await req.json()) as { id?: string };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ message: "Poll id дамжуулна уу" }, { status: 400 });
    }

    const existing = await prisma.poll.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Санал асуулга олдсонгүй" }, { status: 404 });
    }

    // Prisma MongoDB дээр relation cascade найдвартай ажиллахгүй байж болох тул poll options-ийг эхлээд устгана.
    await prisma.pollOption.deleteMany({ where: { pollId: id } });
    await prisma.poll.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Polls DELETE error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}