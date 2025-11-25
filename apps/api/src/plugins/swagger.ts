/**
 * Swagger/OpenAPI Documentation Plugin
 * Fastify plugin for API documentation
 */

import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

/**
 * Swagger plugin
 * Configures OpenAPI documentation
 */
const swaggerPluginAsync: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  const { config } = fastify;

  // Register OpenAPI spec
  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Price Comparison API",
        description: `
## Overview
The Price Comparison API provides endpoints for searching and comparing product prices across multiple retailers.

## Features
- **Local Search**: Find products from shops in your country
- **Global Search**: Search international retailers with shipping/duty calculations
- **Smart Recommendations**: Get notified when international deals are significantly cheaper
- **Product Details**: View detailed product information and price history

## Authentication
Most endpoints are public. Protected endpoints require JWT authentication via Bearer token.

## Rate Limiting
- Public endpoints: 100 requests per minute
- Authenticated endpoints: 500 requests per minute
        `,
        version: config.env.APP_VERSION,
        contact: {
          name: "API Support",
          email: "support@pricecomparison.com",
        },
      },
      servers: [
        {
          url: `http://localhost:${config.env.API_PORT}`,
          description: "Development server",
        },
      ],
      tags: [
        { name: "Health", description: "Health check endpoints" },
        { name: "Search", description: "Product search endpoints" },
        { name: "Products", description: "Product detail endpoints" },
        { name: "Stats", description: "Statistics endpoints" },
        { name: "Recommendations", description: "Smart deal recommendations" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              statusCode: { type: "integer" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          Pagination: {
            type: "object",
            properties: {
              current_page: { type: "integer" },
              total_pages: { type: "integer" },
              per_page: { type: "integer" },
              total_results: { type: "integer" },
              has_next: { type: "boolean" },
              has_prev: { type: "boolean" },
            },
          },
          Product: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              brand: { type: "string" },
              category: { type: "string" },
              image_url: { type: "string" },
              product_url: { type: "string" },
              shop_info: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["local", "global"] },
                  country: { type: "string" },
                },
              },
              pricing: {
                type: "object",
                properties: {
                  base: {
                    type: "object",
                    properties: {
                      amount: { type: "number" },
                      currency: { type: "string" },
                    },
                  },
                  local_total: { type: "number" },
                },
              },
              availability: {
                type: "string",
                enum: ["in_stock", "out_of_stock", "low_stock"],
              },
              rating: { type: "number" },
              review_count: { type: "integer" },
            },
          },
        },
      },
    },
  });

  // Register Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      filter: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  fastify.log.info("✅ Swagger documentation configured at /documentation");
};

// Export as Fastify plugin
export const swaggerPlugin = fp(swaggerPluginAsync, {
  name: "swagger",
  fastify: "4.x",
});
