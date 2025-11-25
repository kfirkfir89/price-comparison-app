/**
 * Global Search Route
 * POST /api/v1/search/global
 *
 * Search for products from international retailers
 */

import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { z } from "zod";
import type {
  GlobalSearchRequest,
  GlobalSearchResponse,
  SearchFilters,
} from "@price-comparison/types";
import { Country, SortBy, AvailabilityStatus } from "@price-comparison/types";
import { SearchService } from "../../services/search.service.js";
import { CacheService } from "../../services/cache.service.js";

/**
 * Request body validation schema
 */
const globalSearchSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z
    .object({
      min_price: z.number().positive().optional(),
      max_price: z.number().positive().optional(),
      in_stock: z.boolean().optional(),
      shops: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      brands: z.array(z.string()).optional(),
      min_rating: z.number().min(0).max(5).optional(),
      availability: z.array(z.nativeEnum(AvailabilityStatus)).optional(),
    })
    .optional(),
  sort_by: z.nativeEnum(SortBy).optional().default(SortBy.PRICE_ASC),
  page: z.number().int().positive().optional().default(1),
  per_page: z.number().int().positive().max(100).optional().default(20),
  user_country: z.nativeEnum(Country),
  include_shipping: z.boolean().optional().default(true),
  include_all_fees: z.boolean().optional().default(true),
  min_seller_rating: z.number().min(0).max(5).optional(),
});

type GlobalSearchBody = z.infer<typeof globalSearchSchema>;

/**
 * Global search routes plugin
 */
export const globalSearchRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  // Initialize services
  const searchService = new SearchService(fastify);
  const cacheService = new CacheService(fastify);

  /**
   * POST /api/v1/search/global
   * Search products from international retailers
   */
  fastify.post<{ Body: GlobalSearchBody }>(
    "/global",
    {
      schema: {
        tags: ["Search"],
        summary: "Search global retailers",
        description: `
Search for products from international retailers (Amazon, AliExpress, eBay, etc.)

**Features:**
- Access to worldwide retailers
- Shipping cost calculation included
- Import duty/VAT estimation
- Total landed cost (all-in price)
- Seller rating filters

**Note:** All prices include shipping and import fees when \`include_all_fees\` is true.
        `,
        body: {
          type: "object",
          required: ["query", "user_country"],
          properties: {
            query: { type: "string", minLength: 1, maxLength: 200 },
            filters: {
              type: "object",
              properties: {
                min_price: { type: "number" },
                max_price: { type: "number" },
                in_stock: { type: "boolean" },
                shops: { type: "array", items: { type: "string" } },
                categories: { type: "array", items: { type: "string" } },
                brands: { type: "array", items: { type: "string" } },
                min_rating: { type: "number", minimum: 0, maximum: 5 },
              },
            },
            sort_by: {
              type: "string",
              enum: [
                "relevance",
                "price_asc",
                "price_desc",
                "rating",
                "newest",
              ],
              default: "price_asc",
            },
            page: { type: "integer", minimum: 1, default: 1 },
            per_page: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
            user_country: {
              type: "string",
              enum: ["IL", "US", "UK", "DE", "FR"],
            },
            include_shipping: { type: "boolean", default: true },
            include_all_fees: { type: "boolean", default: true },
            min_seller_rating: { type: "number", minimum: 0, maximum: 5 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              results: { type: "array", items: { type: "object", additionalProperties: true } },
              pagination: {
                type: "object",
                properties: {
                  current_page: { type: "number" },
                  total_pages: { type: "number" },
                  per_page: { type: "number" },
                  total_results: { type: "number" },
                  has_next: { type: "boolean" },
                  has_prev: { type: "boolean" },
                },
              },
              query: { type: "string" },
              filters: { type: "object" },
              took_ms: { type: "number" },
            },
          },
          400: {
            type: "object",
            properties: {
              statusCode: { type: "number" },
              error: { type: "string" },
              message: { type: "string" },
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
    async (
      request: FastifyRequest<{ Body: GlobalSearchBody }>,
      reply: FastifyReply,
    ) => {
      const startTime = Date.now();

      try {
        // Validate request body
        const validatedBody = globalSearchSchema.parse(request.body);

        // Build search request
        const searchRequest: GlobalSearchRequest = {
          query: validatedBody.query,
          filters: validatedBody.filters as SearchFilters,
          sort_by: validatedBody.sort_by,
          page: validatedBody.page,
          per_page: validatedBody.per_page,
          user_country: validatedBody.user_country,
          include_shipping: validatedBody.include_shipping,
          include_all_fees: validatedBody.include_all_fees,
          min_seller_rating: validatedBody.min_seller_rating,
        };

        // Try to get from cache
        const cacheKey = cacheService.buildSearchCacheKey(
          "global",
          searchRequest,
        );
        const cachedResult =
          await cacheService.get<GlobalSearchResponse>(cacheKey);

        if (cachedResult) {
          fastify.log.debug({ cacheKey }, "Cache hit for global search");
          return reply.send({
            ...cachedResult,
            took_ms: Date.now() - startTime,
          });
        }

        // Execute search
        const searchResult = await searchService.searchGlobal(searchRequest);

        // Build response
        const response: GlobalSearchResponse = {
          results: searchResult.products,
          pagination: searchResult.pagination,
          query: validatedBody.query,
          filters: validatedBody.filters || {},
          took_ms: Date.now() - startTime,
        };

        // Cache the result
        await cacheService.set(
          cacheKey,
          response,
          fastify.config.cacheTTL.search,
        );

        return reply.send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            statusCode: 400,
            error: "Bad Request",
            message: error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          });
        }

        fastify.log.error({ error }, "Global search error");
        throw error;
      }
    },
  );
};
