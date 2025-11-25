/**
 * Rate Limiting Middleware
 * Fastify plugin for request rate limiting
 */

import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
} from "fastify";

/**
 * Rate limit configuration by route type
 */
interface RateLimitTier {
  /** Maximum requests per window */
  max: number;
  /** Time window in milliseconds */
  timeWindow: number;
  /** Error message */
  message?: string;
}

/**
 * Rate limit tiers
 */
const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  // Default rate limit
  default: {
    max: 100,
    timeWindow: 60 * 1000, // 1 minute
    message: "Too many requests. Please try again later.",
  },

  // Search endpoints - more restrictive
  search: {
    max: 30,
    timeWindow: 60 * 1000, // 1 minute
    message: "Too many search requests. Please wait before searching again.",
  },

  // Health check - very permissive
  health: {
    max: 1000,
    timeWindow: 60 * 1000, // 1 minute
  },

  // Stats endpoints - moderate
  stats: {
    max: 60,
    timeWindow: 60 * 1000, // 1 minute
  },

  // Authenticated users - more permissive
  authenticated: {
    max: 500,
    timeWindow: 60 * 1000, // 1 minute
  },
};

/**
 * Rate limit key generator
 * Uses IP address and optional user ID for rate limiting
 */
function keyGenerator(request: FastifyRequest): string {
  // Use user ID if authenticated
  // TODO: Implement when auth is added
  // const userId = request.user?.id;
  // if (userId) {
  //   return `user:${userId}`;
  // }

  // Fallback to IP address
  const ip = request.ip || request.headers["x-forwarded-for"] || "unknown";
  return `ip:${ip}`;
}

/**
 * Rate limit plugin
 */
const rateLimitPluginAsync: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  const { config } = fastify;

  // Register global rate limit
  await fastify.register(rateLimit, {
    global: true,
    max: config.rateLimit.maxRequests,
    timeWindow: config.rateLimit.windowMs,
    keyGenerator,
    allowList: [], // IPs to skip rate limiting
    enableDraftSpec: true, // Add RateLimit-* headers

    // Custom error response
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded. You have made ${context.max} requests in ${context.after}. Please try again later.`,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: context.after,
        timestamp: new Date().toISOString(),
      };
    },

    // Custom handler for rate limit exceeded
    onExceeding: (request, key) => {
      fastify.log.warn({ key, path: request.url }, "Rate limit approaching");
    },

    onExceeded: (request, key) => {
      fastify.log.warn({ key, path: request.url }, "Rate limit exceeded");
    },
  });

  fastify.log.info("✅ Rate limiting configured");
};

/**
 * Create route-specific rate limit config
 */
export function createRateLimitConfig(tier: keyof typeof RATE_LIMIT_TIERS) {
  // Safe to assert since tier is constrained to keyof RATE_LIMIT_TIERS
  const config = (RATE_LIMIT_TIERS[tier] ??
    RATE_LIMIT_TIERS.default) as RateLimitTier;

  return {
    config: {
      rateLimit: {
        max: config.max,
        timeWindow: config.timeWindow,
        errorResponseBuilder: (
          _request: FastifyRequest,
          context: { max: number; after: string },
        ) => ({
          statusCode: 429,
          error: "Too Many Requests",
          message:
            config.message ||
            `Rate limit exceeded. Please try again after ${context.after}.`,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: context.after,
          timestamp: new Date().toISOString(),
        }),
      },
    },
  };
}

/**
 * Rate limit decorator for route handlers
 * Use this to apply custom rate limits to specific routes
 */
export function withRateLimit(tier: keyof typeof RATE_LIMIT_TIERS): {
  config: {
    rateLimit: {
      max: number;
      timeWindow: number;
    };
  };
} {
  return createRateLimitConfig(tier);
}

/**
 * Skip rate limit for a route
 */
export const skipRateLimit = {
  config: {
    rateLimit: false,
  },
};

// Export as Fastify plugin
export const rateLimitPlugin = fp(rateLimitPluginAsync, {
  name: "rate-limit",
  fastify: "4.x",
});

// Export tiers for reference
export { RATE_LIMIT_TIERS };
