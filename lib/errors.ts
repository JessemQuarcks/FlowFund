// One error type for the service layer. Services throw AppError for
// anything the caller should see; route handlers turn it into a JSON
// response with lib/api.ts. Anything else is a bug and becomes a 500.

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_FAILED"
  | "UPSTREAM_FAILED"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  badRequest: (message = "Invalid request") =>
    new AppError("BAD_REQUEST", message, 400),
  unauthorized: (message = "Unauthorized") =>
    new AppError("UNAUTHORIZED", message, 401),
  forbidden: (message = "Forbidden") => new AppError("FORBIDDEN", message, 403),
  notFound: (message = "Not found") => new AppError("NOT_FOUND", message, 404),
  conflict: (message: string) => new AppError("CONFLICT", message, 409),
  rateLimited: (retryAfterSeconds: number) =>
    new AppError(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      429,
      { "Retry-After": String(retryAfterSeconds) },
    ),
  paymentFailed: (message: string) =>
    new AppError("PAYMENT_FAILED", message, 400),
  upstreamFailed: (message: string) =>
    new AppError("UPSTREAM_FAILED", message, 502),
};
