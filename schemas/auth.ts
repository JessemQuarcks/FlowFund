import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    // bcrypt ignores everything after 72 bytes
    .max(72, "Password must be at most 72 characters long")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
});

export type SignupInput = z.infer<typeof signupSchema>;
