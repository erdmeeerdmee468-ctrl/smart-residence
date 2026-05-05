import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

type ResidentSummary = {
  name: string | null;
  unitNumber: string | null;
  email: string;
};

type RequestRow = {
  id: string;
  residentId: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
};

const residentSelect = {
  id: true,
  name: true,
  unitNumber: true,
  email: true,
} as const;

function toResidentSummary(resident: {
  name: string | null;
  unitNumber: string | null;
  email: string;
} | null): ResidentSummary {
  return resident ?? { name: null, unitNumber: null, email: "" };
}

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["SOH", "ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const requests = await prisma.request.findMany({
      select: {
        id: true,
        residentId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const residentIds = Array.from(new Set(requests.map((request) => request.residentId)));
    const residents = await prisma.user.findMany({
      where: { id: { in: residentIds } },
      select: residentSelect,
    });

    const residentMap = new Map(residents.map((resident) => [resident.id, resident]));

    return NextResponse.json(
      requests.map((request) => ({
        ...request,
        resident: toResidentSummary(residentMap.get(request.residentId) ?? null),
      })),
    );
  } catch (error) {
    console.error("SOH requests GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["SOH", "ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const { id, status } = await req.json();

    const updated = await prisma.request.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        residentId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    const resident = await prisma.user.findUnique({
      where: { id: updated.residentId },
      select: residentSelect,
    });

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      const statusLabel: Record<string, string> = {
        IN_PROGRESS: "Шийдэгдэж байна",
        RESOLVED: "Шийдэгдсэн",
      };

      const statusColor: Record<string, string> = {
        IN_PROGRESS: "#a855f7",
        RESOLVED: "#10b981",
      };

      if (resident && (status === "IN_PROGRESS" || status === "RESOLVED")) {
        await transporter.sendMail({
          from: `"Smart Residence СӨХ" <${process.env.GMAIL_USER}>`,
          to: resident.email,
          subject: `Таны хүсэлтийн статус шинэчлэгдлээ`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0d1117; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #1f2937;">
              <h2 style="color: #3b82f6; margin: 0 0 4px 0;">Smart Residence</h2>
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 13px;">Орон сууцны удирдлагын систем</p>
              <h3 style="color: #fff; margin: 0 0 16px 0;">Хүсэлтийн статус шинэчлэгдлээ</h3>
              <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 8px 0;">Оршин суугч:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right;">${resident.name ?? "—"}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 8px 0;">Шинэ статус:</td>
                    <td style="text-align: right;">
                      <span style="background: ${statusColor[status]}20; color: ${statusColor[status]}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                        ${statusLabel[status]}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
              <p style="color: #9ca3af; font-size: 13px;">
                Системд нэвтэрч дэлгэрэнгүй мэдээллийг шалгана уу.
              </p>
            </div>
          `,
        });
        console.log(`✅ Status update email sent to: ${resident.email}`);
      }
    } catch (emailErr) {
      console.error("❌ Email failed:", emailErr);
    }

    return NextResponse.json({
      ...updated,
      resident: toResidentSummary(resident),
    });
  } catch (error) {
    console.error("SOH requests PATCH error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
