/**
 * Currency utilities and helpers
 */

import { Currency } from '@price-comparison/types';

/**
 * Currency symbols map
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.ILS]: '₪',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£',
};

/**
 * Currency names map
 */
export const CURRENCY_NAMES: Record<Currency, string> = {
  [Currency.ILS]: 'Israeli Shekel',
  [Currency.USD]: 'US Dollar',
  [Currency.EUR]: 'Euro',
  [Currency.GBP]: 'British Pound',
};

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: Currency): string {
  return CURRENCY_NAMES[currency] || currency;
}

/**
 * Exchange rates (mock data - in production, fetch from API)
 * Base currency: USD
 */
export const EXCHANGE_RATES: Record<Currency, number> = {
  [Currency.USD]: 1,
  [Currency.ILS]: 3.73, // 1 USD = 3.73 ILS
  [Currency.EUR]: 0.92, // 1 USD = 0.92 EUR
  [Currency.GBP]: 0.79, // 1 USD = 0.79 GBP
};

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first (base currency)
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];

  // Convert from USD to target currency
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  return EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency];
}

/**
 * Format currency amount with symbol
 */
export function formatCurrencyAmount(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // For ILS and USD, symbol goes before the amount
  // For EUR and GBP, symbol can go after (but we'll use before for consistency)
  return `${symbol}${formattedAmount}`;
}

/**
 * Parse currency string to number
 * Removes currency symbols and formatting
 */
export function parseCurrencyString(currencyString: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const cleanedString = currencyString.replace(/[^0-9.-]/g, '');
  return parseFloat(cleanedString) || 0;
}

/**
 * Check if currency is supported
 */
export function isSupportedCurrency(currency: string): currency is Currency {
  return Object.values(Currency).includes(currency as Currency);
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.values(Currency);
}
