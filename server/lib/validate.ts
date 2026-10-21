import { z, type ZodTypeAny } from "zod";
import type { Ctx } from "../context.ts";
import { badRequest } from "./errors.ts";

export async function body<S extends ZodTypeAny>(c: Ctx, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
  return parse(schema, raw);
}

export function query<S extends ZodTypeAny>(c: Ctx, schema: S): z.infer<S> {
  return parse(schema, c.req.query());
}

export function parse<S extends ZodTypeAny>(schema: S, raw: unknown): z.infer<S> {
  const r = schema.safeParse(raw);
  if (!r.success) {
    const fields: Record<string, string> = {};
    for (const issue of r.error.issues) fields[issue.path.join(".") || "_"] ??= issue.message;
    throw badRequest(Object.values(fields)[0] ?? "Invalid input.", { fields });
  }
  return r.data;
}

export const id = z.coerce.number().int().positive();
export const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
export const pincode = z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code.");
export const phone = z
  .string()
  .trim()
  .regex(/^(\+91[\s-]?)?[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number.");

const COMMON = new Set(["password", "password1", "password123", "1234567890", "qwertyuiop", "crowncart", "iloveyou", "letmein123"]);
export const newPassword = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "Use at most 200 characters.")
  .refine((p) => !COMMON.has(p.toLowerCase()), "That password is too common.")
  .refine((p) => new Set(p).size >= 5, "Use a less repetitive password.");

export const pageParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function paginate(page: number, pageSize: number) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

export const ip = (c: Ctx) => c.get("ip");
