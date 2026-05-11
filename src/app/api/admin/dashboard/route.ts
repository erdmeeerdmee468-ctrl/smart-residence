import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRoles } from "@/lib/session";

type RawDoc = Record<string, unknown>;

function objectIdToString(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$oid" in value) return String((value as { $oid?: string }).$oid ?? "");
  return "";
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function boolValue(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function dateToJson(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$date" in value) {
    const raw = (value as { $date?: string | number }).$date;
    return raw ? new Date(raw).toISOString() : new Date().toISOString();
  }
  return new Date().toISOString();
}

function firstBatch(value: unknown) {
  return (value as { cursor?: { firstBatch?: RawDoc[] } }).cursor?.firstBatch ?? [];
}

function countValue(value: unknown) {
  return numberValue((value as { n?: number }).n);
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("mn-MN")} ₮`;
}

async function safeCommand<T>(promise: Promise<T>, label: string, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`Admin dashboard ${label} failed:`, error);
    return fallback;
  }
}

export async function GET() {
  const session = await getSessionUser();
  const gate = requireRoles(session, ["ADMIN"]);
  if (gate instanceof NextResponse) return gate;

  try {
    const [
      residentCountResult,
      usersResult,
      openRequestsResult,
      userCountResult,
      sohCountResult,
      adminCountResult,
      pendingRegistrationResult,
      incompleteProfilesResult,
      inactiveUsersResult,
      announcementsCountResult,
      pollsCountResult,
      paymentSummaryResult,
      requestSummaryResult,
      activityUsersResult,
      activityRegistrationResult,
      activityAnnouncementResult,
      activityRequestResult,
    ] = await Promise.all([
      prisma.$runCommandRaw({ count: "User", query: { role: "RESIDENT" } }),
      prisma.$runCommandRaw({
        aggregate: "User",
        pipeline: [
          { $sort: { createdAt: -1 } },
          { $limit: 80 },
          { $lookup: { from: "Payment", localField: "_id", foreignField: "residentId", as: "payments" } },
          { $lookup: { from: "Request", localField: "_id", foreignField: "residentId", as: "requests" } },
          {
            $addFields: {
              paymentCount: { $size: "$payments" },
              requestCount: { $size: "$requests" },
              pendingPaymentAmount: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$payments",
                        as: "payment",
                        cond: { $ne: ["$$payment.status", "PAID"] },
                      },
                    },
                    as: "payment",
                    in: "$$payment.amount",
                  },
                },
              },
              latestPayment: { $first: "$payments" },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              role: 1,
              unitNumber: 1,
              phoneNumber: 1,
              avatarUrl: 1,
              isActive: 1,
              createdAt: 1,
              paymentCount: 1,
              requestCount: 1,
              pendingPaymentAmount: 1,
              latestPayment: 1,
            },
          },
        ],
        cursor: {},
      }),
      prisma.$runCommandRaw({ count: "Request", query: { status: "OPEN" } }),
      prisma.$runCommandRaw({ count: "User", query: {} }),
      prisma.$runCommandRaw({ count: "User", query: { role: "SOH" } }),
      prisma.$runCommandRaw({ count: "User", query: { role: "ADMIN" } }),
      prisma.$runCommandRaw({ count: "RegistrationRequest", query: { status: "PENDING" } }),
      prisma.$runCommandRaw({
        count: "User",
        query: {
          role: "RESIDENT",
          $or: [
            { unitNumber: null },
            { unitNumber: "" },
            { phoneNumber: null },
            { phoneNumber: "" },
          ],
        },
      }),
      prisma.$runCommandRaw({ count: "User", query: { isActive: false } }),
      prisma.$runCommandRaw({ count: "Announcement", query: {} }),
      prisma.$runCommandRaw({ count: "Poll", query: {} }),
      prisma.$runCommandRaw({
        aggregate: "Payment",
        pipeline: [
          {
            $group: {
              _id: null,
              totalIncome: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$amount", 0] } },
              pendingAmount: { $sum: { $cond: [{ $ne: ["$status", "PAID"] }, "$amount", 0] } },
              pendingPayments: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
              overduePayments: { $sum: { $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0] } },
              paidPayments: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
              totalPayments: { $sum: 1 },
            },
          },
        ],
        cursor: {},
      }),
      prisma.$runCommandRaw({
        aggregate: "Request",
        pipeline: [
          {
            $group: {
              _id: null,
              openRequests: { $sum: { $cond: [{ $eq: ["$status", "OPEN"] }, 1, 0] } },
              inProgressRequests: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
              resolvedRequests: { $sum: { $cond: [{ $eq: ["$status", "RESOLVED"] }, 1, 0] } },
              totalRequests: { $sum: 1 },
            },
          },
        ],
        cursor: {},
      }),
      prisma.$runCommandRaw({ find: "User", filter: {}, sort: { createdAt: -1 }, limit: 5, projection: { name: 1, email: 1, role: 1, createdAt: 1 } }),
      prisma.$runCommandRaw({ find: "RegistrationRequest", filter: {}, sort: { createdAt: -1 }, limit: 5, projection: { name: 1, email: 1, status: 1, createdAt: 1 } }),
      prisma.$runCommandRaw({ find: "Announcement", filter: {}, sort: { createdAt: -1 }, limit: 5, projection: { title: 1, type: 1, createdAt: 1 } }),
      prisma.$runCommandRaw({ find: "Request", filter: {}, sort: { createdAt: -1 }, limit: 5, projection: { title: 1, status: 1, createdAt: 1 } }),
    ]);

    const users = firstBatch(usersResult).map((user) => {
      const latestPayment = user.latestPayment as RawDoc | undefined;
      return {
        id: objectIdToString(user._id),
        name: typeof user.name === "string" ? user.name : null,
        email: String(user.email ?? ""),
        role: String(user.role ?? "RESIDENT"),
        unitNumber: typeof user.unitNumber === "string" ? user.unitNumber : null,
        phoneNumber: typeof user.phoneNumber === "string" ? user.phoneNumber : null,
        avatarUrl: typeof user.avatarUrl === "string" ? user.avatarUrl : null,
        isActive: boolValue(user.isActive),
        createdAt: dateToJson(user.createdAt),
        paymentCount: numberValue(user.paymentCount),
        requestCount: numberValue(user.requestCount),
        pendingPaymentAmount: numberValue(user.pendingPaymentAmount),
        latestPayment: latestPayment
          ? {
              month: String(latestPayment.month ?? ""),
              amount: numberValue(latestPayment.amount),
              status: String(latestPayment.status ?? ""),
            }
          : null,
      };
    });

    const paymentSummary = firstBatch(paymentSummaryResult)[0] ?? {};
    const requestSummary = firstBatch(requestSummaryResult)[0] ?? {};
    const recentActivity = [
      ...firstBatch(activityUsersResult).map((item) => ({
        id: `user-${objectIdToString(item._id)}`,
        type: "user",
        title: String(item.name ?? item.email ?? "Шинэ хэрэглэгч"),
        description: `${String(item.role ?? "USER")} эрхтэй хэрэглэгч бүртгэгдсэн`,
        createdAt: dateToJson(item.createdAt),
        tone: "blue",
      })),
      ...firstBatch(activityRegistrationResult).map((item) => ({
        id: `registration-${objectIdToString(item._id)}`,
        type: "registration",
        title: String(item.name ?? item.email ?? "Бүртгэлийн хүсэлт"),
        description: `${String(item.status ?? "PENDING")} төлөвтэй бүртгэлийн хүсэлт`,
        createdAt: dateToJson(item.createdAt),
        tone: "amber",
      })),
      ...firstBatch(activityAnnouncementResult).map((item) => ({
        id: `announcement-${objectIdToString(item._id)}`,
        type: "announcement",
        title: String(item.title ?? "Зарлал"),
        description: `${String(item.type ?? "INFO")} төрлийн зарлал нийтлэгдсэн`,
        createdAt: dateToJson(item.createdAt),
        tone: "violet",
      })),
      ...firstBatch(activityRequestResult).map((item) => ({
        id: `request-${objectIdToString(item._id)}`,
        type: "request",
        title: String(item.title ?? "Засварын хүсэлт"),
        description: `${String(item.status ?? "OPEN")} төлөвтэй хүсэлт бүртгэгдсэн`,
        createdAt: dateToJson(item.createdAt),
        tone: "emerald",
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    return NextResponse.json({
      stats: {
        residentCount: countValue(residentCountResult),
        userCount: countValue(userCountResult),
        sohCount: countValue(sohCountResult),
        adminCount: countValue(adminCountResult),
        totalIncome: formatMoney(numberValue(paymentSummary.totalIncome)),
        pendingPaymentAmount: formatMoney(numberValue(paymentSummary.pendingAmount)),
        pendingPayments: numberValue(paymentSummary.pendingPayments),
        overduePayments: numberValue(paymentSummary.overduePayments),
        paidPayments: numberValue(paymentSummary.paidPayments),
        totalPayments: numberValue(paymentSummary.totalPayments),
        pendingRequests: countValue(openRequestsResult),
        openRequests: numberValue(requestSummary.openRequests),
        inProgressRequests: numberValue(requestSummary.inProgressRequests),
        resolvedRequests: numberValue(requestSummary.resolvedRequests),
        totalRequests: numberValue(requestSummary.totalRequests),
        pendingRegistrationRequests: countValue(pendingRegistrationResult),
        incompleteProfiles: countValue(incompleteProfilesResult),
        inactiveUsers: countValue(inactiveUsersResult),
        announcementsCount: countValue(announcementsCountResult),
        pollsCount: countValue(pollsCountResult),
        emptyApartments: 0,
      },
      latestResidents: users,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
