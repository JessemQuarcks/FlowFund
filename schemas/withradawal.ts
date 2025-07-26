import { Account_Type } from "@/lib/generated/prisma";
import { z } from "zod";

export const withdrawRequestSchema = z.object({
  eventId: z.string(),
  amount: z.number().min(0),
  accountType: z.nativeEnum(Account_Type),
  accountNumber: z.string(),
  bankCode: z.string(),
  accountHolderName: z.string(),
  notes: z.string().optional(),
});
