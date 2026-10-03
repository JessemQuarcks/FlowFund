// Fixed-window rate limiter kept in process memory.
//
// Limits are per server instance: on serverless hosting each instance keeps
// its own counters, so the effective limit is higher than configured. Swap
// this for a shared store (e.g. Upstash Redis) once hosting is decided.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateLimitResult = { success: boolean; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      success: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { success: true, retryAfterSeconds: 0 };
}

// x-forwarded-for is only trustworthy behind a proxy that sets it (Vercel,
// a load balancer). Without one, clients can spoof it.
export function getClientIp(
  headers: Headers | Record<string, string | string[] | undefined> | undefined
): string {
  const read = (name: string): string | undefined => {
    if (!headers) return undefined;
    if (headers instanceof Headers) return headers.get(name) ?? undefined;
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const forwarded = read("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return read("x-real-ip") ?? "unknown";
}

export function tooManyRequests(result: RateLimitResult) {
  return Response.json(
    { message: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}
