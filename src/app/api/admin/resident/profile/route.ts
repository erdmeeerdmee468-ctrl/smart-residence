import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const { name, phoneNumber } = await req.json();

    const updated = await prisma.user.update({
      where: { id: gate.id },
      data: { name, phoneNumber },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}