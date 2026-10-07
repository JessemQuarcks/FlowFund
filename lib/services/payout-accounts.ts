import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import {
  createTransferRecipient,
  resolveAccount,
  type RecipientType,
} from "@/lib/paystack";
import { Account_Type } from "@/lib/generated/prisma";
import type { AddPayoutAccountInput } from "@/schemas/withdrawal";

// What callers may see of a payout account. The recipient code is a payment
// secret and stays on the server.
export type PublicPayoutAccount = {
  id: string;
  accountType: Account_Type;
  bankName: string | null;
  accountNumber: string;
  accountName: string;
  currency: string;
};

function toPublic(account: {
  id: string;
  accountType: Account_Type;
  bankName: string | null;
  accountNumber: string;
  accountName: string;
  currency: string;
}): PublicPayoutAccount {
  return {
    id: account.id,
    accountType: account.accountType,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    currency: account.currency,
  };
}

function recipientType(accountType: Account_Type): RecipientType {
  return accountType === "BANK_ACCOUNT" ? "ghipss" : "mobile_money";
}

// Resolves the account with Paystack, registers it as a transfer recipient and
// stores it once. Re-adding the same account returns the existing record.
export async function addPayoutAccount(
  userId: string,
  input: AddPayoutAccountInput,
): Promise<PublicPayoutAccount> {
  const currency = "GHS";
  const resolved = await resolveAccount(input.accountNumber, input.bankCode);

  const recipient = await createTransferRecipient({
    type: recipientType(input.accountType),
    name: resolved.account_name,
    account_number: input.accountNumber,
    bank_code: input.bankCode,
    currency,
  });

  const account = await prisma.payoutAccount.upsert({
    where: {
      userId_recipientCode: {
        userId,
        recipientCode: recipient.recipient_code,
      },
    },
    update: {
      accountType: input.accountType,
      bankCode: input.bankCode,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      accountName: resolved.account_name,
    },
    create: {
      userId,
      accountType: input.accountType,
      bankCode: input.bankCode,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      accountName: resolved.account_name,
      recipientCode: recipient.recipient_code,
      currency,
    },
  });

  return toPublic(account);
}

export async function listPayoutAccounts(
  userId: string,
): Promise<PublicPayoutAccount[]> {
  const accounts = await prisma.payoutAccount.findMany({
    where: { userId },
    orderBy: { dateAdded: "desc" },
  });
  return accounts.map(toPublic);
}

export async function deletePayoutAccount(userId: string, id: string) {
  const account = await prisma.payoutAccount.findUnique({ where: { id } });
  if (!account) throw errors.notFound("Payout account not found");
  if (account.userId !== userId) throw errors.forbidden();
  await prisma.payoutAccount.delete({ where: { id } });
}

// Loads a payout account the user owns, for the withdrawal service.
export async function getOwnedPayoutAccount(userId: string, id: string) {
  const account = await prisma.payoutAccount.findUnique({ where: { id } });
  if (!account) throw errors.notFound("Payout account not found");
  if (account.userId !== userId) throw errors.forbidden();
  return account;
}
