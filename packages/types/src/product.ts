/**
 * Product type definitions
 * Based on the schema defined in 2.md (lines 257-328)
 */

import { Currency, PriceTrend, ShopType, AvailabilityStatus } from './enums';

/**
 * Shop information for a product listing
 */
export interface ShopInfo {
  /** Shop identifier (e.g., "amazon.com", "ksp.co.il") */
  name: string;
  /** Type of shop - determines display mode and fees */
  type: ShopType;
  /** Shop's base country code */
  country: string;
  /** Countries this shop ships to */
  ships_to: string[];
  /** Whether this shop has multiple sellers (marketplace) */
  is_marketplace: boolean;
  /** Whether this shop ships worldwide */
  global_reach: boolean;
}

/**
 * Base price information
 */
export interface BasePrice {
  /** Price amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Whether tax is included in the base price */
  includes_tax: boolean;
}

/**
 * Shipping cost details
 */
export interface ShippingCost {
  /** Whether shipping is available */
  available: boolean;
  /** Standard shipping cost */
  cost: number;
  /** Express shipping cost (if available) */
  express_cost?: number;
  /** Free shipping threshold (order total needed for free shipping) */
  free_threshold?: number;
  /** Estimated delivery days */
  estimated_days: {
    /** Standard delivery time */
    standard: number;
    /** Express delivery time (if available) */
    express?: number;
  };
}

/**
 * Import and tax fees for international purchases
 */
export interface ImportFees {
  /** Import duty amount */
  import_duty: number;
  /** VAT (Value Added Tax) amount */
  vat: number;
  /** Handling fee */
  handling: number;
  /** Customs clearance fee */
  customs_clearance: number;
}

/**
 * Risk factors for international purchases
 */
export interface PurchaseRisks {
  /** Risk of customs delays */
  customs_delay: boolean;
  /** Whether warranty might be void for international purchase */
  warranty_void: boolean;
  /** Whether returns are difficult from this shop */
  return_difficult: boolean;
}

/**
 * International pricing details
 */
export interface InternationalPricing {
  /** Shipping information */
  shipping: ShippingCost;
  /** Import fees and taxes */
  fees: ImportFees;
  /** Total landed cost (price + shipping + all fees) */
  total_landed_cost: number;
  /** Risk factors */
  risks: PurchaseRisks;
}

/**
 * Complete pricing structure
 */
export interface Pricing {
  /** Base price in original currency */
  base: BasePrice;
  /** Total price for local shopping (no international fees) */
  local_total?: number;
  /** International shopping costs (for global mode) */
  international?: InternationalPricing;
}

/**
 * Recommendation scoring factors
 */
export interface RecommendationFactors {
  /** Price advantage score (0-100) */
  price_advantage: number;
  /** Delivery speed score (0-100) */
  delivery_speed: number;
  /** Seller trust score (0-100) */
  seller_trust: number;
  /** Hassle factor score (0-100, lower is less hassle) */
  hassle_factor: number;
}

/**
 * Smart recommendation metadata
 */
export interface Recommendation {
  /** Overall recommendation score (0-100) */
  score: number;
  /** Individual scoring factors */
  factors: RecommendationFactors;
  /** Last time this recommendation was checked/updated */
  last_checked: Date;
  /** Price trend indicator */
  price_trend: PriceTrend;
}

/**
 * Complete Product interface
 * Represents a single product listing from a specific shop
 */
export interface Product {
  /** MongoDB document ID */
  _id: string;
  /** Product group ID - links similar products from different shops */
  product_group_id: string;

  /** Shop classification and information */
  shop_info: ShopInfo;

  /** Product details */
  name: string;
  /** Product description */
  description?: string;
  /** Product image URL */
  image_url?: string;
  /** Additional image URLs */
  image_urls?: string[];
  /** Product URL at the shop */
  product_url: string;
  /** Product SKU/identifier at the shop */
  sku?: string;
  /** Product brand */
  brand?: string;
  /** Product category */
  category?: string;
  /** Product rating (0-5) */
  rating?: number;
  /** Number of reviews */
  review_count?: number;
  /** Availability status */
  availability: AvailabilityStatus;

  /** Complete pricing structure */
  pricing: Pricing;

  /** Smart recommendation metadata */
  recommendation?: Recommendation;

  /** Timestamps */
  created_at: Date;
  updated_at: Date;
  /** Last time the product was scraped */
  last_scraped_at?: Date;
}

/**
 * Product group - represents the same product across different shops
 */
export interface ProductGroup {
  /** Product group ID */
  _id: string;
  /** Normalized product name */
  normalized_name: string;
  /** Canonical product information */
  canonical_data: {
    name: string;
    brand?: string;
    category?: string;
    image_url?: string;
  };
  /** IDs of products in this group */
  product_ids: string[];
  /** Number of shops offering this product */
  shop_count: number;
  /** Price range across all shops */
  price_range: {
    min: number;
    max: number;
    currency: Currency;
  };
  /** Average rating across all shops */
  average_rating?: number;
  /** Timestamps */
  created_at: Date;
  updated_at: Date;
}

/**
 * Product creation input (for scraping/inserting new products)
 */
export type CreateProductInput = Omit<Product, '_id' | 'created_at' | 'updated_at' | 'last_scraped_at'>;

/**
 * Product update input (for updating existing products)
 */
export type UpdateProductInput = Partial<Omit<Product, '_id' | 'created_at'>>;
