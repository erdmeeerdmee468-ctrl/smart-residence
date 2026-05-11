import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSessionUser, requireRoles } from "@/lib/session";
import { sendApprovalEmail } from "@/lib/email";

type RawRegistrationRequest = {
  _id?: { $oid?: string } | string;
  name?: string | null;
  email?: string | null;
  password?: string | null;
  phoneNumber?: string | null;
  unitNumber?: string | null;
  note?: string | null;
  status?: string | null;
  createdAt?: Date | string | { $date?: string | number };
  updatedAt?: Date | string | { $date?: string | number };
};

function objectIdToString(value: RawRegistrationRequest["_id"]) {
  if (typeof value === "string") return value;
  return value?.$oid ?? "";
}

function normalizeRequest(request: RawRegistrationRequest) {
  return {
    id: objectIdToString(request._id),
    name: request.name ?? "",
    email: request.email ?? "",
    password: request.password ?? "",
    phoneNumber: request.phoneNumber ?? null,
    unitNumber: request.unitNumber ?? null,
    note: request.note ?? null,
    status: request.status ?? "PENDING",
    createdAt: request.createdAt ?? null,
    updatedAt: request.updatedAt ?? null,
  };
}

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  const result = await prisma.$runCommandRaw({
    find: "RegistrationRequest",
    filter: {},
    sort: { createdAt: -1 },
  });
  const requests = ((result as { cursor?: { firstBatch?: RawRegistrationRequest[] } }).cursor?.firstBatch ?? []).map(normalizeRequest);

  return NextResponse.json(requests);
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const { id, status } = await req.json();
    if (!id || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "Буруу өгөгдөл" }, { status: 400 });
    }

    const found = await prisma.$runCommandRaw({
      find: "RegistrationRequest",
      filter: { _id: { $oid: id } },
      limit: 1,
    });
    const rawRequest = (found as { cursor?: { firstBatch?: RawRegistrationRequest[] } }).cursor?.firstBatch?.[0];
    const request = rawRequest ? normalizeRequest(rawRequest) : null;
    if (!request) {
      return NextResponse.json({ message: "Хүсэлт олдсонгүй" }, { status: 404 });
    }

    await prisma.$runCommandRaw({
      update: "RegistrationRequest",
      updates: [{
        q: { _id: { $oid: id } },
        u: { $set: { status, updatedAt: new Date() } },
      }],
    });
    const updated = { ...request, status, updatedAt: new Date().toISOString() };

    if (status === "APPROVED") {
      const existingUser = await prisma.user.findUnique({ where: { email: request.email } });
      if (!existingUser) {
        if (!request.password) {
          return NextResponse.json({ message: "Энэ бүртгэлийн хүсэлтэд нууц үг байхгүй байна. Дахин бүртгүүлэх шаардлагатай." }, { status: 400 });
        }
        const hashed = await bcrypt.hash(request.password, 10);
        const user = await prisma.user.create({
          data: {
            name: request.name,
            email: request.email,
            password: hashed,
            role: "RESIDENT",
            unitNumber: request.unitNumber,
            phoneNumber: request.phoneNumber,
          },
        });
        await sendApprovalEmail({
          to: request.email,
          name: request.name,
        }).catch((err) => console.error("Approval email failed:", err));
        return NextResponse.json({ ...updated, user }, { status: 200 });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Registration request update error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
