import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSessionUser, requireRoles } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";
import type { Prisma, Role } from "@prisma/client";

const allowedRoles = new Set<Role>(["ADMIN", "RESIDENT", "SOH"]);

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function readUserActiveState(id: string) {
  const raw = await prisma.$runCommandRaw({
    find: "User",
    filter: { _id: { $oid: id } },
    projection: { isActive: 1 },
    limit: 1,
  }).catch(() => null);
  const first = (raw as { cursor?: { firstBatch?: { isActive?: boolean }[] } } | null)?.cursor?.firstBatch?.[0];
  return first?.isActive !== false;
}

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
      avatarUrl: true,
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
    const { id, password, isActive, ...body } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID байхгүй байна" }, { status: 400 });
    }

    const data: Prisma.UserUpdateInput = {};

    if ("name" in body) data.name = cleanString(body.name) || null;
    if ("phoneNumber" in body) data.phoneNumber = cleanString(body.phoneNumber) || null;
    if ("unitNumber" in body) data.unitNumber = cleanString(body.unitNumber) || null;
    const hasAvatarUrl = "avatarUrl" in body;
    const avatarUrl = hasAvatarUrl ? cleanString(body.avatarUrl) || null : undefined;

    if ("email" in body) {
      const email = cleanString(body.email).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ message: "И-мэйл хаяг буруу байна" }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ message: "Энэ и-мэйл өөр хэрэглэгч дээр бүртгэлтэй байна" }, { status: 400 });
      }
      data.email = email;
    }

    if ("role" in body) {
      const role = cleanString(body.role) as Role;
      if (!allowedRoles.has(role)) {
        return NextResponse.json({ message: "Эрхийн төрөл буруу байна" }, { status: 400 });
      }
      data.role = role;
    }

    if (typeof password === "string" && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ message: "Нууц үг хамгийн багадаа 6 тэмдэгт байна" }, { status: 400 });
      }
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        unitNumber: true,
        phoneNumber: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (typeof isActive === "boolean" || hasAvatarUrl) {
      const set = {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(hasAvatarUrl ? { avatarUrl } : {}),
        updatedAt: new Date(),
      };

      await prisma.$runCommandRaw({
        update: "User",
        updates: [{
          q: { _id: { $oid: id } },
          u: { $set: set },
        }],
      });
    }

    return NextResponse.json({
      ...updated,
      ...(hasAvatarUrl ? { avatarUrl } : {}),
      isActive: typeof isActive === "boolean" ? isActive : await readUserActiveState(id),
    });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ message: "ID байхгүй байна" }, { status: 400 });
    }

    if (id === gate.id) {
      return NextResponse.json({ message: "Өөрийн admin бүртгэлийг устгах боломжгүй." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Хэрэглэгч олдсонгүй" }, { status: 404 });
    }

    await prisma.payment.deleteMany({ where: { residentId: id } });
    await prisma.request.deleteMany({ where: { residentId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE resident error:", error);
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

    await sendWelcomeEmail({ to: email.trim(), name: name?.trim(), password }).catch((err) =>
      console.error("Welcome email failed:", err)
    );

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST resident error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
