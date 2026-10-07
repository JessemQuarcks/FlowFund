import { z } from "zod";

// Shared password rules, used by sign-up and by the password-change form.
export const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  // bcrypt ignores everything after 72 bytes
  .max(72, "Password must be at most 72 characters long")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: passwordPolicy,
});

export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordPolicy,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
