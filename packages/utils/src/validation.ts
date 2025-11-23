/**
 * Zod validation schemas for common data structures
 */

import { z } from 'zod';

/**
 * URL validation schema
 */
export const urlSchema = z.string().url().trim();

/**
 * Email validation schema
 */
export const emailSchema = z.string().email().toLowerCase().trim();

/**
 * Price validation schema (positive number)
 */
export const priceSchema = z.number().positive();

/**
 * Optional price schema
 */
export const optionalPriceSchema = z.number().positive().optional();

/**
 * Percentage validation schema (0-100)
 */
export const percentageSchema = z.number().min(0).max(100);

/**
 * Rating validation schema (0-5)
 */
export const ratingSchema = z.number().min(0).max(5);

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(20),
});

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1).max(200).trim(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().max(100).optional(),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});

/**
 * Price range schema
 */
export const priceRangeSchema = z.object({
  min: priceSchema.optional(),
  max: priceSchema.optional(),
});

/**
 * Shop ID schema
 */
export const shopIdSchema = z.string().min(1).max(50).trim();

/**
 * Product ID schema (MongoDB ObjectId)
 */
export const productIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID');

/**
 * Country code schema (ISO 3166-1 alpha-2)
 */
export const countryCodeSchema = z.string().length(2).toUpperCase();

/**
 * Currency code schema (ISO 4217)
 */
export const currencyCodeSchema = z.string().length(3).toUpperCase();

/**
 * Language code schema (ISO 639-1)
 */
export const languageCodeSchema = z.string().length(2).toLowerCase();

/**
 * Validate product name
 */
export const productNameSchema = z.string().min(1).max(500).trim();

/**
 * Validate product description
 */
export const productDescriptionSchema = z.string().max(5000).trim().optional();

/**
 * Validate SKU
 */
export const skuSchema = z.string().min(1).max(100).trim();

/**
 * Phone number schema (basic)
 */
export const phoneSchema = z.string().regex(/^\+?[0-9\s-()]{7,20}$/);

/**
 * Password schema (minimum requirements)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Validate array of IDs
 */
export function createArrayOfIdsSchema(itemSchema: z.ZodString, min = 1, max = 100) {
  return z.array(itemSchema).min(min).max(max);
}

/**
 * Validate enum value
 */
export function createEnumSchema<T extends string>(values: readonly T[]) {
  return z.enum(values as [T, ...T[]]);
}

/**
 * Validate sorting parameters
 */
export const sortSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Validate filter parameters
 */
export const filterSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]));

/**
 * Generic API request schema
 */
export const apiRequestSchema = z.object({
  params: z.record(z.any()).optional(),
  query: z.record(z.any()).optional(),
  body: z.record(z.any()).optional(),
});

/**
 * Helper: Create optional schema
 */
export function makeOptional<T extends z.ZodTypeAny>(schema: T) {
  return schema.optional();
}

/**
 * Helper: Create nullable schema
 */
export function makeNullable<T extends z.ZodTypeAny>(schema: T) {
  return schema.nullable();
}

/**
 * Helper: Create array schema
 */
export function makeArray<T extends z.ZodTypeAny>(schema: T, min = 0, max?: number) {
  let arraySchema = z.array(schema).min(min);
  if (max !== undefined) {
    arraySchema = arraySchema.max(max);
  }
  return arraySchema;
}

/**
 * Validate webhook payload signature
 */
export const webhookSignatureSchema = z.object({
  signature: z.string(),
  timestamp: z.number(),
  body: z.string(),
});
