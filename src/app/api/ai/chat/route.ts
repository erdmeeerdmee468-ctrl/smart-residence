import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";
import { listGroupChatMessages } from "@/lib/groupChatMongo";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

const STATUS_LABEL_MN: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  PAID: "Төлөгдсөн",
  OVERDUE: "Хоцорсон",
  OPEN: "Шинэ",
  IN_PROGRESS: "Хүлээгдэж буй",
  RESOLVED: "Шийдэгдсэн",
};

function fmtAmount(value: number) {
  return `${Math.round(value).toLocaleString("en-US")}₮`;
}

function fmtDate(value: Date | null | undefined) {
  if (!value) return "—";
  return value.toISOString().slice(0, 10);
}

type ResidentContextPayload = {
  role: "RESIDENT";
  name: string;
  unit: string;
  email: string;
  phone: string;
  joinedAt: string;
  totals: {
    pendingCount: number;
    pendingAmount: number;
    overdueCount: number;
    overdueAmount: number;
    paidCount: number;
    paidAmount: number;
  };
  payments: { month: string; amount: number; status: string; paidAt: string; description: string }[];
  requests: { title: string; status: string; createdAt: string; updatedAt: string; description: string }[];
  announcements: { title: string; type: string; createdAt: string; content: string }[];
  polls: { question: string; expiresAt: string; options: { text: string; votes: number }[] }[];
};

type SohContextPayload = {
  role: "SOH";
  name: string;
  email: string;
  totals: {
    residents: number;
    paymentsThisMonthCount: number;
    paymentsThisMonthAmount: number;
    pendingPaymentsCount: number;
    pendingPaymentsAmount: number;
    overduePaymentsCount: number;
    overduePaymentsAmount: number;
    openRequests: number;
    inProgressRequests: number;
    resolvedRequests: number;
    polls: number;
    announcements: number;
  };
  payments: {
    residentName: string;
    unit: string;
    month: string;
    amount: number;
    status: string;
    description: string;
    createdAt: string;
  }[];
  requests: {
    residentName: string;
    unit: string;
    title: string;
    status: string;
    createdAt: string;
    description: string;
  }[];
  residents: { name: string; unit: string; email: string; phone: string }[];
  polls: { question: string; expiresAt: string; options: { text: string; votes: number }[] }[];
  announcements: { title: string; type: string; createdAt: string; content: string }[];
};

type AdminContextPayload = {
  role: "ADMIN";
  name: string;
  email: string;
  totals: {
    residents: number;
    sohManagers: number;
    admins: number;
    paymentsTotalCount: number;
    paymentsTotalAmount: number;
    paymentsPaidAmount: number;
    paymentsPendingAmount: number;
    paymentsOverdueAmount: number;
    requestsOpen: number;
    requestsInProgress: number;
    requestsResolved: number;
    polls: number;
    announcements: number;
    pendingRegistrationRequests: number;
  };
  recentResidents: { name: string; unit: string; email: string; createdAt: string }[];
  recentPayments: {
    residentName: string;
    unit: string;
    month: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
  recentRequests: {
    residentName: string;
    unit: string;
    title: string;
    status: string;
    createdAt: string;
  }[];
};

type ContextPayload = ResidentContextPayload | SohContextPayload | AdminContextPayload;
type ChatHistoryItem = { role: "user" | "assistant"; content: string };
type RawResidentRef = { name?: string | null; email?: string | null; unitNumber?: string | null };
type RawPaymentWithResident = {
  month?: string;
  amount?: number;
  status?: string;
  description?: string | null;
  createdAt?: Date | string;
  resident?: RawResidentRef | null;
};
type RawRequestWithResident = {
  title?: string;
  description?: string | null;
  status?: string;
  createdAt?: Date | string;
  resident?: RawResidentRef | null;
};
type RawAnnouncementRecord = {
  title?: string;
  content?: string;
  type?: string;
  createdAt?: unknown;
};

function sanitizeHistory(value: unknown): ChatHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = (item as { role?: unknown }).role;
      const content = (item as { content?: unknown }).content;
      if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
      const clean = content.trim().slice(0, 1200);
      return clean ? { role, content: clean } : null;
    })
    .filter((item): item is ChatHistoryItem => Boolean(item))
    .slice(-12);
}

