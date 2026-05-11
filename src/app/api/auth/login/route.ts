import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionCookieValue, LEGACY_SESSION_COOKIES, SESSION_COOKIE } from "@/lib/auth-session";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { loginSchema, safeParse } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const rateLimitResponse = rateLimitMiddleware(req, "LOGIN");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();

    const validation = safeParse(loginSchema, body);
    if (!validation.success) {
      return Response.json(
        { message: "Буруу өгөгдөл", errors: validation.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return Response.json(
        { message: "Имэйл эсвэл нууц үг буруу байна" },
        { status: 401 }
      );
    }

    const accountState = await prisma.$runCommandRaw({
      find: "User",
      filter: { _id: { $oid: user.id } },
      projection: { isActive: 1 },
      limit: 1,
    }).catch(() => null);
    const account = (accountState as { cursor?: { firstBatch?: { isActive?: boolean }[] } } | null)?.cursor?.firstBatch?.[0];
    if (account?.isActive === false) {
      return Response.json(
        { message: "Таны бүртгэл түр идэвхгүй болсон байна. Админтай холбогдоно уу." },
        { status: 403 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return Response.json(
        { message: "Имэйл эсвэл нууц үг буруу байна" },
        { status: 401 }
      );
    }

    const maxAge = 60 * 60 * 24 * 7;
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 },
    );

    response.cookies.set(SESSION_COOKIE, await createSessionCookieValue({
      userId: user.id,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + maxAge,
    }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    for (const name of LEGACY_SESSION_COOKIES) {
      response.cookies.delete(name);
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { message: "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
