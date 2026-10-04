import bcrypt from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { signUp } from "@/lib/services/users";
import { resetDatabase } from "./helpers";

const details = {
  name: "Ama Owusu",
  email: "ama@example.com",
  password: "secret1!",
};

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("signUp", () => {
  it("creates the user and returns only public fields", async () => {
    const user = await signUp(details);

    expect(user).toEqual({
      id: expect.any(String),
      email: details.email,
      name: details.name,
    });
  });

  it("stores a bcrypt hash, not the password", async () => {
    await signUp(details);

    const { password } = await prisma.user.findUniqueOrThrow({
      where: { email: details.email },
      omit: { password: false },
    });
    expect(password).not.toBe(details.password);
    expect(await bcrypt.compare(details.password, password!)).toBe(true);
  });

  it("omits the password hash from ordinary queries", async () => {
    await signUp(details);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: details.email },
    });
    expect(user).not.toHaveProperty("password");
  });

  it("refuses an email that is already registered", async () => {
    await signUp(details);
    await expect(signUp(details)).rejects.toMatchObject({ status: 409 });
  });

  it("creates one account when the same email signs up concurrently", async () => {
    const results = await Promise.allSettled([
      signUp(details),
      signUp(details),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected");
    expect(rejected).toMatchObject({ reason: { status: 409 } });
    expect(await prisma.user.count()).toBe(1);
  });
});
