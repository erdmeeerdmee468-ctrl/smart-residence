import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

async function getSohRecipientEmails(): Promise<string[]> {
  const sohUsers: { email: string }[] = await prisma.user.findMany({
    where: {
      role: "SOH",
      email: { not: "" },
    },
    select: { email: true },
  });

  return Array.from(
    new Set(
      sohUsers
        .map((user: { email: string }) => user.email)
        .filter((email): email is string => Boolean(email)),
    ),
  );
}

export async function GET() {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const requests = await prisma.request.findMany({
      where: { residentId: gate.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Requests GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    const { title, description } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ message: "Гарчиг болон тайлбар оруулна уу" }, { status: 400 });
    }

    const request = await prisma.request.create({
      data: { residentId: gate.id, title, description },
      include: {
        resident: { select: { name: true, email: true, unitNumber: true } },
      },
    });

    try {
      const recipientEmails = await getSohRecipientEmails();

      if (recipientEmails.length === 0) {
        console.warn("No SOH recipients found for request notification.");
      } else {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Smart Residence" <${process.env.GMAIL_USER}>`,
          to: recipientEmails[0],
          bcc: recipientEmails.slice(1),
          subject: `Шинэ хүсэлт: ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0d1117; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #1f2937;">
              <h2 style="color: #3b82f6; margin: 0 0 4px 0;">Smart Residence</h2>
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 13px;">Орон сууцны удирдлагын систем</p>
              <h3 style="color: #fff; margin: 0 0 16px 0;">Шинэ хүсэлт ирлээ</h3>
              <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 8px 0;">Оршин суугч:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right; font-weight: bold;">${request.resident.name ?? "—"}</td>
                  </tr>
                  ${request.resident.unitNumber ? `
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 8px 0;">Тоот:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right;">${request.resident.unitNumber}-р тоот</td>
                  </tr>` : ""}
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 8px 0;">Гарчиг:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right; font-weight: bold;">${title}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 13px; padding: 8px 0; vertical-align: top;">Тайлбар:</td>
                    <td style="color: #fff; font-size: 13px; text-align: right;">${description}</td>
                  </tr>
                </table>
              </div>
              <p style="color: #9ca3af; font-size: 13px;">
                СӨХ системд нэвтэрч хүсэлтийг шалгана уу.
              </p>
            </div>
          `,
        });
        console.log(`✅ SOH notification sent to ${recipientEmails.length} recipient(s)`);
      }
    } catch (emailErr) {
      console.error("❌ Email failed:", emailErr);
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Request POST error:", error);
    return NextResponse.json({ message: "Серверийн алдаа" }, { status: 500 });
  }
}
