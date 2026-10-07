import { z } from "zod";
import { passwordPolicy } from "@/schemas/auth";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// currentPassword is required only when the account already has one (a
// credentials account); an OAuth-only account can set a first password.
export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: passwordPolicy,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
