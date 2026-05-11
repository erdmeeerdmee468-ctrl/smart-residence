import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const { name, phoneNumber, unitNumber, avatarUrl } = await req.json();
    const cleanAvatarUrl = typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl : null;

    await prisma.$runCommandRaw({
      update: "User",
      updates: [{
        q: { _id: { $oid: gate.id } },
        u: {
          $set: {
            name: String(name ?? "").trim() || null,
            phoneNumber: String(phoneNumber ?? "").trim() || null,
            unitNumber: String(unitNumber ?? "").trim() || null,
            avatarUrl: cleanAvatarUrl,
            updatedAt: new Date(),
          },
        },
      }],
    });

    const result = await prisma.$runCommandRaw({
      find: "User",
      filter: { _id: { $oid: gate.id } },
      projection: { name: 1, email: 1, role: 1, phoneNumber: 1, unitNumber: 1, avatarUrl: 1, createdAt: 1 },
      limit: 1,
    });

    const updated = (result as { cursor?: { firstBatch?: Record<string, unknown>[] } }).cursor?.firstBatch?.[0];
    return NextResponse.json(updated ? { ...updated, id: gate.id } : { success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