function renderAiHistory(history: ChatHistoryItem[]) {
  if (history.length === 0) return "(өмнөх AI яриа алга)";
  return history
    .map((item) => `${item.role === "user" ? "Хэрэглэгч" : "AI"}: ${item.content}`)
    .join("\n");
}

async function renderGroupChatContext() {
  const messages = await listGroupChatMessages(prisma).catch(() => []);
  if (messages.length === 0) return "(групп чат хоосон)";
  return messages
    .slice(-80)
    .map((message) => {
      const date = fmtDate(new Date(message.createdAt));
      return `  - ${date} | ${message.userRole} | ${message.userName}: ${message.content.slice(0, 500)}`;
    })
    .join("\n");
}

function fmtAnyDate(value: unknown) {
  if (value instanceof Date) return fmtDate(value);
  if (typeof value === "string") return fmtDate(new Date(value.replace(/^"+|"+$/g, "")));
  if (value && typeof value === "object" && "$date" in value) {
    const raw = (value as { $date?: string | number }).$date;
    return raw ? fmtDate(new Date(raw)) : "—";
  }
  return "—";
}

async function listPaymentsWithResident(limit: number): Promise<RawPaymentWithResident[]> {
  const result = await prisma.$runCommandRaw({
    aggregate: "Payment",
    pipeline: [
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $lookup: { from: "User", localField: "residentId", foreignField: "_id", as: "residentDocs" } },
      { $addFields: { resident: { $first: "$residentDocs" } } },
      { $project: { residentDocs: 0 } },
    ],
    cursor: {},
  });
  return (result as { cursor?: { firstBatch?: RawPaymentWithResident[] } }).cursor?.firstBatch ?? [];
}

async function listRequestsWithResident(limit: number): Promise<RawRequestWithResident[]> {
  const result = await prisma.$runCommandRaw({
    aggregate: "Request",
    pipeline: [
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $lookup: { from: "User", localField: "residentId", foreignField: "_id", as: "residentDocs" } },
      { $addFields: { resident: { $first: "$residentDocs" } } },
      { $project: { residentDocs: 0 } },
    ],
    cursor: {},
  });
  return (result as { cursor?: { firstBatch?: RawRequestWithResident[] } }).cursor?.firstBatch ?? [];
}

async function listRecentAnnouncements(limit: number): Promise<RawAnnouncementRecord[]> {
  const result = await prisma.$runCommandRaw({
    aggregate: "Announcement",
    pipeline: [
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $project: { _id: 0, title: 1, content: 1, type: 1, createdAt: 1 } },
    ],
    cursor: {},
  });
  return (result as { cursor?: { firstBatch?: RawAnnouncementRecord[] } }).cursor?.firstBatch ?? [];
}

async function countRegistrationRequestsByStatus(status: string) {
  const result = await prisma.$runCommandRaw({
    count: "RegistrationRequest",
    query: { status },
  });
  return Number((result as { n?: number }).n ?? 0);
}

