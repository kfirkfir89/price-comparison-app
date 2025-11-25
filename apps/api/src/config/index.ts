/**
 * API Gateway Configuration
 * Centralizes all configuration loading using @price-comparison/config
 */

import {
  getEnvironment,
  getMongoDBConfig,
  getMongoDBConnectionString,
  getRedisConfig,
  getMeilisearchConfig,
  getQdrantConfig,
  getCacheTTLConfig,
  getCORSConfig,
  getRateLimitConfig,
  getJWTConfig,
  getServiceEndpoints,
  API_ROUTES,
  isProduction,
  isDevelopment,
  type Environment,
  type MongoDBConfig,
  type RedisConfig,
  type MeilisearchConfig,
  type QdrantConfig,
  type CacheTTLConfig,
  type CORSConfig,
  type RateLimitConfig,
  type JWTConfig,
  type ServiceEndpoints,
} from "@price-comparison/config";

/**
 * Unified configuration object for the API Gateway
 */
export interface ApiConfig {
  env: Environment;
  mongodb: MongoDBConfig;
  mongodbUri: string;
  redis: RedisConfig;
  meilisearch: MeilisearchConfig;
  qdrant: QdrantConfig;
  cacheTTL: CacheTTLConfig;
  cors: CORSConfig;
  rateLimit: RateLimitConfig;
  jwt: JWTConfig;
  services: ServiceEndpoints;
  isProduction: boolean;
  isDevelopment: boolean;
  /** Use mock data instead of real database (for development) */
  useMockData: boolean;
}

/**
 * Load and validate all configuration
 * @throws {Error} if environment variables are invalid
 */
export function loadConfig(): ApiConfig {
  const env = getEnvironment();

  // Check if mock data should be used (default: true in development if USE_MOCK_DATA not explicitly set to 'false')
  const useMockData = process.env.USE_MOCK_DATA !== 'false' && isDevelopment();

  return {
    env,
    mongodb: getMongoDBConfig(),
    mongodbUri: getMongoDBConnectionString(),
    redis: getRedisConfig(),
    meilisearch: getMeilisearchConfig(),
    qdrant: getQdrantConfig(),
    cacheTTL: getCacheTTLConfig(),
    cors: getCORSConfig(),
    rateLimit: getRateLimitConfig(),
    jwt: getJWTConfig(),
    services: getServiceEndpoints(),
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    useMockData,
  };
}

// Re-export commonly used items
export { API_ROUTES };
export type {
  Environment,
  MongoDBConfig,
  RedisConfig,
  MeilisearchConfig,
  QdrantConfig,
  CacheTTLConfig,
  CORSConfig,
  RateLimitConfig,
  JWTConfig,
  ServiceEndpoints,
};
