/**
 * Statistics Routes
 * Endpoints for platform statistics and analytics
 */

import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { ProductService } from "../services/product.service.js";
import { CacheService } from "../services/cache.service.js";

/**
 * Platform statistics response
 */
interface GlobalStatsResponse {
  total_products: number;
  total_shops: number;
  products_by_country: Record<string, number>;
  products_by_shop: Record<string, number>;
  categories: string[];
  last_updated: string;
}

/**
 * Stats routes plugin
 */
export const statsRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  // Initialize services
  const productService = new ProductService(fastify);
  const cacheService = new CacheService(fastify);

  /**
   * GET /api/v1/stats/global-products
   * Get global product statistics
   */
  fastify.get(
    "/global-products",
    {
      schema: {
        tags: ["Stats"],
        summary: "Get global product statistics",
        description: `
Get platform-wide statistics about products, shops, and categories.

**Cached:** Results are cached for 10 minutes.
        `,
        response: {
          200: {
            type: "object",
            properties: {
              total_products: {
                type: "integer",
                description: "Total number of products",
              },
              total_shops: {
                type: "integer",
                description: "Total number of shops",
              },
              products_by_country: {
                type: "object",
                additionalProperties: { type: "integer" },
                description: "Product count by country",
              },
              products_by_shop: {
                type: "object",
                additionalProperties: { type: "integer" },
                description: "Product count by shop",
              },
              categories: {
                type: "array",
                items: { type: "string" },
                description: "Available categories",
              },
              last_updated: { type: "string", format: "date-time" },
            },
          },
          500: {
            type: "object",
            properties: {
              statusCode: { type: "number" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Try to get from cache
        const cacheKey = "stats:global-products";
        const cachedResult =
          await cacheService.get<GlobalStatsResponse>(cacheKey);

        if (cachedResult) {
          fastify.log.debug({ cacheKey }, "Cache hit for global stats");
          return reply.send(cachedResult);
        }

        // Get statistics from database
        const stats = await productService.getGlobalStats();

        const response: GlobalStatsResponse = {
          total_products: stats.totalProducts,
          total_shops: stats.totalShops,
          products_by_country: stats.productsByCountry,
          products_by_shop: stats.productsByShop,
          categories: stats.categories,
          last_updated: new Date().toISOString(),
        };

        // Cache the result (longer TTL for stats)
        await cacheService.set(
          cacheKey,
          response,
          fastify.config.cacheTTL.stats,
        );

        return reply.send(response);
      } catch (error) {
        fastify.log.error({ error }, "Global stats error");
        throw error;
      }
    },
  );

  /**
   * GET /api/v1/stats/shops
   * Get shop-specific statistics
   */
  fastify.get(
    "/shops",
    {
      schema: {
        tags: ["Stats"],
        summary: "Get shop statistics",
        description: "Get statistics for all available shops",
        response: {
          200: {
            type: "object",
            properties: {
              shops: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    country: { type: "string" },
                    type: { type: "string", enum: ["local", "global"] },
                    product_count: { type: "integer" },
                    enabled: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Try to get from cache
        const cacheKey = "stats:shops";
        const cachedResult = await cacheService.get<{ shops: unknown[] }>(
          cacheKey,
        );

        if (cachedResult) {
          return reply.send(cachedResult);
        }

        const shops = await productService.getShopStats();

        const response = { shops };

        // Cache the result
        await cacheService.set(
          cacheKey,
          response,
          fastify.config.cacheTTL.stats,
        );

        return reply.send(response);
      } catch (error) {
        fastify.log.error({ error }, "Shop stats error");
        throw error;
      }
    },
  );

  /**
   * GET /api/v1/stats/categories
   * Get category statistics
   */
  fastify.get(
    "/categories",
    {
      schema: {
        tags: ["Stats"],
        summary: "Get category statistics",
        description: "Get statistics for all product categories",
        response: {
          200: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    product_count: { type: "integer" },
                    avg_price: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Try to get from cache
        const cacheKey = "stats:categories";
        const cachedResult = await cacheService.get<{ categories: unknown[] }>(
          cacheKey,
        );

        if (cachedResult) {
          return reply.send(cachedResult);
        }

        const categories = await productService.getCategoryStats();

        const response = { categories };

        // Cache the result
        await cacheService.set(
          cacheKey,
          response,
          fastify.config.cacheTTL.stats,
        );

        return reply.send(response);
      } catch (error) {
        fastify.log.error({ error }, "Category stats error");
        throw error;
      }
    },
  );
};
