import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { verifyCodeSchema, safeParse } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const rateLimitResponse = rateLimitMiddleware(req, "LOGIN");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await req.json();

    // Validate input
    const validation = safeParse(verifyCodeSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Буруу өгөгдөл", errors: validation.errors },
        { status: 400 }
      );
    }

    const { email, code } = validation.data;

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email, code },
    });

    if (!resetToken) {
      return NextResponse.json({ message: "Код буруу байна" }, { status: 400 });
    }

    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      return NextResponse.json({ message: "Кодын хугацаа дууссан байна" }, { status: 400 });
    }

    return NextResponse.json({ success: true, token: resetToken.token });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}