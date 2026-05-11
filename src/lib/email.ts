import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS?.replace(/\s/g, ""),
  },
});

function getAppUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function sendApprovalEmail({
  to,
  name,
}: {
  to: string;
  name?: string | null;
}) {
  const userName = name || to.split("@")[0];

  await transporter.sendMail({
    from: `"Өндөр Хотхон" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Таны бүртгэл баталгаажлаа",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#059669">Тавтай морил! 👋</h2>
        <p>Сайн байна уу, <strong>${userName}</strong></p>
        <p>Таныг <strong>Өндөр Хотхон</strong>-ы оршин суугчийн системд <strong>амжилттай бүртгэлээ</strong>.</p>
        <p>Таны бүртгэл админ-аар баталгаажсан бөгөөд та системд нэвтрэх боломжтой боллоо.</p>
        <p><a href="${getAppUrl()}/login" style="display:inline-block;padding:10px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Нэвтрэх</a></p>
        <p style="font-size:12px;color:#9ca3af;margin-top:16px">Хэрэв та энэ бүртгэлийг хүсээгүй бол үл тооно уу.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail({
  to,
  name,
  password,
}: {
  to: string;
  name?: string | null;
  password: string;
}) {
  const userName = name || to.split("@")[0];

  await transporter.sendMail({
    from: `"Өндөр Хотхон" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Таны бүртгэл баталгаажлаа",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#059669">Тавтай морил! 👋</h2>
        <p>Сайн байна уу, <strong>${userName}</strong></p>
        <p>Таныг <strong>Өндөр Хотхон</strong>-ы оршин суугчийн системд амжилттай бүртгэлээ.</p>
        <p>Таны нэвтрэх мэдээлэл:</p>
        <table style="width:100%;background:#f9fafb;border-radius:6px;padding:12px;margin:12px 0">
          <tr><td style="padding:8px;color:#6b7280">Имэйл:</td><td style="padding:8px;font-weight:bold">${to}</td></tr>
          <tr><td style="padding:8px;color:#6b7280">Нууц үг:</td><td style="padding:8px;font-weight:bold">${password}</td></tr>
        </table>
        <p><a href="${getAppUrl()}/login" style="display:inline-block;padding:10px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Нэвтрэх</a></p>
        <p style="font-size:12px;color:#9ca3af;margin-top:16px">Хэрэв та энэ бүртгэлийг хүсээгүй бол үл тооно уу.</p>
      </div>
    `,
  });
}
