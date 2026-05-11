import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionCookieValue } from "@/lib/auth-session";

type Role = "ADMIN" | "SOH" | "RESIDENT";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/unauthorized",
  "/not-found",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register-request",
];

const PAGE_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/soh", roles: ["ADMIN", "SOH"] },
  { prefix: "/resident", roles: ["ADMIN", "RESIDENT"] },
  { prefix: "/dashboard", roles: ["ADMIN", "SOH", "RESIDENT"] },
];

const API_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/api/admin/announcements", roles: ["ADMIN", "SOH", "RESIDENT"] },
  { prefix: "/api/admin/resident/payments", roles: ["RESIDENT"] },
  { prefix: "/api/admin/resident/profile", roles: ["ADMIN", "SOH", "RESIDENT"] },
  { prefix: "/api/admin/resident/requests", roles: ["RESIDENT"] },
  { prefix: "/api/admin/resident/change-password", roles: ["ADMIN", "SOH", "RESIDENT"] },
  { prefix: "/api/admin", roles: ["ADMIN"] },
  { prefix: "/api/soh", roles: ["ADMIN", "SOH"] },
  { prefix: "/api/resident", roles: ["RESIDENT"] },
  { prefix: "/api/ai", roles: ["ADMIN", "SOH", "RESIDENT"] },
  { prefix: "/api/chat", roles: ["ADMIN", "SOH", "RESIDENT"] },
];

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => (route === "/" ? path === "/" : path.startsWith(route)));
}

function findAccessRule(path: string) {
  const rules = path.startsWith("/api/") ? API_ACCESS : PAGE_ACCESS;
  return rules.find((rule) => path.startsWith(rule.prefix));
}

function unauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

function forbidden(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Эрх хүрэхгүй" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/unauthorized", request.url));
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  const session = await verifySessionCookieValue(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login" && session) {
    const home = session.role === "ADMIN" ? "/admin" : session.role === "SOH" ? "/soh" : "/resident";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (isPublicRoute(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const accessRule = findAccessRule(pathname);
  if (!accessRule) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (!session) {
    return unauthorized(request);
  }

  if (!accessRule.roles.includes(session.role)) {
    return forbidden(request);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)"],
};

export default proxy;
