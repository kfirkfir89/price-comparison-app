/**
 * Price formatting and calculation utilities
 */

import { Currency } from "@price-comparison/types";
import { convertCurrency, formatCurrencyAmount } from "./currency";

/**
 * Format price with currency symbol
 */
export function formatPrice(
  amount: number,
  currency: Currency,
  showDecimals = true,
): string {
  const roundedAmount = showDecimals
    ? Math.round(amount * 100) / 100
    : Math.round(amount);
  return formatCurrencyAmount(roundedAmount, currency);
}

/**
 * Format price range
 */
export function formatPriceRange(
  min: number,
  max: number,
  currency: Currency,
): string {
  if (min === max) {
    return formatPrice(min, currency);
  }
  return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
}

/**
 * Calculate savings amount
 */
export function calculateSavings(
  originalPrice: number,
  discountedPrice: number,
): number {
  return Math.max(0, originalPrice - discountedPrice);
}

/**
 * Calculate savings percentage
 */
export function calculateSavingsPercentage(
  originalPrice: number,
  discountedPrice: number,
): number {
  if (originalPrice <= 0) {
    return 0;
  }

  const savings = calculateSavings(originalPrice, discountedPrice);
  return Math.round((savings / originalPrice) * 100);
}

/**
 * Format savings display
 */
export function formatSavings(
  originalPrice: number,
  discountedPrice: number,
  currency: Currency,
): string {
  const savings = calculateSavings(originalPrice, discountedPrice);
  const percentage = calculateSavingsPercentage(originalPrice, discountedPrice);

  if (savings === 0) {
    return "";
  }

  return `Save ${formatPrice(savings, currency)} (${percentage}%)`;
}

/**
 * Compare prices and return the best (lowest) price
 */
export function getBestPrice(prices: number[]): number | null {
  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices.filter((p) => p > 0));
}

/**
 * Calculate price difference
 */
export function calculatePriceDifference(
  price1: number,
  price2: number,
): number {
  return Math.abs(price1 - price2);
}

/**
 * Check if price difference is significant (> threshold)
 */
export function isSignificantPriceDifference(
  price1: number,
  price2: number,
  thresholdPercent = 5,
): boolean {
  const difference = calculatePriceDifference(price1, price2);
  const basePrice = Math.min(price1, price2);

  if (basePrice === 0) {
    return false;
  }

  const percentDifference = (difference / basePrice) * 100;
  return percentDifference >= thresholdPercent;
}

/**
 * Round price to nearest increment
 */
export function roundPrice(price: number, increment = 1): number {
  return Math.round(price / increment) * increment;
}

/**
 * Format price for display with optional discount badge
 */
export interface PriceDisplayOptions {
  amount: number;
  currency: Currency;
  originalAmount?: number;
  showSavings?: boolean;
}

export function formatPriceDisplay(options: PriceDisplayOptions): {
  displayPrice: string;
  originalPrice?: string;
  savings?: string;
  savingsPercent?: number;
} {
  const { amount, currency, originalAmount, showSavings } = options;

  const result: ReturnType<typeof formatPriceDisplay> = {
    displayPrice: formatPrice(amount, currency),
  };

  if (originalAmount && originalAmount > amount && showSavings) {
    result.originalPrice = formatPrice(originalAmount, currency);
    result.savings = formatPrice(
      calculateSavings(originalAmount, amount),
      currency,
    );
    result.savingsPercent = calculateSavingsPercentage(originalAmount, amount);
  }

  return result;
}

/**
 * Calculate price per unit
 */
export function calculatePricePerUnit(
  totalPrice: number,
  quantity: number,
): number {
  if (quantity <= 0) {
    return totalPrice;
  }

  return totalPrice / quantity;
}

/**
 * Compare prices across currencies
 */
export function comparePricesAcrossCurrencies(
  price1: number,
  currency1: Currency,
  price2: number,
  currency2: Currency,
): number {
  // Convert both prices to USD for comparison
  const price1InUSD = convertCurrency(price1, currency1, Currency.USD);
  const price2InUSD = convertCurrency(price2, currency2, Currency.USD);

  return price1InUSD - price2InUSD;
}

/**
 * Get cheapest price from a list with different currencies
 */
export function getCheapestPrice(
  prices: Array<{ amount: number; currency: Currency }>,
): { amount: number; currency: Currency } | null {
  if (prices.length === 0) {
    return null;
  }

  return prices.reduce((cheapest, current) => {
    const comparison = comparePricesAcrossCurrencies(
      current.amount,
      current.currency,
      cheapest.amount,
      cheapest.currency,
    );

    return comparison < 0 ? current : cheapest;
  });
}
