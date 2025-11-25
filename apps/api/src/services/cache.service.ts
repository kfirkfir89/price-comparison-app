/**
 * Cache Service
 * Redis-based caching for search results and frequently accessed data
 */

import type { FastifyInstance } from "fastify";
import type Redis from "ioredis";
import type {
  LocalSearchRequest,
  GlobalSearchRequest,
} from "@price-comparison/types";

/**
 * Cache key prefixes
 */
const CACHE_PREFIXES = {
  SEARCH_LOCAL: "search:local:",
  SEARCH_GLOBAL: "search:global:",
  PRODUCT: "product:",
  PRODUCT_GROUP: "product-group:",
  STATS: "stats:",
  SHOP: "shop:",
} as const;

/**
 * Cache Service
 * Provides caching functionality using Redis
 */
export class CacheService {
  private fastify: FastifyInstance;
  private redis: Redis;
  private defaultTTL: number;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.redis = fastify.redis;
    this.defaultTTL = fastify.config.cacheTTL.search;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.fastify.log.error({ error, key }, "Cache get error");
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const serialized = JSON.stringify(value);

      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      this.fastify.log.error({ error, key }, "Cache set error");
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.fastify.log.error({ error, key }, "Cache delete error");
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      // Use SCAN to find matching keys (safer than KEYS for large datasets)
      let cursor = "0";
      const keysToDelete: string[] = [];

      do {
        const [newCursor, keys] = await this.redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = newCursor;
        keysToDelete.push(...keys);
      } while (cursor !== "0");

      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
        this.fastify.log.debug(
          { pattern, count: keysToDelete.length },
          "Deleted cache keys",
        );
      }
    } catch (error) {
      this.fastify.log.error({ error, pattern }, "Cache delete pattern error");
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.fastify.log.error({ error, key }, "Cache exists error");
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.fastify.log.error({ error, key }, "Cache TTL error");
      return -1;
    }
  }

  /**
   * Build cache key for local search
   */
  buildSearchCacheKey(
    type: "local" | "global",
    request: LocalSearchRequest | GlobalSearchRequest,
  ): string {
    const prefix =
      type === "local"
        ? CACHE_PREFIXES.SEARCH_LOCAL
        : CACHE_PREFIXES.SEARCH_GLOBAL;

    // Create a deterministic key from request parameters
    const keyParts: string[] = [
      request.query.toLowerCase().trim(),
      `page:${request.page || 1}`,
      `per_page:${request.per_page || 20}`,
      `sort:${request.sort_by || "relevance"}`,
    ];

    // Add country
    if ("country" in request) {
      keyParts.push(`country:${request.country}`);
    }
    if ("user_country" in request) {
      keyParts.push(`country:${request.user_country}`);
    }

    // Add filters if present
    if (request.filters) {
      if (request.filters.min_price !== undefined) {
        keyParts.push(`min_price:${request.filters.min_price}`);
      }
      if (request.filters.max_price !== undefined) {
        keyParts.push(`max_price:${request.filters.max_price}`);
      }
      if (request.filters.in_stock !== undefined) {
        keyParts.push(`in_stock:${request.filters.in_stock}`);
      }
      if (request.filters.shops?.length) {
        keyParts.push(`shops:${request.filters.shops.sort().join(",")}`);
      }
      if (request.filters.categories?.length) {
        keyParts.push(
          `categories:${request.filters.categories.sort().join(",")}`,
        );
      }
      if (request.filters.brands?.length) {
        keyParts.push(`brands:${request.filters.brands.sort().join(",")}`);
      }
      if (request.filters.min_rating !== undefined) {
        keyParts.push(`min_rating:${request.filters.min_rating}`);
      }
    }

    // Hash the key parts for a shorter cache key
    const keyString = keyParts.join("|");
    const hash = this.simpleHash(keyString);

    return `${prefix}${hash}`;
  }

  /**
   * Build cache key for product
   */
  buildProductCacheKey(
    productId: string,
    options?: { includeGroup?: boolean; includeHistory?: boolean },
  ): string {
    const parts = [CACHE_PREFIXES.PRODUCT, productId];

    if (options?.includeGroup) parts.push(":group");
    if (options?.includeHistory) parts.push(":history");

    return parts.join("");
  }

  /**
   * Build cache key for stats
   */
  buildStatsCacheKey(type: "global" | "shops" | "categories"): string {
    return `${CACHE_PREFIXES.STATS}${type}`;
  }

  /**
   * Invalidate all search cache
   */
  async invalidateSearchCache(): Promise<void> {
    await this.deletePattern("search:*");
  }

  /**
   * Invalidate all product cache
   */
  async invalidateProductCache(): Promise<void> {
    await this.deletePattern("product:*");
  }

  /**
   * Invalidate all stats cache
   */
  async invalidateStatsCache(): Promise<void> {
    await this.deletePattern("stats:*");
  }

  /**
   * Simple hash function for cache keys
   * Uses DJB2 algorithm for fast, decent distribution
   */
  private simpleHash(str: string): string {
    let hash = 5381;

    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }

    // Convert to unsigned 32-bit integer and then to hex
    return (hash >>> 0).toString(16);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memoryUsed: string;
    hitRate?: number;
  }> {
    try {
      const info = await this.redis.info("memory");
      const keyCount = await this.redis.dbsize();

      // Parse memory used from INFO output
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsed: string = memoryMatch?.[1] ?? "unknown";

      return {
        keys: keyCount,
        memoryUsed,
      };
    } catch (error) {
      this.fastify.log.error({ error }, "Cache stats error");
      return {
        keys: 0,
        memoryUsed: "unknown",
      };
    }
  }
}
