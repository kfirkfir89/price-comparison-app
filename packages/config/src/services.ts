/**
 * Service URLs and ports configuration
 */

import { getEnvironment } from "./environment";

/**
 * Service endpoint configuration
 */
export interface ServiceEndpoint {
  host: string;
  port: number;
  url: string;
}

/**
 * All service endpoints
 */
export interface ServiceEndpoints {
  web: ServiceEndpoint;
  api: ServiceEndpoint;
  scraper: ServiceEndpoint;
  normalizer: ServiceEndpoint;
  search: ServiceEndpoint;
  recommendation: ServiceEndpoint;
}

/**
 * Get service endpoints configuration
 */
export function getServiceEndpoints(): ServiceEndpoints {
  const env = getEnvironment();
  const host = "localhost"; // TODO: Make this configurable for production

  return {
    web: {
      host,
      port: env.WEB_PORT,
      url: `http://${host}:${env.WEB_PORT}`,
    },
    api: {
      host,
      port: env.API_PORT,
      url: `http://${host}:${env.API_PORT}`,
    },
    scraper: {
      host,
      port: env.SCRAPER_PORT,
      url: `http://${host}:${env.SCRAPER_PORT}`,
    },
    normalizer: {
      host,
      port: env.NORMALIZER_PORT,
      url: `http://${host}:${env.NORMALIZER_PORT}`,
    },
    search: {
      host,
      port: env.SEARCH_PORT,
      url: `http://${host}:${env.SEARCH_PORT}`,
    },
    recommendation: {
      host,
      port: env.RECOMMENDATION_PORT,
      url: `http://${host}:${env.RECOMMENDATION_PORT}`,
    },
  };
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  return getServiceEndpoints().api.url;
}

/**
 * Get Web app URL
 */
export function getWebAppUrl(): string {
  return getServiceEndpoints().web.url;
}

/**
 * Get service URL by name
 */
export function getServiceUrl(service: keyof ServiceEndpoints): string {
  return getServiceEndpoints()[service].url;
}

/**
 * API route paths
 */
export const API_ROUTES = {
  // Health check
  HEALTH: "/health",

  // Search
  SEARCH_LOCAL: "/api/v1/search/local",
  SEARCH_GLOBAL: "/api/v1/search/global",
  AUTOCOMPLETE: "/api/v1/search/autocomplete",

  // Products
  PRODUCTS: "/api/v1/products",
  PRODUCT_DETAIL: "/api/v1/products/:id",
  PRODUCT_COMPARE: "/api/v1/products/compare",

  // Stats
  STATS: "/api/v1/stats",
  STATS_GLOBAL_PRODUCTS: "/api/v1/stats/global-products",

  // Recommendations
  RECOMMENDATIONS: "/api/v1/recommendations/deals",

  // User preferences
  USER_PREFERENCES: "/api/v1/user/preferences",
  USER_MODE: "/api/v1/user/preferences/mode",

  // Authentication (when enabled)
  AUTH_LOGIN: "/api/v1/auth/login",
  AUTH_REGISTER: "/api/v1/auth/register",
  AUTH_REFRESH: "/api/v1/auth/refresh",
  AUTH_LOGOUT: "/api/v1/auth/logout",
} as const;

/**
 * Build full API URL
 */
export function buildApiUrl(
  route: string,
  params?: Record<string, string>,
): string {
  const baseUrl = getApiBaseUrl();
  let path = route;

  // Replace route parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }

  return `${baseUrl}${path}`;
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  origin: string | string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

/**
 * Get CORS configuration
 */
export function getCORSConfig(): CORSConfig {
  const env = getEnvironment();

  return {
    origin: env.CORS_ORIGIN.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  };
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig(): RateLimitConfig {
  const env = getEnvironment();

  return {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  };
}

/**
 * JWT configuration
 */
export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

/**
 * Get JWT configuration
 */
export function getJWTConfig(): JWTConfig {
  const env = getEnvironment();

  return {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  };
}
