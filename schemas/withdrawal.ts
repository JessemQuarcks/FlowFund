import { z } from "zod";
import { Account_Type } from "@/lib/generated/prisma";

// Registering a payout destination. The account number is resolved with
// Paystack, so the holder's name comes from there, not from this form.
export const addPayoutAccountSchema = z.object({
  accountType: z.nativeEnum(Account_Type),
  bankCode: z.string().trim().min(1).max(20),
  bankName: z.string().trim().max(100).optional(),
  accountNumber: z.string().trim().min(5).max(30),
});

export type AddPayoutAccountInput = z.infer<typeof addPayoutAccountSchema>;

// Requesting a payout. The amount is in GHS; the service converts it to pesewas
// and checks it against the fundraiser's available balance under a row lock.
export const requestWithdrawalSchema = z.object({
  fundraiserId: z.string().min(1),
  payoutAccountId: z.string().min(1),
  amount: z.number().positive(),
  notes: z.string().trim().max(500).optional(),
});

export type RequestWithdrawalInput = z.infer<typeof requestWithdrawalSchema>;
