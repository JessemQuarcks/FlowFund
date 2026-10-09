import { z } from "zod";

export const createReportSchema = z.object({
  reason: z.string().trim().min(3, "Tell us why").max(120),
  details: z.string().trim().max(2000).optional(),
  reporterEmail: z
    .string()
    .trim()
    .email()
    .max(254)
    .optional()
    .or(z.literal("")),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const resolveReportSchema = z.object({
  action: z.enum(["dismiss", "suspend"]),
});
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

export const setEventStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});
export type SetEventStatusInput = z.infer<typeof setEventStatusSchema>;

export const setUserBannedSchema = z.object({ banned: z.boolean() });
export type SetUserBannedInput = z.infer<typeof setUserBannedSchema>;
