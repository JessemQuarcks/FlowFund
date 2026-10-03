// prisma/prisma.ts
import { PrismaClient } from "./generated/prisma";

// Password hashes are never returned unless a query opts in with
// `omit: { password: false }` (only the credentials sign-in does).
const createPrismaClient = () =>
  new PrismaClient({
    omit: {
      user: { password: true },
    },
  });

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
