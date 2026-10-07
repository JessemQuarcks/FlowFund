import { z } from "zod";

// Server environment, validated once when the server starts (see
// instrumentation.ts) so a missing or malformed variable fails at boot
// instead of on the first request that reads it. Import `env` only from
// server code: it holds secrets.

// Treat empty strings (as left by .env.example) as unset.
const required = (message: string) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string({ required_error: message }).min(1, message),
  );

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: required("is required").refine(
      (value) => value.startsWith("mysql://"),
      "must be a mysql:// connection string",
    ),
    // NextAuth infers the URL on Vercel; set it everywhere else.
    NEXTAUTH_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url("must be a URL").optional(),
    ),
    NEXTAUTH_SECRET: required("is required"),
    GOOGLE_CLIENT_ID: required("is required"),
    GOOGLE_CLIENT_SECRET: required("is required"),
    CLOUDINARY_CLOUD_NAME: required("is required"),
    CLOUDINARY_API_KEY: required("is required"),
    CLOUDINARY_API_SECRET: required("is required"),
    PAYSTACK_SECRET_KEY: required("is required").refine(
      (value) => /^sk_(test|live)_/.test(value),
      "must start with sk_test_ or sk_live_",
    ),
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: required("is required").refine(
      (value) => /^pk_(test|live)_/.test(value),
      "must start with pk_test_ or pk_live_",
    ),
    // Optional shared secret that guards the reconciliation trigger
    // (/api/cron/reconcile). Any scheduler sends it as a Bearer token. When
    // unset, the trigger is disabled. See roadmap Phase 2 (reconciliation).
    CRON_SECRET: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(16, "must be at least 16 characters").optional(),
    ),
    // Optional email delivery (Resend). When RESEND_API_KEY and EMAIL_FROM are
    // unset, emails are logged instead of sent, so local dev and tests work
    // without a provider.
    RESEND_API_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().optional(),
    ),
    EMAIL_FROM: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().optional(),
    ),
    // Where the contact form delivers; falls back to EMAIL_FROM.
    CONTACT_TO: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().optional(),
    ),
  })
  .refine(
    (env) =>
      env.PAYSTACK_SECRET_KEY.startsWith("sk_live_") ===
      env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.startsWith("pk_live_"),
    {
      message: "Paystack secret and public keys must both be test or both live",
      path: ["PAYSTACK_SECRET_KEY"],
    },
  );

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    // Names and reasons only: never echo the values.
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${problems}\nSee .env.example.`,
    );
  }
  return result.data;
}

// SKIP_ENV_VALIDATION=1 lets tooling (e.g. a container image build) import
// server code without real secrets. Never set it on a running server.
export const env: Env = process.env.SKIP_ENV_VALIDATION
  ? (process.env as unknown as Env)
  : parseEnv(process.env);
