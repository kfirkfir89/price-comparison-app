/**
 * Validation Middleware
 * Zod-based request validation for Fastify
 */

import type {
  FastifyRequest,
  FastifyReply,
  FastifySchema,
  preHandlerHookHandler,
} from "fastify";
import { z, ZodError, ZodSchema } from "zod";
import { ValidationError } from "./error-handler.js";

/**
 * Validation target types
 */
type ValidationTarget = "body" | "query" | "params" | "headers";

/**
 * Validation options
 */
interface ValidationOptions {
  /** Strip unknown properties */
  stripUnknown?: boolean;
  /** Abort early on first error */
  abortEarly?: boolean;
}

/**
 * Validation error details
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

/**
 * Format Zod errors into a consistent structure
 */
function formatZodErrors(error: ZodError): ValidationErrorDetail[] {
  return error.errors.map((err) => ({
    field: err.path.join(".") || "root",
    message: err.message,
    code: err.code,
    received: "received" in err ? err.received : undefined,
  }));
}

/**
 * Create validation preHandler hook
 */
export function validate<T extends ZodSchema>(
  schema: T,
  target: ValidationTarget = "body",
  _options: ValidationOptions = {},
): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    // Get data to validate based on target
    let data: unknown;
    switch (target) {
      case "body":
        data = request.body;
        break;
      case "query":
        data = request.query;
        break;
      case "params":
        data = request.params;
        break;
      case "headers":
        data = request.headers;
        break;
    }

    try {
      // Parse and validate
      const validated = schema.parse(data);

      // Replace request data with validated data
      switch (target) {
        case "body":
          request.body = validated;
          break;
        case "query":
          (request as { query: unknown }).query = validated;
          break;
        case "params":
          (request as { params: unknown }).params = validated;
          break;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatZodErrors(error);

        throw new ValidationError(
          `Validation failed for ${target}: ${details.map((d) => d.message).join(", ")}`,
          details,
        );
      }

      throw error;
    }
  };
}

/**
 * Create Fastify schema from Zod schema
 * Converts Zod schema to Fastify JSON Schema for documentation
 */
export function zodToFastifySchema(_zodSchema: ZodSchema): FastifySchema {
  // This is a simplified conversion
  // For complex schemas, consider using zod-to-json-schema library

  return {
    body: {
      type: "object",
      // Note: For proper OpenAPI docs, use @fastify/type-provider-zod
      // or convert Zod schema to JSON Schema
    },
  };
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  /**
   * Pagination query parameters
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    per_page: z.coerce.number().int().positive().max(100).default(20),
  }),

  /**
   * Sort parameters
   */
  sort: z.object({
    sort_by: z
      .enum(["relevance", "price_asc", "price_desc", "rating", "newest"])
      .default("relevance"),
  }),

  /**
   * ID parameter
   */
  idParam: z.object({
    id: z.string().min(1),
  }),

  /**
   * Search query
   */
  searchQuery: z.object({
    q: z.string().min(1).max(200),
  }),

  /**
   * Country parameter
   */
  country: z.object({
    country: z.enum(["IL", "US", "UK", "DE", "FR"]),
  }),

  /**
   * Boolean query parameter (string to boolean)
   */
  booleanQuery: (name: string) =>
    z.object({
      [name]: z
        .enum(["true", "false"])
        .optional()
        .transform((val) => val === "true"),
    }),

  /**
   * Price range filter
   */
  priceRange: z
    .object({
      min_price: z.coerce.number().positive().optional(),
      max_price: z.coerce.number().positive().optional(),
    })
    .refine(
      (data) => {
        if (data.min_price && data.max_price) {
          return data.min_price <= data.max_price;
        }
        return true;
      },
      { message: "min_price must be less than or equal to max_price" },
    ),
};

/**
 * Validation helper for combining schemas
 */
export function combineSchemas<T extends z.ZodObject<z.ZodRawShape>[]>(
  ...schemas: T
): z.ZodObject<z.ZodRawShape> {
  return schemas.reduce<z.ZodObject<z.ZodRawShape>>((acc, schema) => {
    return acc.merge(schema);
  }, z.object({}));
}

/**
 * Create optional wrapper for schema
 */
export function makeOptional<T extends ZodSchema>(schema: T): z.ZodOptional<T> {
  return schema.optional();
}

/**
 * Create array schema
 */
export function arrayOf<T extends ZodSchema>(schema: T): z.ZodArray<T> {
  return z.array(schema);
}

/**
 * Sanitize string input
 */
export const sanitizedString = z.string().transform((val) => {
  // Trim whitespace
  let sanitized = val.trim();

  // Remove potential XSS characters
  sanitized = sanitized.replace(/[<>]/g, "");

  return sanitized;
});

/**
 * Email schema with validation
 */
export const emailSchema = z.string().email().toLowerCase().trim();

/**
 * URL schema with validation
 */
export const urlSchema = z.string().url().trim();

/**
 * Positive number schema
 */
export const positiveNumber = z.coerce.number().positive();

/**
 * Non-negative number schema
 */
export const nonNegativeNumber = z.coerce.number().nonnegative();

/**
 * Rating schema (0-5)
 */
export const ratingSchema = z.coerce.number().min(0).max(5);
