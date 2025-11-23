/**
 * Environment variable validation and management
 */

import { z } from 'zod';

/**
 * Environment schema with validation
 */
export const environmentSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('Price Comparison Platform'),
  APP_VERSION: z.string().default('1.0.0'),

  // Ports
  WEB_PORT: z.coerce.number().default(3000),
  API_PORT: z.coerce.number().default(4000),
  SCRAPER_PORT: z.coerce.number().default(5000),
  NORMALIZER_PORT: z.coerce.number().default(5001),
  SEARCH_PORT: z.coerce.number().default(5002),
  RECOMMENDATION_PORT: z.coerce.number().default(5003),

  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017'),
  MONGODB_USERNAME: z.string().default('admin'),
  MONGODB_PASSWORD: z.string().default('password'),
  MONGODB_DATABASE: z.string().default('price-comparison'),
  MONGODB_AUTH_SOURCE: z.string().default('admin'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_DB: z.coerce.number().default(0),

  // Meilisearch
  MEILISEARCH_HOST: z.string().default('http://localhost:7700'),
  MEILISEARCH_MASTER_KEY: z.string().default('changeme_master_key_min_16_chars'),

  // Qdrant
  QDRANT_HOST: z.string().default('localhost'),
  QDRANT_PORT: z.coerce.number().default(6333),
  QDRANT_GRPC_PORT: z.coerce.number().default(6334),
  QDRANT_API_KEY: z.string().optional(),

  // RabbitMQ
  RABBITMQ_HOST: z.string().default('localhost'),
  RABBITMQ_PORT: z.coerce.number().default(5672),
  RABBITMQ_MANAGEMENT_PORT: z.coerce.number().default(15672),
  RABBITMQ_USERNAME: z.string().default('guest'),
  RABBITMQ_PASSWORD: z.string().default('guest'),

  // Feature Flags
  FEATURE_LOCAL_SHOPPING: z.coerce.boolean().default(true),
  FEATURE_GLOBAL_SHOPPING: z.coerce.boolean().default(false),
  FEATURE_SMART_RECOMMENDATIONS: z.coerce.boolean().default(false),
  FEATURE_PRICE_ALERTS: z.coerce.boolean().default(false),
  FEATURE_USER_ACCOUNTS: z.coerce.boolean().default(false),
  FEATURE_VECTOR_SEARCH: z.coerce.boolean().default(false),
  FEATURE_COMPARISON_TABLES: z.coerce.boolean().default(true),

  // Regional Settings
  DEFAULT_COUNTRY: z.string().default('IL'),
  DEFAULT_CURRENCY: z.string().default('ILS'),
  DEFAULT_LANGUAGE: z.string().default('he'),
  SUPPORTED_COUNTRIES: z.string().default('IL,US,UK,DE'),
  SUPPORTED_CURRENCIES: z.string().default('ILS,USD,GBP,EUR'),

  // Scraping
  SCRAPING_ENABLED: z.coerce.boolean().default(true),
  SCRAPING_PARALLEL_JOBS: z.coerce.number().default(5),
  SCRAPING_RETRY_ATTEMPTS: z.coerce.number().default(3),
  USE_PROXIES: z.coerce.boolean().default(false),
  USE_STEALTH_MODE: z.coerce.boolean().default(true),
  PLAYWRIGHT_HEADLESS: z.coerce.boolean().default(true),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // JWT
  JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Cache
  CACHE_TTL_PRODUCTS: z.coerce.number().default(300),
  CACHE_TTL_SEARCH: z.coerce.number().default(60),
  CACHE_TTL_STATS: z.coerce.number().default(600),

  // Shop Configuration
  SHOP_CONFIG_PATH: z.string().default('./configs/shops'),
  REGION_CONFIG_PATH: z.string().default('./configs/regions'),
});

/**
 * Validated environment variables
 */
export type Environment = z.infer<typeof environmentSchema>;

/**
 * Get validated environment configuration
 * @throws {Error} if environment variables are invalid
 */
export function getEnvironment(): Environment {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Get application metadata
 */
export function getAppMetadata() {
  const env = getEnvironment();
  return {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    environment: env.NODE_ENV,
  };
}
