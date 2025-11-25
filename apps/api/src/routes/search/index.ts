/**
 * Search Routes
 * Central registration for all search-related endpoints
 */

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { localSearchRoutes } from "./local.route.js";
import { globalSearchRoutes } from "./global.route.js";

/**
 * Search routes plugin
 * Registers local and global search endpoints
 */
export const searchRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  // Local search: POST /api/v1/search/local
  await fastify.register(localSearchRoutes);

  // Global search: POST /api/v1/search/global
  await fastify.register(globalSearchRoutes);

  fastify.log.debug("Search routes registered");
};
