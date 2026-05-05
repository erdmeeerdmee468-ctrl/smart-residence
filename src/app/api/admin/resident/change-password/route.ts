import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const { currentPassword, newPassword } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: gate.id } });
    if (!user) return NextResponse.json({ message: "Хэрэглэгч олдсонгүй" }, { status: 404 });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return NextResponse.json({ message: "Одоогийн нууц үг буруу байна" }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: gate.id }, data: { password: hashed } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}