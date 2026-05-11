// Simple in-memory rate limiting
// Production-д Redis ашиглахыг зөвлөж байна

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  LOGIN: {
    maxRequests: 5, // 5 attempts
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  REGISTER_REQUEST: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

function getClientIdentifier(request: Request): string {
  // Get IP from headers (works with most hosting platforms)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  return ip;
}

export function checkRateLimit(
  request: Request,
  type: "LOGIN" | "REGISTER_REQUEST" | "API" = "API"
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const clientId = getClientIdentifier(request);
  const key = `${clientId}:${type}`;
  const config = RATE_LIMIT_CONFIG[type];
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Rate limit middleware helper
export function rateLimitMiddleware(
  request: Request,
  type: "LOGIN" | "REGISTER_REQUEST" | "API" = "API"
): Response | null {
  const result = checkRateLimit(request, type);

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        message: "Too many requests. Please try again later.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  return null;
}

// Clean up old entries periodically (every 5 minutes)
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
