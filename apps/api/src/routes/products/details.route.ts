/**
 * Product Details Route
 * GET /api/v1/products/:id
 *
 * Get detailed information about a specific product
 */

import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { z } from "zod";
import type { Product, ProductGroup } from "@price-comparison/types";
import { ProductService } from "../../services/product.service.js";
import { CacheService } from "../../services/cache.service.js";

/**
 * Route params schema
 */
const productParamsSchema = z.object({
  id: z.string().min(1),
});

/**
 * Query params schema
 */
const productQuerySchema = z.object({
  include_group: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  include_history: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
});

type ProductParams = z.infer<typeof productParamsSchema>;
type ProductQuery = z.infer<typeof productQuerySchema>;

/**
 * Product detail response
 */
interface ProductDetailResponse {
  product: Product;
  group?: ProductGroup;
  alternatives?: Product[];
  price_history?: Array<{
    date: string;
    price: number;
    shop: string;
  }>;
}

/**
 * Product detail routes plugin
 */
export const productDetailRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  // Initialize services
  const productService = new ProductService(fastify);
  const cacheService = new CacheService(fastify);

  /**
   * GET /api/v1/products/:id
   * Get product details
   */
  fastify.get<{ Params: ProductParams; Querystring: ProductQuery }>(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        summary: "Get product details",
        description: `
Get detailed information about a specific product.

**Options:**
- \`include_group=true\`: Include product group with alternatives from other shops
- \`include_history=true\`: Include price history data
        `,
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Product ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            include_group: {
              type: "string",
              enum: ["true", "false"],
              description: "Include product group with alternatives",
            },
            include_history: {
              type: "string",
              enum: ["true", "false"],
              description: "Include price history",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              product: { type: "object", additionalProperties: true },
              group: {
                type: "object",
                nullable: true,
                description:
                  "Product group (same product from different shops)",
              },
              alternatives: {
                type: "array",
                items: { type: "object" },
                description: "Alternative products from other shops",
              },
              price_history: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string", format: "date-time" },
                    price: { type: "number" },
                    shop: { type: "string" },
                  },
                },
              },
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
          404: {
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
      request: FastifyRequest<{
        Params: ProductParams;
        Querystring: ProductQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        // Validate params
        const params = productParamsSchema.parse(request.params);
        const query = productQuerySchema.parse(request.query);

        // Try to get from cache
        const cacheKey = `product:${params.id}:${query.include_group}:${query.include_history}`;
        const cachedResult =
          await cacheService.get<ProductDetailResponse>(cacheKey);

        if (cachedResult) {
          fastify.log.debug({ cacheKey }, "Cache hit for product details");
          return reply.send(cachedResult);
        }

        // Get product
        const product = await productService.findById(params.id);

        if (!product) {
          return reply.status(404).send({
            statusCode: 404,
            error: "Not Found",
            message: `Product with ID '${params.id}' not found`,
          });
        }

        // Build response
        const response: ProductDetailResponse = {
          product,
        };

        // Include product group and alternatives if requested
        if (query.include_group && product.product_group_id) {
          const groupResult = await productService.findProductGroup(
            product.product_group_id,
          );
          if (groupResult) {
            response.group = groupResult.group;
            response.alternatives = groupResult.alternatives.filter(
              (p) => p._id !== product._id,
            );
          }
        }

        // Include price history if requested
        if (query.include_history) {
          response.price_history = await productService.getPriceHistory(
            params.id,
          );
        }

        // Cache the result
        await cacheService.set(
          cacheKey,
          response,
          fastify.config.cacheTTL.products,
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

        fastify.log.error({ error }, "Product details error");
        throw error;
      }
    },
  );

  /**
   * GET /api/v1/products
   * List products (with pagination)
   */
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        summary: "List products",
        description: "Get a paginated list of products",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            per_page: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
            shop: { type: "string", description: "Filter by shop name" },
            category: { type: "string", description: "Filter by category" },
            brand: { type: "string", description: "Filter by brand" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              products: { type: "array", items: { type: "object", additionalProperties: true } },
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
            },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        page = 1,
        per_page = 20,
        shop,
        category,
        brand,
      } = request.query as {
        page?: number;
        per_page?: number;
        shop?: string;
        category?: string;
        brand?: string;
      };

      const result = await productService.findAll({
        page,
        per_page,
        shop,
        category,
        brand,
      });

      return reply.send(result);
    },
  );
};
