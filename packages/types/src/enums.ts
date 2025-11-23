/**
 * Shared enumerations for the price comparison platform
 */

/**
 * Type of shop - determines display mode and shipping rules
 */
export enum ShopType {
  /** Local shop in user's country - fast delivery, no import fees */
  LOCAL = 'local',
  /** Global retailer - international shipping, may have import fees */
  GLOBAL = 'global',
}

/**
 * Shopping mode for the user interface
 */
export enum ShoppingMode {
  /** Show only local shops (default) */
  LOCAL = 'local',
  /** Show only global/international retailers */
  GLOBAL = 'global',
}

/**
 * Supported currencies
 */
export enum Currency {
  /** Israeli Shekel */
  ILS = 'ILS',
  /** US Dollar */
  USD = 'USD',
  /** Euro */
  EUR = 'EUR',
  /** British Pound */
  GBP = 'GBP',
}

/**
 * Supported countries for regional configuration
 */
export enum Country {
  /** Israel */
  IL = 'IL',
  /** United States */
  US = 'US',
  /** United Kingdom */
  UK = 'UK',
  /** Germany */
  DE = 'DE',
  /** France */
  FR = 'FR',
}

/**
 * Price trend indicators
 */
export enum PriceTrend {
  /** Price is increasing */
  RISING = 'rising',
  /** Price is decreasing */
  FALLING = 'falling',
  /** Price is stable */
  STABLE = 'stable',
}

/**
 * Scraper type for different scraping strategies
 */
export enum ScraperType {
  /** Use Playwright headless browser */
  PLAYWRIGHT = 'playwright',
  /** Use simple HTTP requests + BeautifulSoup */
  SIMPLE = 'simple',
  /** Use Scrapy framework */
  SCRAPY = 'scrapy',
}

/**
 * Product availability status
 */
export enum AvailabilityStatus {
  /** Product is in stock */
  IN_STOCK = 'in_stock',
  /** Product is out of stock */
  OUT_OF_STOCK = 'out_of_stock',
  /** Low stock remaining */
  LOW_STOCK = 'low_stock',
  /** Pre-order available */
  PRE_ORDER = 'pre_order',
  /** Unknown availability */
  UNKNOWN = 'unknown',
}

/**
 * Sort options for product search results
 */
export enum SortBy {
  /** Sort by relevance score (default) */
  RELEVANCE = 'relevance',
  /** Sort by price ascending */
  PRICE_ASC = 'price_asc',
  /** Sort by price descending */
  PRICE_DESC = 'price_desc',
  /** Sort by rating */
  RATING = 'rating',
  /** Sort by newest first */
  NEWEST = 'newest',
}
