/**
 * Database connection configurations
 */

import { getEnvironment } from './environment';

export interface MongoDBConfig {
  uri: string;
  username: string;
  password: string;
  database: string;
  authSource: string;
  options: {
    maxPoolSize: number;
    minPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    family: number;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryStrategy?: (times: number) => number | void;
}

export interface MeilisearchConfig {
  host: string;
  apiKey: string;
  indexes: {
    products: string;
    shops: string;
  };
}

export interface QdrantConfig {
  host: string;
  port: number;
  grpcPort: number;
  apiKey?: string;
  collections: {
    products: string;
    embeddings: string;
  };
}

export interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
  queues: {
    scraping: string;
    normalization: string;
    indexing: string;
    recommendations: string;
  };
}

export function getMongoDBConfig(): MongoDBConfig {
  const env = getEnvironment();

  return {
    uri: env.MONGODB_URI,
    username: env.MONGODB_USERNAME,
    password: env.MONGODB_PASSWORD,
    database: env.MONGODB_DATABASE,
    authSource: env.MONGODB_AUTH_SOURCE,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    },
  };
}

export function getMongoDBConnectionString(): string {
  const config = getMongoDBConfig();
  const { uri, username, password, database, authSource } = config;

  if (!username || !password) {
    return `${uri}/${database}`;
  }

  // Format: mongodb://username:password@host:port/database?authSource=admin
  const url = new URL(uri);
  return `mongodb://${username}:${password}@${url.host}/${database}?authSource=${authSource}`;
}

export function getRedisConfig(): RedisConfig {
  const env = getEnvironment();

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
    retryStrategy: (times: number) => {
      // Reconnect after a delay that increases with each attempt
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };
}

export function getMeilisearchConfig(): MeilisearchConfig {
  const env = getEnvironment();

  return {
    host: env.MEILISEARCH_HOST,
    apiKey: env.MEILISEARCH_MASTER_KEY,
    indexes: {
      products: 'products',
      shops: 'shops',
    },
  };
}

export function getQdrantConfig(): QdrantConfig {
  const env = getEnvironment();

  return {
    host: env.QDRANT_HOST,
    port: env.QDRANT_PORT,
    grpcPort: env.QDRANT_GRPC_PORT,
    apiKey: env.QDRANT_API_KEY,
    collections: {
      products: 'products',
      embeddings: 'product_embeddings',
    },
  };
}

export function getRabbitMQConfig(): RabbitMQConfig {
  const env = getEnvironment();

  return {
    host: env.RABBITMQ_HOST,
    port: env.RABBITMQ_PORT,
    username: env.RABBITMQ_USERNAME,
    password: env.RABBITMQ_PASSWORD,
    vhost: '/',
    queues: {
      scraping: 'scraping_tasks',
      normalization: 'normalization_tasks',
      indexing: 'indexing_tasks',
      recommendations: 'recommendation_tasks',
    },
  };
}

export function getRabbitMQConnectionString(): string {
  const config = getRabbitMQConfig();
  const { username, password, host, port, vhost } = config;

  return `amqp://${username}:${password}@${host}:${port}${vhost}`;
}

export interface CacheTTLConfig {
  products: number;
  search: number;
  stats: number;
  shopConfig: number;
}

/**
 * Get cache TTL(Time To Live) configuration
 */
export function getCacheTTLConfig(): CacheTTLConfig {
  const env = getEnvironment();

  return {
    products: env.CACHE_TTL_PRODUCTS,
    search: env.CACHE_TTL_SEARCH,
    stats: env.CACHE_TTL_STATS,
    shopConfig: 3600, // 1 hour for shop configs
  };
}
