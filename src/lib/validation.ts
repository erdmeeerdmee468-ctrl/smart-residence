import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Имэйл оруулна уу").email("Имэйл хаяг буруу байна"),
  password: z.string().min(1, "Нууц үг оруулна уу"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => err.message);
}

export function safeParse<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: formatZodErrors(result.error) };
}
