import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
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

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return Response.json(
        { message: "Имэйл эсвэл нууц үг буруу байна" },
        { status: 401 }
      );
    }

    const maxAge = 60 * 60 * 24 * 7;
    const cookieStr = (name: string, value: string) =>
      `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;

    const setCookieHeader = [
      cookieStr("userId", user.id),
      cookieStr("userRole", user.role),
      cookieStr("userName", user.name ?? ""),
    ].join(", ");

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": setCookieHeader,
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { message: "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}