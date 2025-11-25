/**
 * API request and response type definitions
 */

/**
 * Standard API error response
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** HTTP status code */
  status: number;
  /** Additional error details */
  details?: Record<string, any>;
  /** Request ID for debugging */
  request_id?: string;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error information (if success is false) */
  error?: ApiError;
  /** Response metadata */
  meta?: {
    /** Request ID */
    request_id?: string;
    /** Timestamp */
    timestamp: Date;
    /** API version */
    version?: string;
  };
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  per_page?: number;
  /** Maximum items per page allowed */
  max_per_page?: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Service status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Service version */
  version: string;
  /** Uptime in seconds */
  uptime: number;
  /** Timestamp */
  timestamp: Date;
  /** Individual service checks */
  checks: {
    /** Database connectivity */
    database?: {
      status: "up" | "down";
      latency_ms?: number;
    };
    /** Redis cache */
    redis?: {
      status: "up" | "down";
      latency_ms?: number;
    };
    /** Meilisearch */
    meilisearch?: {
      status: "up" | "down";
      latency_ms?: number;
    };
    /** Qdrant */
    qdrant?: {
      status: "up" | "down";
      latency_ms?: number;
    };
    /** RabbitMQ */
    rabbitmq?: {
      status: "up" | "down";
      latency_ms?: number;
    };
  };
}

/**
 * Stats response
 */
export interface StatsResponse {
  /** Total number of products in database */
  total_products: number;
  /** Number of unique shops */
  total_shops: number;
  /** Number of active shops */
  active_shops: number;
  /** Products by shop type */
  products_by_type: {
    local: number;
    global: number;
  };
  /** Last update timestamp */
  last_updated: Date;
  /** Additional statistics */
  additional?: Record<string, any>;
}

/**
 * Product detail request parameters
 */
export interface ProductDetailParams {
  /** Product ID */
  id: string;
  /** User's country (for price calculations) */
  user_country?: string;
  /** Include similar products */
  include_similar?: boolean;
  /** Include price history */
  include_history?: boolean;
}

/**
 * Product comparison request
 */
export interface ProductComparisonRequest {
  /** Product IDs to compare */
  product_ids: string[];
  /** Maximum number of products to compare */
  max_products?: number;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  /** Maximum requests allowed */
  limit: number;
  /** Remaining requests */
  remaining: number;
  /** Time until reset (seconds) */
  reset_in: number;
  /** Reset timestamp */
  reset_at: Date;
}

/**
 * API request headers
 */
export interface ApiHeaders {
  /** Authorization token */
  authorization?: string;
  /** Content type */
  "content-type"?: string;
  /** User agent */
  "user-agent"?: string;
  /** Request ID */
  "x-request-id"?: string;
  /** API version */
  "x-api-version"?: string;
}

/**
 * Batch operation request
 */
export interface BatchRequest<T> {
  /** Array of operations */
  operations: T[];
  /** Maximum batch size */
  max_batch_size?: number;
  /** Whether to stop on first error */
  stop_on_error?: boolean;
}

/**
 * Batch operation response
 */
export interface BatchResponse<T> {
  /** Successful operations */
  successful: T[];
  /** Failed operations with errors */
  failed: Array<{
    operation: T;
    error: ApiError;
  }>;
  /** Summary */
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
