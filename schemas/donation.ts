import { z } from "zod";

export const verifyDonationSchema = z.object({
  reference: z.string().trim().min(1).max(100),
  fundraiserId: z.string().min(1),
  donorInfo: z
    .object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      email: z.string().trim().email().max(254),
    })
    .nullable(),
});

export type VerifyDonationInput = z.infer<typeof verifyDonationSchema>;
