import bcrypt from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  changePassword,
  updateAvatar,
  updateProfile,
} from "@/lib/services/users";
import { uploadAvatar, deleteImage } from "@/lib/services/images";
import { createUser, resetDatabase } from "./helpers";

vi.mock("@/lib/services/images", () => ({
  uploadAvatar: vi.fn(),
  deleteImage: vi.fn(),
}));
const upload = vi.mocked(uploadAvatar);
const destroy = vi.mocked(deleteImage);

async function userWithPassword(password = "secret1!") {
  const user = await createUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 12) },
  });
  return user;
}

beforeEach(async () => {
  upload.mockReset();
  destroy.mockReset();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("updateProfile", () => {
  it("updates the name and returns only public fields", async () => {
    const user = await createUser();
    const profile = await updateProfile(user.id, { name: "Ama Owusu" });
    expect(profile.name).toBe("Ama Owusu");
    expect(Object.keys(profile)).not.toContain("password");
  });
});

describe("updateAvatar", () => {
  it("stores the uploaded url and removes the old Cloudinary image", async () => {
    const user = await createUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { image: "https://res.cloudinary.com/x/image/upload/v1/old.png" },
    });
    upload.mockResolvedValue(
      "https://res.cloudinary.com/x/image/upload/v2/new.png",
    );

    const profile = await updateAvatar(user.id, new File(["x"], "a.png"));

    expect(profile.image).toContain("new.png");
    expect(destroy).toHaveBeenCalledWith(
      "https://res.cloudinary.com/x/image/upload/v1/old.png",
    );
  });

  it("does not delete a non-Cloudinary (OAuth) avatar", async () => {
    const user = await createUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { image: "https://lh3.googleusercontent.com/a/photo" },
    });
    upload.mockResolvedValue(
      "https://res.cloudinary.com/x/image/upload/v2/new.png",
    );

    await updateAvatar(user.id, new File(["x"], "a.png"));
    expect(destroy).not.toHaveBeenCalled();
  });
});

describe("changePassword", () => {
  it("requires and checks the current password when one is set", async () => {
    const user = await userWithPassword("secret1!");

    await expect(
      changePassword(user.id, { newPassword: "brandnew1!" }),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      changePassword(user.id, {
        currentPassword: "wrong",
        newPassword: "brandnew1!",
      }),
    ).rejects.toMatchObject({ status: 400 });

    await changePassword(user.id, {
      currentPassword: "secret1!",
      newPassword: "brandnew1!",
    });

    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      omit: { password: false },
    });
    expect(await bcrypt.compare("brandnew1!", saved.password!)).toBe(true);
  });

  it("lets an account with no password set one", async () => {
    const user = await createUser(); // no password (OAuth-style)

    await changePassword(user.id, { newPassword: "firstpass1!" });

    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      omit: { password: false },
    });
    expect(saved.password).toBeTruthy();
  });
});
