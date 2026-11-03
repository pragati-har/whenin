const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

export function createRateLimiter({ windowMs, maxRequests }: RateLimitConfig) {
  return {
    check: (key: string) => {
      const now = Date.now();
      const existing = rateLimitStore.get(key);

      if (!existing || existing.resetAt <= now) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
      }

      if (existing.count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetInMs: Math.max(0, existing.resetAt - now),
        };
      }

      existing.count += 1;
      rateLimitStore.set(key, existing);
      return { allowed: true, remaining: maxRequests - existing.count, resetInMs: Math.max(0, existing.resetAt - now) };
    },
  };
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown-ip';
}

export function getUserKey(request: Request, userId?: string) {
  return userId || getClientIp(request);
}
