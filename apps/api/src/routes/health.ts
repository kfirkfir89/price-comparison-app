/**
 * Health Check Routes
 * Endpoints for monitoring service health
 */

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { checkMongoDBHealth } from "../plugins/mongodb.js";
import { checkRedisHealth } from "../plugins/redis.js";

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    mongodb: {
      status: "healthy" | "unhealthy";
      latency?: number;
      error?: string;
    };
    redis: {
      status: "healthy" | "unhealthy";
      latency?: number;
      error?: string;
    };
    meilisearch?: {
      status: "healthy" | "unhealthy";
      latency?: number;
      error?: string;
    };
  };
}

/**
 * Health check routes plugin
 */
export const healthRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  /**
   * GET /health
   * Basic health check - quick response for load balancers
   */
  fastify.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Basic health check",
        description: "Returns a quick health status for load balancer checks",
        response: {
          200: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["healthy", "degraded", "unhealthy"],
              },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    },
  );

  /**
   * GET /health/detailed
   * Detailed health check with all service statuses
   */
  fastify.get(
    "/health/detailed",
    {
      schema: {
        tags: ["Health"],
        summary: "Detailed health check",
        description:
          "Returns detailed health status including all service dependencies",
        response: {
          200: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["healthy", "degraded", "unhealthy"],
              },
              timestamp: { type: "string", format: "date-time" },
              uptime: { type: "number" },
              version: { type: "string" },
              services: {
                type: "object",
                properties: {
                  mongodb: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      latency: { type: "number" },
                      error: { type: "string" },
                    },
                  },
                  redis: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      latency: { type: "number" },
                      error: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Check all services in parallel
      const [mongoHealth, redisHealth] = await Promise.all([
        checkMongoDBHealth(),
        checkRedisHealth(fastify.redis),
      ]);

      // Determine overall status
      const allHealthy =
        mongoHealth.status === "healthy" && redisHealth.status === "healthy";
      const allUnhealthy =
        mongoHealth.status === "unhealthy" &&
        redisHealth.status === "unhealthy";

      let overallStatus: "healthy" | "degraded" | "unhealthy";
      if (allHealthy) {
        overallStatus = "healthy";
      } else if (allUnhealthy) {
        overallStatus = "unhealthy";
      } else {
        overallStatus = "degraded";
      }

      const response: HealthCheckResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: fastify.config.env.APP_VERSION,
        services: {
          mongodb: mongoHealth,
          redis: redisHealth,
        },
      };

      // Return appropriate status code
      const statusCode =
        overallStatus === "healthy"
          ? 200
          : overallStatus === "degraded"
            ? 200
            : 503;

      return reply.status(statusCode).send(response);
    },
  );

  /**
   * GET /health/ready
   * Readiness check - are we ready to accept traffic?
   */
  fastify.get(
    "/health/ready",
    {
      schema: {
        tags: ["Health"],
        summary: "Readiness check",
        description: "Check if the service is ready to accept traffic",
        response: {
          200: {
            type: "object",
            properties: {
              ready: { type: "boolean" },
            },
          },
          503: {
            type: "object",
            properties: {
              ready: { type: "boolean" },
              reason: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const mongoHealth = await checkMongoDBHealth();

      if (mongoHealth.status === "healthy") {
        return reply.send({ ready: true });
      }

      return reply.status(503).send({
        ready: false,
        reason: "MongoDB not available",
      });
    },
  );

  /**
   * GET /health/live
   * Liveness check - is the process running?
   */
  fastify.get(
    "/health/live",
    {
      schema: {
        tags: ["Health"],
        summary: "Liveness check",
        description: "Check if the process is running",
        response: {
          200: {
            type: "object",
            properties: {
              alive: { type: "boolean" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({ alive: true });
    },
  );
};
