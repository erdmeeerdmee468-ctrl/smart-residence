import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { forgotPasswordSchema, safeParse } from "@/lib/validation";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const rateLimitResponse = rateLimitMiddleware(req, "LOGIN");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await req.json();

    // Validate input
    const validation = safeParse(forgotPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Буруу өгөгдөл", errors: validation.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
    return NextResponse.json(
    { message: "Энэ имэйл бүртгэлгүй байна" },
    { status: 404 }
  );
}

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = `${email}-${Date.now()}`;
    const expires = new Date(Date.now() + 1000 * 60 * 15);

    await prisma.passwordResetToken.deleteMany({ where: { email } });
    await prisma.passwordResetToken.create({
      data: { email, token, code, expires },
    });

    await transporter.sendMail({
      from: `"Smart Residence" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Нууц үг сэргээх код",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0d1117; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #1f2937;">
          <h2 style="color: #3b82f6; margin: 0 0 4px 0;">Smart Residence</h2>
          <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 13px;">Орон сууцны удирдлагын систем</p>
          
          <h3 style="color: #fff; margin: 0 0 12px 0;">Нууц үг сэргээх код</h3>
          <p style="color: #9ca3af; margin: 0 0 32px 0; font-size: 14px; line-height: 1.6;">
            Та нууц үг сэргээх хүсэлт илгээсэн байна. Доорх 6 оронтой кодыг оруулна уу.
          </p>

          <div style="background: #161b22; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <p style="color: #6b7280; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 3px;">Баталгаажуулах код</p>
            <p style="color: #3b82f6; font-size: 42px; font-weight: 900; letter-spacing: 14px; margin: 0; font-family: monospace;">${code}</p>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.8;">
            ⏱ Энэ код <strong style="color: #9ca3af;">15 минутын</strong> дараа хүчингүй болно.<br/>
            🔒 Хэрэв та хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}