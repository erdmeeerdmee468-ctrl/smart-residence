import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

type ResidentSummary = {
  name: string | null;
  email: string;
  unitNumber: string | null;
};

type PaymentRow = {
  id: string;
  residentId: string;
  amount: number;
  month: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

const residentSelect = {
  id: true,
  name: true,
  email: true,
  unitNumber: true,
} as const;

function toResidentSummary(
  resident: { name: string | null; email: string; unitNumber: string | null } | null,
): ResidentSummary {
  return resident ?? { name: null, email: "", unitNumber: null };
}

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["SOH", "ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        residentId: true,
        amount: true,
        month: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const residentIds = Array.from(new Set(payments.map((payment) => payment.residentId)));
    const residents = await prisma.user.findMany({
      where: { id: { in: residentIds } },
      select: residentSelect,
    });

    const residentMap = new Map(residents.map((resident) => [resident.id, resident]));

    return NextResponse.json(
      payments.map((payment) => ({
        ...payment,
        resident: toResidentSummary(residentMap.get(payment.residentId) ?? null),
      })),
    );
  } catch (error) {
    console.error("SOH payments GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["SOH"]);
    if (gate instanceof NextResponse) return gate;

    const { residentId, residentIds, amount, month, description } = await req.json();
    const bulkResidentIds = Array.isArray(residentIds)
      ? residentIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      : [];

    if ((!residentId && bulkResidentIds.length === 0) || !amount || !month) {
      return NextResponse.json({ message: "Мэдээлэл дутуу байна" }, { status: 400 });
    }

    if (bulkResidentIds.length > 0) {
      const cleanAmount = Number(amount);
      if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
        return NextResponse.json({ message: "Төлбөрийн дүн буруу байна" }, { status: 400 });
      }

      const residents = await prisma.user.findMany({
        where: { id: { in: Array.from(new Set(bulkResidentIds)) }, role: "RESIDENT" },
        select: residentSelect,
      });
      const payments = await Promise.all(
        residents.map((resident) =>
          prisma.payment.create({
            data: { residentId: resident.id, amount: cleanAmount, month, description, status: "PENDING" },
            select: {
              id: true,
              residentId: true,
              amount: true,
              month: true,
              description: true,
              status: true,
              createdAt: true,
            },
          }),
        ),
      );
      const residentMap = new Map(residents.map((resident) => [resident.id, resident]));

      return NextResponse.json({
        success: true,
        count: payments.length,
        payments: payments.map((payment) => ({
          ...payment,
          resident: toResidentSummary(residentMap.get(payment.residentId) ?? null),
        })),
      });
    }

    const payment = await prisma.payment.create({
      data: { residentId, amount, month, description, status: "PENDING" },
      select: {
        id: true,
        residentId: true,
        amount: true,
        month: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    const resident = await prisma.user.findUnique({
      where: { id: residentId },
      select: residentSelect,
    });

    if (resident?.email) {
      try {
        await transporter.sendMail({
          from: `"Smart Residence СӨХ" <${process.env.GMAIL_USER}>`,
          to: resident.email,
          subject: `${month} сарын төлбөрийн мэдэгдэл`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0d1117; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #1f2937;">
              <h2 style="color: #3b82f6; margin: 0 0 4px 0;">Smart Residence</h2>
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 13px;">Орон сууцны удирдлагын систем</p>

              <h3 style="color: #fff; margin: 0 0 16px 0;">Төлбөрийн мэдэгдэл</h3>

              <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Оршин суугч:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right;">${resident.name ?? "—"}</td>
                  </tr>
                  ${resident.unitNumber ? `
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Тоот:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right;">${resident.unitNumber}-р тоот</td>
                  </tr>` : ""}
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Сар:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right;">${month}</td>
                  </tr>
                  ${description ? `
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Тайлбар:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right;">${description}</td>
                  </tr>` : ""}
                  <tr>
                    <td colspan="2" style="border-top: 1px solid #30363d; padding-top: 12px; margin-top: 8px;"></td>
                  </tr>
                  <tr>
                    <td style="color: #9ca3af; font-size: 15px; font-weight: bold; padding: 6px 0;">Нийт дүн:</td>
                    <td style="color: #3b82f6; font-size: 20px; font-weight: 900; text-align: right;">${Number(amount).toLocaleString()} ₮</td>
                  </tr>
                </table>
              </div>

              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                Төлбөрийн мэдэгдэл таны системд бүртгэгдлээ.
                Системд нэвтэрч төлбөрөө шалгана уу.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    return NextResponse.json({
      ...payment,
      resident: toResidentSummary(resident),
    });
  } catch (error) {
    console.error("SOH payment error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
