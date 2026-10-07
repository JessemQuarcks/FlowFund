import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(100),
  email: z.string().trim().email("Enter a valid email address").max(254),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Write a message").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
