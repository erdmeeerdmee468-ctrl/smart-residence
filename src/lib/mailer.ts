import nodemailer from "nodemailer";

const APP_NAME = "Smart Residence";

function getBaseUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

type MailerConfig =
  | {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      from: string;
    }
  | null;

function getMailerConfig(): MailerConfig {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || user;

  if (!host || !user || !pass || !from) {
    console.warn("SMTP configuration is missing. Skipping reset password email.");
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    from,
  };
}

function buildResetPasswordContent(resetUrl: string) {
  return {
    subject: `${APP_NAME} - Нууц үг сэргээх холбоос`,
    text: [
      "Сайн байна уу,",
      "",
      "Таны нууц үг сэргээх хүсэлт хүлээн авлаа.",
      `Нууц үгээ солих холбоос: ${resetUrl}`,
      "",
      "Энэ холбоос 1 цагийн дараа хүчинтэй хугацаа нь дуусна.",
      "Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоорой.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 16px; color: #2563eb;">${APP_NAME}</h2>
        <p>Сайн байна уу,</p>
        <p>Таны нууц үг сэргээх хүсэлт хүлээн авлаа.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
            Нууц үг солих
          </a>
        </p>
        <p style="word-break: break-word;">Эсвэл энэ холбоосыг ашиглана уу:<br />${resetUrl}</p>
        <p>Энэ холбоос 1 цагийн дараа хүчинтэй хугацаа нь дуусна.</p>
        <p>Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоорой.</p>
      </div>
    `,
  };
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const config = getMailerConfig();
  const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;

  if (!config) {
    console.info(`Reset password link for ${to}: ${resetUrl}`);
    return;
  }

  const { host, port, secure, auth, from } = config;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
  });

  const content = buildResetPasswordContent(resetUrl);

  await transporter.sendMail({
    from,
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}