async function buildResidentContext(userId: string): Promise<ResidentContextPayload> {
  const [user, payments, requests, announcements, polls] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, unitNumber: true, phoneNumber: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { residentId: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { month: true, amount: true, status: true, description: true, paidAt: true },
    }),
    prisma.request.findMany({
      where: { residentId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { title: true, description: true, status: true, createdAt: true, updatedAt: true },
    }),
    listRecentAnnouncements(8),
    prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        question: true,
        expiresAt: true,
        options: { select: { text: true, votes: true } },
      },
    }),
  ]);

  const totals = payments.reduce(
    (acc, payment) => {
      if (payment.status === "PENDING") {
        acc.pendingCount += 1;
        acc.pendingAmount += payment.amount;
      } else if (payment.status === "OVERDUE") {
        acc.overdueCount += 1;
        acc.overdueAmount += payment.amount;
      } else if (payment.status === "PAID") {
        acc.paidCount += 1;
        acc.paidAmount += payment.amount;
      }
      return acc;
    },
    { pendingCount: 0, pendingAmount: 0, overdueCount: 0, overdueAmount: 0, paidCount: 0, paidAmount: 0 },
  );

  return {
    role: "RESIDENT",
    name: user?.name ?? user?.email ?? "—",
    unit: user?.unitNumber ?? "—",
    email: user?.email ?? "—",
    phone: user?.phoneNumber ?? "—",
    joinedAt: fmtDate(user?.createdAt ?? null),
    totals,
    payments: payments.map((payment) => ({
      month: payment.month,
      amount: payment.amount,
      status: payment.status,
      paidAt: fmtDate(payment.paidAt ?? null),
      description: payment.description ?? "",
    })),
    requests: requests.map((request) => ({
      title: request.title,
      description: request.description,
      status: request.status,
      createdAt: fmtDate(request.createdAt),
      updatedAt: fmtDate(request.updatedAt),
    })),
    announcements: announcements.map((announcement) => ({
      title: announcement.title ?? "",
      type: announcement.type ?? "INFO",
      createdAt: fmtAnyDate(announcement.createdAt),
      content: announcement.content ?? "",
    })),
    polls: polls.map((poll) => ({
      question: poll.question,
      expiresAt: fmtDate(poll.expiresAt ?? null),
      options: poll.options.map((option) => ({ text: option.text, votes: option.votes })),
    })),
  };
}

async function buildSohContext(userName: string, userEmail: string): Promise<SohContextPayload> {
  const monthKey = new Date().toISOString().slice(0, 7);

  const [residents, allPayments, requests, polls, announcements] = await Promise.all([
    prisma.user.findMany({
      where: { role: "RESIDENT" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { name: true, unitNumber: true, email: true, phoneNumber: true },
    }),
    listPaymentsWithResident(200),
    listRequestsWithResident(60),
    prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { question: true, expiresAt: true, options: { select: { text: true, votes: true } } },
    }),
    listRecentAnnouncements(8),
  ]);

  const totals = allPayments.reduce(
    (acc, payment) => {
      if (payment.status === "PAID" && payment.month === monthKey) {
        acc.paymentsThisMonthCount += 1;
        acc.paymentsThisMonthAmount += payment.amount ?? 0;
      }
      if (payment.status === "PENDING") {
        acc.pendingPaymentsCount += 1;
        acc.pendingPaymentsAmount += payment.amount ?? 0;
      }
      if (payment.status === "OVERDUE") {
        acc.overduePaymentsCount += 1;
        acc.overduePaymentsAmount += payment.amount ?? 0;
      }
      return acc;
    },
    {
      residents: residents.length,
      paymentsThisMonthCount: 0,
      paymentsThisMonthAmount: 0,
      pendingPaymentsCount: 0,
      pendingPaymentsAmount: 0,
      overduePaymentsCount: 0,
      overduePaymentsAmount: 0,
      openRequests: requests.filter((request) => request.status === "OPEN").length,
      inProgressRequests: requests.filter((request) => request.status === "IN_PROGRESS").length,
      resolvedRequests: requests.filter((request) => request.status === "RESOLVED").length,
      polls: polls.length,
      announcements: announcements.length,
    },
  );

  return {
    role: "SOH",
    name: userName,
    email: userEmail,
    totals,
    payments: allPayments.map((payment) => ({
      residentName: payment.resident?.name ?? payment.resident?.email ?? "Устсан хэрэглэгч",
      unit: payment.resident?.unitNumber ?? "—",
      month: payment.month ?? "—",
      amount: payment.amount ?? 0,
      status: payment.status ?? "UNKNOWN",
      description: payment.description ?? "",
      createdAt: fmtAnyDate(payment.createdAt),
    })),
    requests: requests.map((request) => ({
      residentName: request.resident?.name ?? request.resident?.email ?? "Устсан хэрэглэгч",
      unit: request.resident?.unitNumber ?? "—",
      title: request.title ?? "—",
      status: request.status ?? "UNKNOWN",
      createdAt: fmtAnyDate(request.createdAt),
      description: request.description ?? "",
    })),
    residents: residents.map((resident) => ({
      name: resident.name ?? resident.email,
      unit: resident.unitNumber ?? "—",
      email: resident.email,
      phone: resident.phoneNumber ?? "—",
    })),
    polls: polls.map((poll) => ({
      question: poll.question,
      expiresAt: fmtDate(poll.expiresAt ?? null),
      options: poll.options.map((option) => ({ text: option.text, votes: option.votes })),
    })),
    announcements: announcements.map((announcement) => ({
      title: announcement.title ?? "",
      type: announcement.type ?? "INFO",
      createdAt: fmtAnyDate(announcement.createdAt),
      content: announcement.content ?? "",
    })),
  };
}

