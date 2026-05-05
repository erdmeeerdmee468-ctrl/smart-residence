import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type DashboardContext = {
  role: string;
  userName: string;
  residentName?: string | null;
  residentUnit?: string | null;
  residentPayments?: { month: string; amount: number; status: string }[];
  residentRequests?: { title: string; status: string; createdAt: Date }[];
  sohPayments?: { month: string; amount: number; status: string; residentUnit: string | null }[];
  sohOpenRequests?: number;
  adminResidentCount?: number;
  adminSohCount?: number;
  adminPendingPayments?: number;
};

async function getContext(userId: string, role: string, userName: string): Promise<DashboardContext> {
  if (role === "RESIDENT") {
    const [resident, payments, requests] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, unitNumber: true },
      }),
      prisma.payment.findMany({
        where: { residentId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { month: true, amount: true, status: true },
      }),
      prisma.request.findMany({
        where: { residentId: userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { title: true, status: true, createdAt: true },
      }),
    ]);

    return {
      role,
      userName,
      residentName: resident?.name ?? null,
      residentUnit: resident?.unitNumber ?? null,
      residentPayments: payments,
      residentRequests: requests,
    };
  }

  if (role === "SOH") {
    const [payments, openRequests] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          month: true,
          amount: true,
          status: true,
          resident: { select: { unitNumber: true } },
        },
      }),
      prisma.request.count({ where: { status: "OPEN" } }),
    ]);

    return {
      role,
      userName,
      sohPayments: payments.map((item) => ({
        month: item.month,
        amount: item.amount,
        status: item.status,
        residentUnit: item.resident.unitNumber,
      })),
      sohOpenRequests: openRequests,
    };
  }

  const [residentCount, sohCount, pendingPayments] = await Promise.all([
    prisma.user.count({ where: { role: "RESIDENT" } }),
    prisma.user.count({ where: { role: "SOH" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
  ]);

  return {
    role,
    userName,
    adminResidentCount: residentCount,
    adminSohCount: sohCount,
    adminPendingPayments: pendingPayments,
  };
}

function contextToText(context: DashboardContext) {
  if (context.role === "RESIDENT") {
    return `
Role: RESIDENT
Name: ${context.residentName ?? context.userName}
Unit: ${context.residentUnit ?? "—"}
Payments:
${(context.residentPayments ?? [])
  .map((item) => `- ${item.month}: ${item.amount}₮ (${item.status})`)
  .join("\n")}
Requests:
${(context.residentRequests ?? [])
  .map((item) => `- ${item.title} (${item.status}) ${item.createdAt.toISOString().slice(0, 10)}`)
  .join("\n")}
`.trim();
  }

  if (context.role === "SOH") {
    return `
Role: SOH
Manager: ${context.userName}
Open requests: ${context.sohOpenRequests ?? 0}
Latest payments:
${(context.sohPayments ?? [])
  .map((item) => `- Unit ${item.residentUnit ?? "—"} | ${item.month} | ${item.amount}₮ | ${item.status}`)
  .join("\n")}
`.trim();
  }

  return `
Role: ADMIN
Admin: ${context.userName}
Resident count: ${context.adminResidentCount ?? 0}
SOH count: ${context.adminSohCount ?? 0}
Pending payments: ${context.adminPendingPayments ?? 0}
`.trim();
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const userName = gate.name?.trim() || gate.email || "Хэрэглэгч";

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ message: "GROQ_API_KEY тохируулаагүй байна" }, { status: 500 });
    }

    const { question } = await req.json();
    const cleanQuestion = typeof question === "string" ? question.trim() : "";

    if (!cleanQuestion) {
      return NextResponse.json({ message: "Асуулт хоосон байна" }, { status: 400 });
    }

    const context = await getContext(gate.id, gate.role, userName);
    const contextText = contextToText(context);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Чи Smart Residence системийн AI туслах. Монгол хэлээр товч, тодорхой хариул. Зөвхөн өгөгдсөн контекст дээр тулгуурла. Тоо дүн хэлэхдээ аль болох шууд хэл.",
        },
        {
          role: "user",
          content: `Контекст:\n${contextText}\n\nАсуулт: ${cleanQuestion}`,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ message: "AI хариулт хоосон байна" }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
