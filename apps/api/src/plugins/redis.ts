/**
 * Redis Connection Plugin
 * Fastify plugin for Redis connection management using ioredis
 */

import fp from "fastify-plugin";
import Redis from "ioredis";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

/**
 * Redis connection plugin
 * Establishes and manages Redis connection
 */
const redisPluginAsync: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  const { config } = fastify;
  const { redis: redisConfig } = config;

  try {
    // Create Redis client
    const redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db,
      retryStrategy: (times: number) => {
        // Reconnect after a delay that increases with each attempt
        const delay = Math.min(times * 50, 2000);
        fastify.log.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    // Handle connection events
    redis.on("connect", () => {
      fastify.log.info("🔗 Redis connecting...");
    });

    redis.on("ready", () => {
      fastify.log.info("✅ Redis connected and ready");
    });

    redis.on("error", (err) => {
      fastify.log.error({ err }, "❌ Redis error");
    });

    redis.on("close", () => {
      fastify.log.warn("⚠️ Redis connection closed");
    });

    redis.on("reconnecting", () => {
      fastify.log.info("🔄 Redis reconnecting...");
    });

    // Decorate fastify with redis client
    fastify.decorate("redis", redis);

    // Cleanup on close
    fastify.addHook("onClose", async () => {
      await redis.quit();
      fastify.log.info("Redis connection closed");
    });
  } catch (err) {
    fastify.log.error({ err }, "❌ Failed to connect to Redis");
    throw err;
  }
};

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(redis: Redis): Promise<{
  status: "healthy" | "unhealthy";
  latency?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    const result = await redis.ping();
    const latency = Date.now() - start;

    if (result === "PONG") {
      return { status: "healthy", latency };
    }

    return { status: "unhealthy", error: "Invalid ping response" };
  } catch (err) {
    return {
      status: "unhealthy",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Export as Fastify plugin with proper encapsulation
export const redisPlugin = fp(redisPluginAsync, {
  name: "redis",
  fastify: "4.x",
  dependencies: ["mongodb"], // Load after MongoDB
});

// Type augmentation
declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}
