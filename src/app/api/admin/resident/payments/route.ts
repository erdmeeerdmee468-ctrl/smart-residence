import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

function buildReceiptNo(paymentId: string, paidAt: Date) {
  return `SR-${paidAt.getFullYear()}-${paymentId.slice(-6).toUpperCase()}`;
}

export async function GET() {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const payments = await prisma.payment.findMany({
      where: { residentId: gate.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

/** Оршин суугч өөрийн хүлээгдэж буй төлбөрийг системд «төлсөн» гэж бүртгэнэ (дансны баримт үүсэх үндэс). */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const body = (await req.json()) as { paymentId?: string };
    const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";
    if (!paymentId) {
      return NextResponse.json({ message: "Төлбөрийн ID дамжуулна уу" }, { status: 400 });
    }

    const existing = await prisma.payment.findFirst({
      where: { id: paymentId, residentId: gate.id },
    });

    if (!existing) {
      return NextResponse.json({ message: "Төлбөр олдсонгүй" }, { status: 404 });
    }

    if (existing.status === "PAID") {
      return NextResponse.json({ message: "Энэ төлбөр аль хэдийн төлөгдсөн байна" }, { status: 400 });
    }

    if (existing.status !== "PENDING" && existing.status !== "OVERDUE") {
      return NextResponse.json({ message: "Энэ төлбөрийг энд төлөх боломжгүй" }, { status: 400 });
    }

    const paidAt = new Date();
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "PAID", paidAt },
      select: {
        id: true,
        residentId: true,
        amount: true,
        month: true,
        description: true,
        status: true,
        createdAt: true,
        paidAt: true,
      },
    });

    const receiptNo = buildReceiptNo(payment.id, paidAt);

    return NextResponse.json({ payment, receiptNo });
  } catch (error) {
    console.error("Payments POST error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
