/**
 * Local Search Route
 * POST /api/v1/search/local
 *
 * Search for products from local (country-specific) shops
 */

import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { z } from "zod";
import type {
  LocalSearchRequest,
  LocalSearchResponse,
  SearchFilters,
} from "@price-comparison/types";
import { Country, SortBy, AvailabilityStatus } from "@price-comparison/types";
import { SearchService } from "../../services/search.service.js";
import { CacheService } from "../../services/cache.service.js";

/**
 * Request body validation schema
 */
const localSearchSchema = z.object({
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
      country: z.nativeEnum(Country).optional(),
    })
    .optional(),
  sort_by: z.nativeEnum(SortBy).optional().default(SortBy.RELEVANCE),
  page: z.number().int().positive().optional().default(1),
  per_page: z.number().int().positive().max(100).optional().default(20),
  country: z.nativeEnum(Country),
  check_international: z.boolean().optional().default(false),
});

type LocalSearchBody = z.infer<typeof localSearchSchema>;

/**
 * Local search routes plugin
 */
export const localSearchRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  // Initialize services
  const searchService = new SearchService(fastify);
  const cacheService = new CacheService(fastify);

  /**
   * POST /api/v1/search/local
   * Search products from local shops
   */
  fastify.post<{ Body: LocalSearchBody }>(
    "/local",
    {
      schema: {
        tags: ["Search"],
        summary: "Search local shops",
        description: `
Search for products from shops in the user's country.

**Features:**
- Fast delivery (1-3 days)
- No import fees
- Local currency
- Optional background check for international deals

**Note:** Set \`check_international: true\` to receive smart deal notifications when significant savings are available from international retailers.
        `,
        body: {
          type: "object",
          required: ["query", "country"],
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
              default: "relevance",
            },
            page: { type: "integer", minimum: 1, default: 1 },
            per_page: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
            country: { type: "string", enum: ["IL", "US", "UK", "DE", "FR"] },
            check_international: { type: "boolean", default: false },
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
              smart_deal: {
                type: "object",
                nullable: true,
                properties: {
                  available: { type: "boolean" },
                  message: { type: "string" },
                  summary: {
                    type: "object",
                    properties: {
                      best_local: { type: "number" },
                      best_international: { type: "number" },
                      savings: { type: "number" },
                      savings_percent: { type: "number" },
                      delivery_difference: { type: "number" },
                      shop: { type: "string" },
                      country: { type: "string" },
                    },
                  },
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
      request: FastifyRequest<{ Body: LocalSearchBody }>,
      reply: FastifyReply,
    ) => {
      const startTime = Date.now();

      try {
        // Validate request body
        const validatedBody = localSearchSchema.parse(request.body);

        // Build search request
        const searchRequest: LocalSearchRequest = {
          query: validatedBody.query,
          filters: validatedBody.filters as SearchFilters,
          sort_by: validatedBody.sort_by,
          page: validatedBody.page,
          per_page: validatedBody.per_page,
          country: validatedBody.country,
          check_international: validatedBody.check_international,
        };

        // Try to get from cache
        const cacheKey = cacheService.buildSearchCacheKey(
          "local",
          searchRequest,
        );
        const cachedResult =
          await cacheService.get<LocalSearchResponse>(cacheKey);

        if (cachedResult) {
          fastify.log.debug({ cacheKey }, "Cache hit for local search");
          return reply.send({
            ...cachedResult,
            took_ms: Date.now() - startTime,
          });
        }

        // Execute search
        const searchResult = await searchService.searchLocal(searchRequest);

        // Build response
        const response: LocalSearchResponse = {
          results: searchResult.products,
          pagination: searchResult.pagination,
          smart_deal: searchResult.smartDeal,
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

        fastify.log.error({ error }, "Local search error");
        throw error;
      }
    },
  );
};
