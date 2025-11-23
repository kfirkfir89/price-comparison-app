/**
 * User preferences and behavior type definitions
 * Based on schema from 2.md (lines 332-391)
 */

import { Currency, Country, ShoppingMode } from './enums';

/**
 * Smart deal preferences
 */
export interface SmartDealPreferences {
  /** Whether smart deal suggestions are enabled */
  enabled: boolean;
  /** Minimum savings amount to show suggestion */
  min_savings: number;
  /** Maximum delivery days willing to wait */
  max_delivery_days: number;
  /** Products user has dismissed */
  dismissed_products: Array<{
    product_id: string;
    dismissed_at: Date;
    reason?: string;
  }>;
}

/**
 * Global shopping preferences
 */
export interface GlobalShoppingPreferences {
  /** Preferred global retailers */
  preferred_retailers: string[];
  /** Retailers to exclude from results */
  exclude_retailers: string[];
  /** Maximum shipping cost willing to pay */
  max_shipping_cost?: number;
  /** Whether to include duties in sort calculations */
  include_duties_in_sort: boolean;
}

/**
 * Notification/alert preferences
 */
export interface AlertPreferences {
  /** Price drop alerts */
  price_drops: boolean;
  /** International deal alerts */
  international_deals: boolean;
  /** Back in stock alerts */
  back_in_stock: boolean;
}

/**
 * User shopping preferences
 */
export interface UserPreferences {
  /** Default shopping mode */
  default_mode: ShoppingMode;
  /** User's country */
  country: Country;
  /** Preferred display currency */
  currency: Currency;
  /** Preferred language */
  language: string;
  /** Smart deal preferences */
  smart_deals: SmartDealPreferences;
  /** Global shopping preferences */
  global_shopping: GlobalShoppingPreferences;
  /** Notification preferences */
  alerts: AlertPreferences;
}

/**
 * User search history entry
 */
export interface SearchHistoryEntry {
  /** Search query */
  query: string;
  /** Shopping mode used */
  mode: ShoppingMode;
  /** Timestamp */
  timestamp: Date;
}

/**
 * International purchase record
 */
export interface InternationalPurchase {
  /** Product identifier */
  product: string;
  /** Amount saved compared to local */
  saved_amount: number;
  /** Retailer used */
  retailer: string;
  /** Purchase date */
  date: Date;
}

/**
 * User behavior analytics
 */
export interface UserBehavior {
  /** Search history */
  searches: SearchHistoryEntry[];
  /** International purchases made */
  international_purchases: InternationalPurchase[];
  /** Average savings achieved */
  average_savings: number;
  /** Preferred product categories */
  preferred_categories: string[];
}

/**
 * Complete user profile
 */
export interface UserProfile {
  /** User ID */
  _id: string;
  /** User ID reference */
  user_id: string;
  /** User email */
  email?: string;
  /** User name */
  name?: string;
  /** Shopping preferences */
  preferences: UserPreferences;
  /** Usage analytics */
  behavior?: UserBehavior;
  /** Account created timestamp */
  created_at: Date;
  /** Last updated timestamp */
  updated_at: Date;
  /** Last active timestamp */
  last_active?: Date;
}

/**
 * User preferences update input
 */
export type UpdateUserPreferencesInput = Partial<UserPreferences>;

/**
 * User registration input
 */
export interface UserRegistrationInput {
  email: string;
  password: string;
  name?: string;
  country: Country;
  currency?: Currency;
  language?: string;
}

/**
 * User login input
 */
export interface UserLoginInput {
  email: string;
  password: string;
}

/**
 * Authentication token response
 */
export interface AuthTokenResponse {
  /** Access token */
  access_token: string;
  /** Refresh token */
  refresh_token: string;
  /** Token type (usually "Bearer") */
  token_type: string;
  /** Expiration time in seconds */
  expires_in: number;
}
