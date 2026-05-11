"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        
        if (!res.ok) {
          router.push(`/login?from=${encodeURIComponent(pathname)}`);
          return;
        }

        const data = await res.json();
        const userRole = data.user.role;// /api/auth/me-с role ирнэ

        if (allowedRoles && !allowedRoles.includes(userRole)) {
          router.push("/unauthorized");
          return;
        }

        setIsAuthorized(true);
      } catch {
        router.push(`/login?from=${encodeURIComponent(pathname)}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Ачаалж байна...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["ADMIN"]}>{children}</AuthGuard>;
}

export function SohGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["SOH", "ADMIN"]}>{children}</AuthGuard>;
}

export function ResidentGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["RESIDENT", "ADMIN"]}>{children}</AuthGuard>;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}