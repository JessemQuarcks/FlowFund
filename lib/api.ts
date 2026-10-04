import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { AppError, ErrorCode, errors } from "@/lib/errors";

// Every API error response has this shape. `message` is safe to show to
// the user; `issues` lists each invalid field for validation failures.
export type ErrorBody = {
  message: string;
  code: ErrorCode;
  issues?: { path: string; message: string }[];
};

export function errorResponse(error: unknown): NextResponse<ErrorBody> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { message: error.message, code: error.code },
      { status: error.status, headers: error.headers },
    );
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return NextResponse.json(
      {
        message: issues[0]?.message ?? "Invalid request",
        code: "VALIDATION_FAILED",
        issues,
      },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { message: "Internal server error", code: "INTERNAL" },
    { status: 500 },
  );
}

// Wraps a route handler so thrown AppErrors and ZodErrors become JSON
// error responses and anything unexpected is logged and returned as 500.
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw errors.unauthorized();
  return session.user;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw errors.badRequest("Request body must be JSON");
  }
}
