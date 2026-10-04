import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  publicIdFromUrl,
  validateImage,
} from "@/lib/services/images";

describe("publicIdFromUrl", () => {
  it("strips the version and extension", () => {
    expect(
      publicIdFromUrl(
        "https://res.cloudinary.com/demo/image/upload/v1712345678/event-images/abc-123.jpg",
      ),
    ).toBe("event-images/abc-123");
  });

  it("handles URLs without a version", () => {
    expect(
      publicIdFromUrl(
        "http://res.cloudinary.com/demo/image/upload/event-images/abc.png",
      ),
    ).toBe("event-images/abc");
  });

  it("keeps nested folders (images uploaded by the old edit path)", () => {
    expect(
      publicIdFromUrl(
        "https://res.cloudinary.com/demo/image/upload/v1/event-images/event-images/xyz.webp",
      ),
    ).toBe("event-images/event-images/xyz");
  });

  it("returns null for URLs that are not Cloudinary uploads", () => {
    expect(publicIdFromUrl("https://example.com/picture.jpg")).toBeNull();
  });
});

describe("validateImage", () => {
  const file = (type: string, bytes: number) =>
    new File([new Uint8Array(bytes)], "cover", { type });

  it("accepts a common image type within the size limit", () => {
    expect(() => validateImage(file("image/jpeg", 1024))).not.toThrow();
    expect(() =>
      validateImage(file("image/webp", MAX_IMAGE_BYTES)),
    ).not.toThrow();
  });

  it("rejects other file types", () => {
    expect(() => validateImage(file("image/svg+xml", 10))).toThrow(
      expect.objectContaining({ status: 400 }),
    );
    expect(() => validateImage(file("application/pdf", 10))).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  it("rejects files over 5MB", () => {
    expect(() => validateImage(file("image/png", MAX_IMAGE_BYTES + 1))).toThrow(
      /5MB or smaller/,
    );
  });
});
