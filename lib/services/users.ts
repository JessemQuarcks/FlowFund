import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { errors } from "@/lib/errors";
import type { SignupInput } from "@/schemas/auth";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from "@/schemas/profile";
import { deleteImage, uploadAvatar } from "@/lib/services/images";

export type PublicProfile = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

const PUBLIC_PROFILE = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const;

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

export async function getProfile(userId: string): Promise<PublicProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_PROFILE,
  });
  if (!user) throw errors.notFound("User not found");
  return user;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicProfile> {
  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name },
    select: PUBLIC_PROFILE,
  });
}

// Replaces the user's avatar, deleting the previous one afterwards.
export async function updateAvatar(
  userId: string,
  file: File,
): Promise<PublicProfile> {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  const url = await uploadAvatar(file);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { image: url },
    select: PUBLIC_PROFILE,
  });
  // Only clean up Cloudinary-hosted avatars; leave OAuth provider images.
  if (current?.image && current.image.includes("res.cloudinary.com")) {
    await deleteImage(current.image);
  }
  return updated;
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: false },
  });
  if (!user) throw errors.notFound("User not found");

  // An account that already has a password must prove the current one.
  if (user.password) {
    if (!input.currentPassword) {
      throw errors.badRequest("Enter your current password");
    }
    const matches = await bcrypt.compare(input.currentPassword, user.password);
    if (!matches) throw errors.badRequest("Current password is incorrect");
  }

  const hashed = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}
