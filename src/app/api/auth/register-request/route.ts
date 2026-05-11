import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const rateLimitResponse = rateLimitMiddleware(req, "REGISTER_REQUEST");
    if (rateLimitResponse) return rateLimitResponse;

    const { name, email, password, phoneNumber, unitNumber, note } = await req.json();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanName = String(name ?? "").trim();
    const cleanPassword = String(password ?? "");

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return NextResponse.json({ message: "Нэр, имэйл болон нууц үг оруулна уу" }, { status: 400 });
    }

    if (cleanPassword.length < 8) {
      return NextResponse.json({ message: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ message: "Имэйл хаяг буруу байна" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ message: "Энэ имэйл аль хэдийн бүртгэлтэй байна" }, { status: 400 });
    }

    const existingRequest = await prisma.registrationRequest.findFirst({
      where: { email: cleanEmail, status: "PENDING" },
    });
    if (existingRequest) {
      return NextResponse.json({ message: "Энэ имэйлээр бүртгэлийн хүсэлт аль хэдийн илгээгдсэн байна" }, { status: 400 });
    }

    const request = await prisma.registrationRequest.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        phoneNumber: String(phoneNumber ?? "").trim() || null,
        unitNumber: String(unitNumber ?? "").trim() || null,
        note: String(note ?? "").trim() || null,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: request.id, message: "Бүртгэлийн хүсэлт админ руу илгээгдлээ" }, { status: 201 });
  } catch (error) {
    console.error("Register request error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
