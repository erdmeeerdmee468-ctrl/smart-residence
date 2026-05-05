import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const users = await prisma.user.findMany({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      unitNumber: true,
      phoneNumber: true,
      createdAt: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, month: true, amount: true },
      },
    },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID байхгүй байна" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const { name, email, password, unitNumber, phoneNumber } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Имэйл болон нууц үг оруулна уу" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { message: "Энэ имэйл бүртгэлтэй байна" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: email.trim(),
        password: hashed,
        role: "RESIDENT",
        unitNumber: unitNumber?.trim() || null,
        phoneNumber: phoneNumber?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        unitNumber: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST resident error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
