import { NextResponse } from "next/server";
import { LEGACY_SESSION_COOKIES, SESSION_COOKIE } from "@/lib/auth-session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  for (const name of LEGACY_SESSION_COOKIES) {
    response.cookies.delete(name);
  }
  return response;
}
