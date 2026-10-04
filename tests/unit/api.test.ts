import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { errorResponse, readJson, withErrorHandling } from "@/lib/api";
import { errors } from "@/lib/errors";

describe("errorResponse", () => {
  it("maps an AppError to its status, code and headers", async () => {
    const response = errorResponse(errors.rateLimited(42));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(await response.json()).toEqual({
      message: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
    });
  });

  it("maps a ZodError to 400 with every invalid field", async () => {
    const schema = z.object({
      email: z.string().email("Enter a valid email"),
      age: z.number({ invalid_type_error: "Age must be a number" }),
    });
    const result = schema.safeParse({ email: "nope", age: "x" });
    const response = errorResponse(result.error);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Enter a valid email",
      code: "VALIDATION_FAILED",
      issues: [
        { path: "email", message: "Enter a valid email" },
        { path: "age", message: "Age must be a number" },
      ],
    });
  });

  it("hides unexpected errors behind a 500", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = errorResponse(new Error("database password is hunter2"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      message: "Internal server error",
      code: "INTERNAL",
    });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("withErrorHandling", () => {
  it("passes successful responses through", async () => {
    const handler = withErrorHandling(async () => Response.json({ ok: true }));
    const response = await handler();
    expect(await response.json()).toEqual({ ok: true });
  });

  it("turns thrown errors into JSON responses", async () => {
    const handler = withErrorHandling(async () => {
      throw errors.notFound("Event not found");
    });
    const response = await handler();
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("readJson", () => {
  it("rejects a body that is not JSON with a 400", async () => {
    const request = new Request("http://test", {
      method: "POST",
      body: "not json",
    });
    await expect(readJson(request)).rejects.toMatchObject({
      status: 400,
      code: "BAD_REQUEST",
    });
  });
});
