/**
 * Product Routes
 * Central registration for all product-related endpoints
 */

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { productDetailRoutes } from "./details.route.js";

/**
 * Product routes plugin
 * Registers product detail and comparison endpoints
 */
export const productRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  // Product details: GET /api/v1/products/:id
  await fastify.register(productDetailRoutes);

  // TODO: Add more product routes as needed
  // await fastify.register(productCompareRoutes);
  // await fastify.register(productHistoryRoutes);

  fastify.log.debug("Product routes registered");
};
