import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signupSchema } from "@/schemas/auth";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(
    `signup:ip:${getClientIp(request.headers)}`,
    5,
    60 * 60 * 1000
  );
  if (!limit.success) return tooManyRequests(limit);

  try {
    const body = await request.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid sign-up details" },
        { status: 400 }
      );
    }
    const { email, name, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error Signing Up:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
