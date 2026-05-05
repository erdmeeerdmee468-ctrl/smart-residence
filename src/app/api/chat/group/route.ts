import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { insertGroupChatMessage, listGroupChatMessages } from "@/lib/groupChatMongo";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const messages = await listGroupChatMessages(prisma);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Group chat GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const userName = gate.name?.trim() || gate.email || "Хэрэглэгч";

    const { content } = await req.json();
    const text = typeof content === "string" ? content.trim() : "";

    if (!text) {
      return NextResponse.json({ message: "Мессеж хоосон байна" }, { status: 400 });
    }

    if (text.length > 1000) {
      return NextResponse.json({ message: "Мессеж хэт урт байна" }, { status: 400 });
    }

    const message = await insertGroupChatMessage(prisma, {
      userId: gate.id,
      userName,
      userRole: gate.role,
      content: text,
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Group chat POST error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
