/**
 * CORS Configuration Plugin
 * Fastify plugin for Cross-Origin Resource Sharing
 */

import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

/**
 * CORS plugin
 * Configures CORS headers for cross-origin requests
 */
const corsPluginAsync: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  const { config } = fastify;
  const { cors: corsConfig } = config;

  await fastify.register(cors, {
    origin: corsConfig.origin,
    credentials: corsConfig.credentials,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    exposedHeaders: ["X-Total-Count", "X-Request-ID"],
    maxAge: 86400, // 24 hours
    preflight: true,
    strictPreflight: true,
  });

  fastify.log.info("✅ CORS configured");
};

// Export as Fastify plugin
export const corsPlugin = fp(corsPluginAsync, {
  name: "cors",
  fastify: "4.x",
});
