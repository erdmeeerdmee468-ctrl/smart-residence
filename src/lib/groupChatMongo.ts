import { randomBytes } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

/** Prisma Mongo default collection name for model `GroupChatMessage` */
const COLLECTION = "GroupChatMessage";

type JsonDoc = Record<string, unknown>;

export type GroupChatMessageDTO = {
  id: string;
  userId: string | null;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
};

function parseOid(value: unknown): string | null {
  if (value && typeof value === "object" && "$oid" in (value as object)) {
    return String((value as { $oid: string }).$oid);
  }
  if (typeof value === "string" && /^[a-f0-9]{24}$/i.test(value)) return value;
  return null;
}

function parseDate(value: unknown): string {
  if (value && typeof value === "object" && "$date" in (value as object)) {
    const raw = (value as { $date: string | number }).$date;
    if (typeof raw === "number") return new Date(raw).toISOString();
    return new Date(String(raw)).toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
}

function newObjectIdHex(): string {
  return randomBytes(12).toString("hex");
}

function isObjectIdHex(value: string): boolean {
  return /^[a-f0-9]{24}$/i.test(value);
}

export async function listGroupChatMessages(prisma: PrismaClient): Promise<GroupChatMessageDTO[]> {
  const result = (await prisma.$runCommandRaw({
    find: COLLECTION,
    filter: {},
    sort: { createdAt: -1 },
    limit: 80,
  })) as JsonDoc;

  const batch = (result.cursor as { firstBatch?: JsonDoc[] } | undefined)?.firstBatch ?? [];

  return batch
    .map((doc) => ({
      id: parseOid(doc._id) ?? "",
      userId: doc.userId ? parseOid(doc.userId) : null,
      userName: String(doc.userName ?? ""),
      userRole: String(doc.userRole ?? ""),
      content: String(doc.content ?? ""),
      createdAt: parseDate(doc.createdAt),
    }))
    .reverse();
}

export async function insertGroupChatMessage(
  prisma: PrismaClient,
  params: { userId: string; userName: string; userRole: string; content: string },
): Promise<GroupChatMessageDTO> {
  const id = newObjectIdHex();
  const createdAt = new Date().toISOString();

  const doc: JsonDoc = {
    _id: { $oid: id },
    userName: params.userName,
    userRole: params.userRole,
    content: params.content,
    createdAt: { $date: createdAt },
  };

  if (isObjectIdHex(params.userId)) {
    doc.userId = { $oid: params.userId };
  }

  await prisma.$runCommandRaw({
    insert: COLLECTION,
    documents: [doc as Prisma.InputJsonObject],
  });

  return {
    id,
    userId: isObjectIdHex(params.userId) ? params.userId : null,
    userName: params.userName,
    userRole: params.userRole,
    content: params.content,
    createdAt,
  };
}
