/**
 * Shop and shop configuration type definitions
 */

import { Currency, Country, ShopType, ScraperType } from './enums';

/**
 * Shop configuration from YAML files
 * Used to configure scrapers and shop behavior
 */
export interface ShopConfig {
  /** Unique shop identifier (e.g., "ksp", "amazon_com") */
  id: string;
  /** Display name */
  name: string;
  /** Base URL of the shop */
  url: string;
  /** Shop's base country */
  country: Country;
  /** Shop's primary currency */
  currency: Currency;
  /** Shop type (local or global) */
  type: ShopType;
  /** Whether this shop is currently enabled for scraping */
  enabled: boolean;
  /** Scraper type to use */
  scraper: ScraperType;
  /** Rate limit (requests per second) */
  rate_limit: number;
  /** Countries this shop ships to (for global shops) */
  ships_to?: Country[];
  /** Shipping configuration */
  shipping?: {
    /** Countries eligible for shipping */
    countries: Country[];
    /** Average delivery days by country */
    delivery_days?: Record<Country, number>;
    /** Free shipping threshold by currency */
    free_threshold?: Record<Currency, number>;
  };
  /** Import rules for international shipping */
  import_rules?: {
    /** Import duty rates by category */
    duty_rates?: Record<string, number>;
    /** Tax rates */
    tax_rate?: number;
    /** Import duty threshold (amount below which no duty is charged) */
    duty_threshold?: number;
  };
  /** Custom scraper configuration */
  scraper_config?: {
    /** CSS selectors for product data */
    selectors?: Record<string, string>;
    /** Whether to use JavaScript rendering */
    requires_js?: boolean;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Login required */
    requires_login?: boolean;
  };
  /** API configuration (if shop has an API) */
  api_config?: {
    /** API key */
    api_key?: string;
    /** API endpoint */
    endpoint?: string;
    /** Rate limit for API */
    rate_limit?: number;
  };
}

/**
 * Shop statistics and metadata
 */
export interface ShopMetadata {
  /** Shop ID */
  shop_id: string;
  /** Total products from this shop */
  product_count: number;
  /** Last successful scrape */
  last_scraped: Date;
  /** Scraping success rate (0-1) */
  success_rate: number;
  /** Average price compared to market */
  price_competitiveness?: number;
  /** Shop reliability score (0-100) */
  reliability_score?: number;
  /** Active status */
  is_active: boolean;
}

/**
 * Shop category configuration
 */
export interface ShopCategory {
  /** Category ID */
  id: string;
  /** Category name */
  name: string;
  /** URL path for this category */
  url_path?: string;
  /** CSS selector for category page */
  selector?: string;
  /** Parent category ID */
  parent_id?: string;
}

/**
 * Regional shop lists
 * Groups shops by country/region
 */
export interface RegionalShops {
  /** Country code */
  country: Country;
  /** List of shop IDs available in this country */
  local_shops: string[];
  /** List of global shops that ship to this country */
  global_shops: string[];
}
