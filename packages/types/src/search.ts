/**
 * Search request and response type definitions
 */

import {
  Currency,
  Country,
  ShoppingMode,
  SortBy,
  AvailabilityStatus,
} from "./enums";
import { Product, ProductGroup } from "./product";

/**
 * Search filters
 */
export interface SearchFilters {
  /** Minimum price */
  min_price?: number;
  /** Maximum price */
  max_price?: number;
  /** Filter by availability */
  in_stock?: boolean;
  /** Filter by specific shops */
  shops?: string[];
  /** Filter by categories */
  categories?: string[];
  /** Filter by brands */
  brands?: string[];
  /** Minimum rating (0-5) */
  min_rating?: number;
  /** Availability status filter */
  availability?: AvailabilityStatus[];
  /** Filter by country (for local mode) */
  country?: Country;
}

/**
 * Search request for local shopping mode
 */
export interface LocalSearchRequest {
  /** Search query */
  query: string;
  /** Filters */
  filters?: SearchFilters;
  /** Sort order */
  sort_by?: SortBy;
  /** Page number (1-indexed) */
  page?: number;
  /** Results per page */
  per_page?: number;
  /** User's country */
  country: Country;
  /** Whether to check international prices in background */
  check_international?: boolean;
}

/**
 * Search request for global shopping mode
 */
export interface GlobalSearchRequest {
  /** Search query */
  query: string;
  /** Filters */
  filters?: SearchFilters;
  /** Sort order */
  sort_by?: SortBy;
  /** Page number (1-indexed) */
  page?: number;
  /** Results per page */
  per_page?: number;
  /** User's country (for shipping calculation) */
  user_country: Country;
  /** Include shipping costs in total */
  include_shipping: boolean;
  /** Include all fees (duties, VAT) in total */
  include_all_fees: boolean;
  /** Minimum seller rating */
  min_seller_rating?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page */
  current_page: number;
  /** Total number of pages */
  total_pages: number;
  /** Results per page */
  per_page: number;
  /** Total number of results */
  total_results: number;
  /** Whether there's a next page */
  has_next: boolean;
  /** Whether there's a previous page */
  has_prev: boolean;
}

/**
 * Smart deal suggestion
 * Shows when international option is significantly cheaper
 */
export interface SmartDeal {
  /** Whether a smart deal is available */
  available: boolean;
  /** Display message */
  message?: string;
  /** Deal summary */
  summary?: {
    /** Best local price */
    best_local: number;
    /** Best international price (including all fees) */
    best_international: number;
    /** Savings amount */
    savings: number;
    /** Savings percentage */
    savings_percent: number;
    /** Extra delivery days compared to local */
    delivery_difference: number;
    /** Shop offering the international deal */
    shop: string;
    /** Shop country */
    country: string;
  };
  /** Detailed product information */
  product?: Product;
}

/**
 * Local search response
 */
export interface LocalSearchResponse {
  /** Search results (products from local shops) */
  results: Product[];
  /** Pagination metadata */
  pagination: PaginationMeta;
  /** Smart deal notification (if significant international savings detected) */
  smart_deal?: SmartDeal;
  /** Search query */
  query: string;
  /** Filters applied */
  filters: SearchFilters;
  /** Search execution time (ms) */
  took_ms: number;
}

/**
 * Global search response
 */
export interface GlobalSearchResponse {
  /** Search results (products from global retailers) */
  results: Product[];
  /** Pagination metadata */
  pagination: PaginationMeta;
  /** Search query */
  query: string;
  /** Filters applied */
  filters: SearchFilters;
  /** Search execution time (ms) */
  took_ms: number;
}

/**
 * Unified search request (supports both modes)
 */
export interface SearchRequest {
  /** Search query */
  query: string;
  /** Shopping mode */
  mode: ShoppingMode;
  /** Filters */
  filters?: SearchFilters;
  /** Sort order */
  sort_by?: SortBy;
  /** Page number */
  page?: number;
  /** Results per page */
  per_page?: number;
  /** User's country */
  user_country: Country;
  /** User's preferred currency */
  preferred_currency?: Currency;
}

/**
 * Unified search response
 */
export interface SearchResponse {
  /** Search results */
  results: Product[] | ProductGroup[];
  /** Pagination metadata */
  pagination: PaginationMeta;
  /** Smart deal (for local mode only) */
  smart_deal?: SmartDeal;
  /** Search metadata */
  metadata: {
    query: string;
    mode: ShoppingMode;
    filters: SearchFilters;
    took_ms: number;
  };
}

/**
 * Search suggestions/autocomplete
 */
export interface SearchSuggestion {
  /** Suggestion text */
  text: string;
  /** Suggestion type */
  type: "product" | "category" | "brand" | "shop";
  /** Number of results for this suggestion */
  count?: number;
  /** Highlighted text (with query match) */
  highlighted?: string;
}

/**
 * Autocomplete response
 */
export interface AutocompleteResponse {
  /** Search suggestions */
  suggestions: SearchSuggestion[];
  /** Query used */
  query: string;
}
