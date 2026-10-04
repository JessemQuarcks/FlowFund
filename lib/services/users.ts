import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { errors } from "@/lib/errors";
import type { SignupInput } from "@/schemas/auth";

export async function signUp({ name, email, password }: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw errors.conflict("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 12);
  try {
    return await prisma.user.create({
      data: { email, name, password: hashedPassword },
      select: { id: true, email: true, name: true },
    });
  } catch (error) {
    // Lost a race with a concurrent signup for the same email.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw errors.conflict("Email already exists");
    }
    throw error;
  }
}
