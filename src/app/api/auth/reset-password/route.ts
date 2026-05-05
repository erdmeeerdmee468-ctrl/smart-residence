import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { resetPasswordSchema, safeParse } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const rateLimitResponse = rateLimitMiddleware(req, "LOGIN");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await req.json();

    // Validate input
    const validation = safeParse(resetPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Буруу өгөгдөл", errors: validation.errors },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ message: "Хүсэлт олдсонгүй" }, { status: 400 });
    }

    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.deleteMany({ where: { token } });
      return NextResponse.json({ message: "Кодын хугацаа дууссан байна" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashed },
    });

    await prisma.passwordResetToken.deleteMany({ where: { email: resetToken.email } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}