async function buildAdminContext(userName: string, userEmail: string): Promise<AdminContextPayload> {
  const [
    residentCount,
    sohCount,
    adminCount,
    payments,
    requests,
    polls,
    announcements,
    pendingRegistrationRequests,
    recentResidents,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "RESIDENT" } }),
    prisma.user.count({ where: { role: "SOH" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    listPaymentsWithResident(80),
    listRequestsWithResident(40),
    prisma.poll.count(),
    prisma.announcement.count(),
    countRegistrationRequestsByStatus("PENDING"),
    prisma.user.findMany({
      where: { role: "RESIDENT" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { name: true, email: true, unitNumber: true, createdAt: true },
    }),
  ]);

  const totals = payments.reduce(
    (acc, payment) => {
      acc.paymentsTotalCount += 1;
      acc.paymentsTotalAmount += payment.amount ?? 0;
      if (payment.status === "PAID") acc.paymentsPaidAmount += payment.amount ?? 0;
      if (payment.status === "PENDING") acc.paymentsPendingAmount += payment.amount ?? 0;
      if (payment.status === "OVERDUE") acc.paymentsOverdueAmount += payment.amount ?? 0;
      return acc;
    },
    {
      residents: residentCount,
      sohManagers: sohCount,
      admins: adminCount,
      paymentsTotalCount: 0,
      paymentsTotalAmount: 0,
      paymentsPaidAmount: 0,
      paymentsPendingAmount: 0,
      paymentsOverdueAmount: 0,
      requestsOpen: requests.filter((request) => request.status === "OPEN").length,
      requestsInProgress: requests.filter((request) => request.status === "IN_PROGRESS").length,
      requestsResolved: requests.filter((request) => request.status === "RESOLVED").length,
      polls,
      announcements,
      pendingRegistrationRequests,
    },
  );

  return {
    role: "ADMIN",
    name: userName,
    email: userEmail,
    totals,
    recentResidents: recentResidents.map((resident) => ({
      name: resident.name ?? resident.email,
      unit: resident.unitNumber ?? "—",
      email: resident.email,
      createdAt: fmtDate(resident.createdAt),
    })),
    recentPayments: payments.map((payment) => ({
      residentName: payment.resident?.name ?? payment.resident?.email ?? "Устсан хэрэглэгч",
      unit: payment.resident?.unitNumber ?? "—",
      month: payment.month ?? "—",
      amount: payment.amount ?? 0,
      status: payment.status ?? "UNKNOWN",
      createdAt: fmtAnyDate(payment.createdAt),
    })),
    recentRequests: requests.map((request) => ({
      residentName: request.resident?.name ?? request.resident?.email ?? "Устсан хэрэглэгч",
      unit: request.resident?.unitNumber ?? "—",
      title: request.title ?? "—",
      status: request.status ?? "UNKNOWN",
      createdAt: fmtAnyDate(request.createdAt),
    })),
  };
}

function renderResidentText(payload: ResidentContextPayload) {
  const totals = payload.totals;
  const paymentsLines = payload.payments
    .map(
      (item) =>
        `  - ${item.month}: ${fmtAmount(item.amount)} | ${STATUS_LABEL_MN[item.status] ?? item.status}${item.paidAt !== "—" ? ` | төлсөн: ${item.paidAt}` : ""}${item.description ? ` | ${item.description}` : ""}`,
    )
    .join("\n");
  const requestsLines = payload.requests
    .map(
      (item) =>
        `  - ${item.createdAt} | ${item.title} | ${STATUS_LABEL_MN[item.status] ?? item.status}`,
    )
    .join("\n");
  const announcementLines = payload.announcements
    .map((item) => `  - ${item.createdAt} | [${item.type}] ${item.title}`)
    .join("\n");
  const pollLines = payload.polls
    .map(
      (item) =>
        `  - ${item.question} (хүртэл: ${item.expiresAt}) — ${item.options
          .map((option) => `${option.text}: ${option.votes}`)
          .join(", ")}`,
    )
    .join("\n");

  return [
    `Эрх: RESIDENT`,
    `Нэр: ${payload.name}`,
    `Тоот: ${payload.unit}`,
    `Имэйл: ${payload.email}`,
    `Утас: ${payload.phone}`,
    `Бүртгэлийн огноо: ${payload.joinedAt}`,
    "",
    `Төлбөрийн нэгтгэл:`,
    `  Хүлээгдэж буй: ${totals.pendingCount} ширхэг, нийт ${fmtAmount(totals.pendingAmount)}`,
    `  Хоцорсон: ${totals.overdueCount} ширхэг, нийт ${fmtAmount(totals.overdueAmount)}`,
    `  Төлөгдсөн: ${totals.paidCount} ширхэг, нийт ${fmtAmount(totals.paidAmount)}`,
    "",
    `Сүүлийн төлбөрүүд:`,
    paymentsLines || "  (мэдээлэл алга)",
    "",
    `Засварын хүсэлтүүд:`,
    requestsLines || "  (мэдээлэл алга)",
    "",
    `Сүүлийн зарлал:`,
    announcementLines || "  (мэдээлэл алга)",
    "",
    `Идэвхтэй санал асуулга:`,
    pollLines || "  (мэдээлэл алга)",
  ].join("\n");
}

function renderSohText(payload: SohContextPayload) {
  const totals = payload.totals;
  const paymentLines = payload.payments
    .slice(0, 60)
    .map(
      (item) =>
        `  - ${item.createdAt} | ${item.unit}-р тоот | ${item.residentName} | ${item.month} | ${fmtAmount(item.amount)} | ${STATUS_LABEL_MN[item.status] ?? item.status}${item.description ? ` | ${item.description}` : ""}`,
    )
    .join("\n");
  const requestLines = payload.requests
    .slice(0, 30)
    .map(
      (item) =>
        `  - ${item.createdAt} | ${item.unit}-р тоот | ${item.residentName} | ${item.title} | ${STATUS_LABEL_MN[item.status] ?? item.status}`,
    )
    .join("\n");
  const residentLines = payload.residents
    .slice(0, 60)
    .map((item) => `  - ${item.unit}-р тоот | ${item.name} | ${item.email}${item.phone !== "—" ? ` | ${item.phone}` : ""}`)
    .join("\n");
  const pollLines = payload.polls
    .map(
      (item) =>
        `  - ${item.question} (хүртэл: ${item.expiresAt}) — ${item.options
          .map((option) => `${option.text}: ${option.votes}`)
          .join(", ")}`,
    )
    .join("\n");
  const announcementLines = payload.announcements
    .map((item) => `  - ${item.createdAt} | [${item.type}] ${item.title}`)
    .join("\n");

  return [
    `Эрх: SOH (СӨХ менежер)`,
    `Менежер: ${payload.name} (${payload.email})`,
    "",
    `Нэгтгэл:`,
    `  Оршин суугч: ${totals.residents}`,
    `  Энэ сар төлөгдсөн: ${totals.paymentsThisMonthCount} ширхэг, ${fmtAmount(totals.paymentsThisMonthAmount)}`,
    `  Хүлээгдэж буй төлбөр: ${totals.pendingPaymentsCount} ширхэг, ${fmtAmount(totals.pendingPaymentsAmount)}`,
    `  Хоцорсон төлбөр: ${totals.overduePaymentsCount} ширхэг, ${fmtAmount(totals.overduePaymentsAmount)}`,
    `  Хүсэлт: шинэ ${totals.openRequests}, явцад ${totals.inProgressRequests}, шийдэгдсэн ${totals.resolvedRequests}`,
    `  Санал асуулга: ${totals.polls}`,
    `  Зарлал: ${totals.announcements}`,
    "",
    `Сүүлийн төлбөрүүд:`,
    paymentLines || "  (мэдээлэл алга)",
    "",
    `Засварын хүсэлтүүд:`,
    requestLines || "  (мэдээлэл алга)",
    "",
    `Оршин суугчид:`,
    residentLines || "  (мэдээлэл алга)",
    "",
    `Идэвхтэй санал асуулга:`,
    pollLines || "  (мэдээлэл алга)",
    "",
    `Сүүлийн зарлал:`,
    announcementLines || "  (мэдээлэл алга)",
  ].join("\n");
}

function renderAdminText(payload: AdminContextPayload) {
  const totals = payload.totals;
  const residentLines = payload.recentResidents
    .map((item) => `  - ${item.createdAt} | ${item.unit}-р тоот | ${item.name} | ${item.email}`)
    .join("\n");
  const paymentLines = payload.recentPayments
    .map(
      (item) =>
        `  - ${item.createdAt} | ${item.unit}-р тоот | ${item.residentName} | ${item.month} | ${fmtAmount(item.amount)} | ${STATUS_LABEL_MN[item.status] ?? item.status}`,
    )
    .join("\n");
  const requestLines = payload.recentRequests
    .map(
      (item) =>
        `  - ${item.createdAt} | ${item.unit}-р тоот | ${item.residentName} | ${item.title} | ${STATUS_LABEL_MN[item.status] ?? item.status}`,
    )
    .join("\n");

  return [
    `Эрх: ADMIN`,
    `Админ: ${payload.name} (${payload.email})`,
    "",
    `Нэгтгэл:`,
    `  Оршин суугч: ${totals.residents}`,
    `  СӨХ менежер: ${totals.sohManagers}`,
    `  Админ: ${totals.admins}`,
    `  Бүртгэлийн хүсэлт (PENDING): ${totals.pendingRegistrationRequests}`,
    `  Төлбөр: нийт ${totals.paymentsTotalCount} ширхэг, ${fmtAmount(totals.paymentsTotalAmount)}`,
    `    Төлөгдсөн: ${fmtAmount(totals.paymentsPaidAmount)}`,
    `    Хүлээгдэж буй: ${fmtAmount(totals.paymentsPendingAmount)}`,
    `    Хоцорсон: ${fmtAmount(totals.paymentsOverdueAmount)}`,
    `  Хүсэлт: шинэ ${totals.requestsOpen}, явцад ${totals.requestsInProgress}, шийдэгдсэн ${totals.requestsResolved}`,
    `  Санал асуулга: ${totals.polls}`,
    `  Зарлал: ${totals.announcements}`,
    "",
    `Сүүлд бүртгэгдсэн оршин суугчид:`,
    residentLines || "  (мэдээлэл алга)",
    "",
    `Сүүлийн төлбөрүүд:`,
    paymentLines || "  (мэдээлэл алга)",
    "",
    `Сүүлийн засварын хүсэлтүүд:`,
    requestLines || "  (мэдээлэл алга)",
  ].join("\n");
}

function renderContext(payload: ContextPayload) {
  if (payload.role === "RESIDENT") return renderResidentText(payload);
  if (payload.role === "SOH") return renderSohText(payload);
  return renderAdminText(payload);
}

const SYSTEM_PROMPT = `Чи бол Smart Residence (Өндөр хотхон) систем дотор ажилладаг ерөнхий AI туслах. Чи ChatGPT шиг өдөр тутмын ерөнхий асуулт, тайлбар, зөвлөгөө, бичвэр боловсруулах, санаа гаргах, код/тооцоо/орчуулга зэрэгт тусалж чадна. Мөн хэрэглэгч системийн төлбөр, засварын хүсэлт, санал асуулга, оршин суугч, зарлалын тухай асуувал доорх системийн өгөгдлийн контекстийг ашиглана.

Дүрэм:
1. Үндсэндээ МОНГОЛ хэлээр товч, ойлгомжтой хариул. Хэрэглэгч өөр хэлээр хариулахыг хүсвэл тэр хэлээр нь хариулж болно.
2. Ерөнхий мэдлэг, зөвлөгөө, бичвэр, орчуулга, код, тооцоо, brainstorming зэрэг системийн дата шаарддаггүй асуултад энгийн AI туслах шиг шууд хариул.
3. Харин Smart Residence-ийн бодит төлбөр, оршин суугч, засварын хүсэлт, санал асуулга, зарлал, хэрэглэгчийн хувийн мэдээлэл зэрэг системийн дата асуувал зөвхөн доорх контекст дээр үндэслэ. Контекстод байхгүй бодит системийн мэдээллийг зохиож болохгүй.
4. Тоо мөнгөн дүнг "12,500₮" хэлбэрээр, огноог "YYYY-MM-DD" хэлбэрээр харуул.
5. RESIDENT хэрэглэгчийн хувьд зөвхөн өөрийнх нь өгөгдлийг үндэс болго. SOH/ADMIN хэрэглэгчийн хувьд бүх оршин суугчийн өгөгдлийг ашиглаж болно.
6. Шаардлагатай үед жагсаалт болон Markdown bullet point ашигла. Энгийн мэндчилгээ, "юу байна", жижиг асуултад богино, найрсаг хариул.
7. Хариулт төгсгөлд "Эх сурвалж: систем дэх таны өгөгдөл." гэж хавсаргахгүй — зөвхөн хариултаа өг.
8. Хэрэв хэрэглэгч системд байхгүй үйлдэл (жишээ нь: "төлбөр төл", "хүсэлт нээ") хийхийг хүсвэл, "Энэ үйлдлийг та өөрөө dashboard дээрээ хийнэ. AI зөвхөн мэдээлэл өгнө." гэж хариул.
9. Аюултай, хууль бус, хувийн мэдээлэл задруулах, бусдын нууц мэдээлэл авах хүсэлтэд татгалзаж, аюулгүй ерөнхий чиглэл өг.
`;

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const gate = requireRoles(session, ["ADMIN", "SOH", "RESIDENT"]);
    if (gate instanceof NextResponse) return gate;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ message: "GROQ_API_KEY тохируулаагүй байна" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as { question?: string; history?: unknown };
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const history = sanitizeHistory(body.history);

    if (!question) {
      return NextResponse.json({ message: "Асуулт хоосон байна" }, { status: 400 });
    }

    if (question.length > 500) {
      return NextResponse.json({ message: "Асуулт хэт урт байна (≤ 500 тэмдэгт)" }, { status: 400 });
    }

    const userName = gate.name?.trim() || gate.email || "Хэрэглэгч";

    let payload: ContextPayload;
    if (gate.role === "RESIDENT") {
      payload = await buildResidentContext(gate.id);
    } else if (gate.role === "SOH") {
      payload = await buildSohContext(userName, gate.email);
    } else {
      payload = await buildAdminContext(userName, gate.email);
    }

    const [contextText, groupChatText] = await Promise.all([
      Promise.resolve(renderContext(payload)),
      renderGroupChatContext(),
    ]);
    const aiHistoryText = renderAiHistory(history);

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.15,
      top_p: 0.9,
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content:
            "Нэмэлт заавар: Одоогийн асуултад хариулахдаа системийн өгөгдөл, групп чатийн контекст, өмнөх AI яриаг хамтад нь ойлго. Хэрэв асуулт ерөнхий мэдлэг эсвэл энгийн яриа бол контекстээр өөрийгөө бүү хязгаарла. Харин тоон дүн, төлөв, огноо, хэрэглэгч/оршин суугчийн бодит мэдээлэл дээр системийн өгөгдлийг хамгийн найдвартай эх сурвалж гэж үз. Групп чат нь ярианы нөхцөл, хүсэлт, тайлбар ойлгоход тусална. Өмнөх AI яриаг хэрэглэгчийн үргэлжилсэн асуултыг ойлгоход ашигла.",
        },
        {
          role: "user",
          content: `Хэрэглэгчийн нэр: ${userName} (${gate.role}).\n\nСистемийн өгөгдлийн контекст:\n${contextText}\n\nГрупп чатийн контекст:\n${groupChatText}\n\nӨмнөх AI яриа:\n${aiHistoryText}\n\nОдоогийн асуулт:\n${question}`,
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
