import { randomUUID } from "node:crypto";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "@/lib/cloudinary";
import { errors } from "@/lib/errors";

const EVENT_IMAGE_FOLDER = "event-images";
const AVATAR_FOLDER = "avatars";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export function validateImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw errors.badRequest(
      "Cover image must be a JPEG, PNG, WebP, GIF or AVIF",
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw errors.badRequest("Cover image must be 5MB or smaller");
  }
}

// Uploads a validated image to a Cloudinary folder and returns its HTTPS URL.
async function uploadImage(file: File, folder: string): Promise<string> {
  validateImage(file);
  const buffer = Buffer.from(await file.arrayBuffer());

  let result: UploadApiResponse | undefined;
  try {
    result = await new Promise<UploadApiResponse | undefined>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: "image",
              public_id: randomUUID(),
            },
            (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
          )
          .end(buffer);
      },
    );
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
  }
  if (!result?.secure_url) {
    throw errors.upstreamFailed("Failed to upload image");
  }
  return result.secure_url;
}

// Uploads an event cover image and returns its HTTPS URL.
export function uploadEventImage(file: File): Promise<string> {
  return uploadImage(file, EVENT_IMAGE_FOLDER);
}

// Uploads a user avatar and returns its HTTPS URL.
export function uploadAvatar(file: File): Promise<string> {
  return uploadImage(file, AVATAR_FOLDER);
}

// Cloudinary delivery URLs look like
// https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public id>.<ext>
export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  return match ? match[1] : null;
}

// Best effort: a leftover image costs storage, not correctness, so a
// failure is logged rather than thrown.
export async function deleteImage(url: string): Promise<void> {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete image ${publicId}:`, error);
  }
}
