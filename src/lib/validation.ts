import { z } from "zod";

// Email validation
const emailSchema = z
  .string()
  .min(1, "Имэйл хаяг оруулна уу")
  .email("Имэйл хаяг буруу форматтай байна")
  .max(254, "Имэйл хаяг хэт урт байна");

// Password validation
const passwordSchema = z
  .string()
  .min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой")
  .max(128, "Нууц үг хэт урт байна")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Нууц үг дор хаяж 1 том үсэг, 1 жижиг үсэг, 1 тоо агуулах ёстой"
  );

// Name validation
const nameSchema = z
  .string()
  .min(1, "Нэр оруулна уу")
  .max(100, "Нэр хэт урт байна")
  .regex(/^[a-zA-Z\u00C0-\u024F\u0400-\u04FF\u1800-\u18AF\s'-]+$/, "Нэр буруу форматтай байна");

// Phone validation
const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-]{8,20}$/, "Утасны дугаар буруу форматтай байна");

// ID validation (UUID or cuid)
const idSchema = z.string().min(1, "ID оруулна уу").max(100);

// Login validation - энгэл шалгалт (нэвтрэх үед бүртгэлийн шаардлага биш)
export const loginSchema = z.object({
  email: z.string().min(1, "Имэйл оруулна уу").email("Имэйл хаяг буруу форматтай байна"),
  password: z.string().min(1, "Нууц үг оруулна уу"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Register validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phoneNumber: phoneSchema.optional(),
  unitNumber: z.string().min(1).max(20).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset password validation
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token оруулна уу"),
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Verify code validation
export const verifyCodeSchema = z.object({
  email: emailSchema,
  code: z.string().min(4).max(10),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1).max(200),
});

export type SearchInput = z.infer<typeof searchSchema>;

// Resident create/update validation
export const residentSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  phoneNumber: phoneSchema.optional(),
  unitNumber: z.string().min(1).max(20),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).default("ACTIVE"),
});

export type ResidentInput = z.infer<typeof residentSchema>;

// Announcement validation
export const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  type: z.enum(["GENERAL", "MAINTENANCE", "EMERGENCY"]),
  target: z.enum(["ALL", "RESIDENTS", "SOH"]),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

// Bill validation
export const billSchema = z.object({
  residentId: idSchema,
  type: z.enum(["WATER", "ELECTRICITY", "MAINTENANCE", "OTHER"]),
  amount: z.number().positive().max(10000000),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(500).optional(),
});

export type BillInput = z.infer<typeof billSchema>;

// Chat message validation
export const chatMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  groupId: idSchema.optional(),
  receiverId: idSchema.optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// Validate and format errors
export function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => err.message);
}

// Safe parse helper
export function safeParse<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: formatZodErrors(result.error) };
}
