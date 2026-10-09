import { z } from "zod";

export const ID_TYPES = [
  "Ghana Card",
  "Passport",
  "Driver's License",
  "Voter ID",
] as const;

export const submitVerificationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full legal name").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  idType: z.enum(ID_TYPES),
  idNumber: z.string().trim().min(4, "Enter your ID number").max(40),
});
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;

export const reviewVerificationSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  notes: z.string().trim().max(1000).optional(),
});
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;
