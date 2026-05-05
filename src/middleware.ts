import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route configurations
const PROTECTED_ROUTES = {
  ADMIN: ["/admin", "/api/admin"],
  SOH: ["/soh", "/api/soh"],
  RESIDENT: ["/resident", "/api/resident"],
  AUTH: ["/dashboard"],
};

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-code", "/unauthorized", "/api/auth"];

// Role-specific route check
function matchesProtectedRoute(path: string, prefix: string): boolean {
  return path.startsWith(prefix);
}

// Verify session from cookie (Edge Runtime-safe, no Prisma)
function verifySession(request: NextRequest): { userId: string; role: string } | null {
  try {
    const userId = request.cookies.get("userId")?.value;
    const userRole = request.cookies.get("userRole")?.value;

    if (!userId || !userRole) return null;

    // Validate role
    const validRoles = ["ADMIN", "SOH", "RESIDENT"];
    if (!validRoles.includes(userRole)) return null;

    return { userId, role: userRole };
  } catch {
    return null;
  }
}

// Check if route is public
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Skip Next.js internal routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Verify session (Edge Runtime-safe)
  const session = verifySession(request);

  // Not authenticated - redirect to login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const { role } = session;

  // Admin routes
  if (matchesProtectedRoute(pathname, PROTECTED_ROUTES.ADMIN[0]) || 
      matchesProtectedRoute(pathname, PROTECTED_ROUTES.ADMIN[1])) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // SOH routes
  if (matchesProtectedRoute(pathname, PROTECTED_ROUTES.SOH[0]) || 
      matchesProtectedRoute(pathname, PROTECTED_ROUTES.SOH[1])) {
    if (role !== "SOH" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Resident routes
  if (matchesProtectedRoute(pathname, PROTECTED_ROUTES.RESIDENT[0]) || 
      matchesProtectedRoute(pathname, PROTECTED_ROUTES.RESIDENT[1])) {
    if (role !== "RESIDENT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
