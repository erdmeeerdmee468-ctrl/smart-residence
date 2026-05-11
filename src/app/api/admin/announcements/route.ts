import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

type RawAnnouncement = {
  id: string;
  title?: string;
  content?: string;
  type?: string;
  imageUrl?: string | null;
  createdAt?: string | Date;
};

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
  if (gate instanceof NextResponse) return gate;

  const result = await prisma.$runCommandRaw({
    aggregate: "Announcement",
    pipeline: [
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          title: 1,
          content: 1,
          type: 1,
          imageUrl: 1,
          createdAt: 1,
        },
      },
    ],
    cursor: {},
  });
  const announcements = ((result as { cursor?: { firstBatch?: RawAnnouncement[] } }).cursor?.firstBatch ?? []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title ?? "",
    content: announcement.content ?? "",
    type: announcement.type ?? "INFO",
    imageUrl: announcement.imageUrl ?? null,
    createdAt: announcement.createdAt,
  }));
  return NextResponse.json(announcements);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN", "SOH"]);
  if (gate instanceof NextResponse) return gate;

  const { title, content, type, imageUrl } = await req.json();
  const cleanImageUrl = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl : undefined;
  await prisma.$runCommandRaw({
    insert: "Announcement",
    documents: [{
      title,
      content,
      type,
      ...(cleanImageUrl ? { imageUrl: cleanImageUrl } : {}),
      createdAt: new Date(),
    }],
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  const { id } = await req.json();
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
