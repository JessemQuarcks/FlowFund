import "next-auth";
import "next-auth/jwt";
import { User } from "@/lib/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: Pick<User, "id" | "email" | "name" | "image">;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
