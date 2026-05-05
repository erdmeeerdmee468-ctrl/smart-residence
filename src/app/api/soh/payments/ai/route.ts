import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type PaymentForAI = {
  amount: number;
  month: string;
  status: string;
  description: string | null;
  resident: {
    name: string | null;
    email: string;
    unitNumber: string | null;
  };
};

function buildPaymentContext(payments: PaymentForAI[]) {
  const lines = payments.map((payment) => {
    const residentName = payment.resident.name ?? payment.resident.email;
    const unit = payment.resident.unitNumber ? `${payment.resident.unitNumber}-р тоот` : "тоотгүй";
    return `- ${residentName} (${unit}), сар: ${payment.month}, дүн: ${payment.amount}₮, статус: ${payment.status}, тайлбар: ${payment.description ?? "—"}`;
  });

  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["SOH", "ADMIN"]);
    if (gate instanceof NextResponse) return gate;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ message: "GROQ_API_KEY тохируулаагүй байна" }, { status: 500 });
    }

    const { question } = await req.json();
    const cleanQuestion = typeof question === "string" ? question.trim() : "";

    if (!cleanQuestion) {
      return NextResponse.json({ message: "Асуулт хоосон байна" }, { status: 400 });
    }

    const payments = await prisma.payment.findMany({
      include: {
        resident: {
          select: {
            name: true,
            email: true,
            unitNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 120,
    });

    const context = buildPaymentContext(payments);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Чи СӨХ менежерт тусалдаг AI туслах. Зөвхөн өгөгдсөн төлбөрийн мэдээлэл дээр үндэслэн товч, ойлгомжтой Монгол хариу өг. Хэрвээ мэдээлэл дутуу бол яг аль мэдээлэл дутууг хэл.",
        },
        {
          role: "user",
          content: `Төлбөрийн мэдээлэл:\n${context}\n\nАсуулт: ${cleanQuestion}`,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json({ message: "AI хариулт үүсгэж чадсангүй" }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("SOH payments AI error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
