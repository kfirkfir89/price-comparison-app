/**
 * Route Registration
 * Central point for registering all API routes
 */

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

// Route modules
import { healthRoutes } from "./health.js";
import { searchRoutes } from "./search/index.js";
import { productRoutes } from "./products/index.js";
import { statsRoutes } from "./stats.js";
import { devRoutes } from "./dev.js";

/**
 * Register all routes
 */
const registerRoutesAsync: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  // Health check routes (no prefix)
  await fastify.register(healthRoutes);

  // API v1 routes
  await fastify.register(
    async (api) => {
      // Search routes: /api/v1/search/*
      await api.register(searchRoutes, { prefix: "/search" });

      // Product routes: /api/v1/products/*
      await api.register(productRoutes, { prefix: "/products" });

      // Stats routes: /api/v1/stats/*
      await api.register(statsRoutes, { prefix: "/stats" });

      // Dev routes: /api/v1/dev/* (only in development with mock data)
      await api.register(devRoutes, { prefix: "/dev" });

      // TODO: Add more route modules as needed
      // await api.register(recommendationRoutes, { prefix: '/recommendations' });
      // await api.register(userRoutes, { prefix: '/user' });
      // await api.register(authRoutes, { prefix: '/auth' });
    },
    { prefix: "/api/v1" },
  );

  fastify.log.info("✅ All routes registered");
};

export const registerRoutes = fp(registerRoutesAsync, {
  name: "routes",
  fastify: "4.x",
  dependencies: ["mongodb", "redis"],
});
