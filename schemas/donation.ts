import { z } from "zod";

// Starting a donation. The amount is in GHS; the service checks it against the
// fundraiser's minimum and converts it to pesewas. A name is required unless
// the gift is anonymous; the email is always needed for the Paystack receipt.
export const initializeDonationSchema = z
  .object({
    fundraiserId: z.string().min(1),
    amount: z.number().positive(),
    isAnonymous: z.boolean(),
    email: z.string().trim().email().max(254),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
  })
  .refine((d) => d.isAnonymous || (d.firstName && d.lastName), {
    message: "First and last name are required for a non-anonymous donation",
    path: ["firstName"],
  });

export type InitializeDonationInput = z.infer<typeof initializeDonationSchema>;

// Confirming a donation after the popup closes. The reference is enough: the
// amount, fundraiser and donor all come from the server-set metadata Paystack
// returns, never from the client.
export const verifyDonationSchema = z.object({
  reference: z.string().trim().min(1).max(100),
});

export type VerifyDonationInput = z.infer<typeof verifyDonationSchema>;
