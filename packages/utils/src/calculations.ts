/**
 * Calculation utilities for shipping, duties, and total costs
 */

import { Currency } from '@price-comparison/types';
import { convertCurrency } from './currency';

/**
 * Calculate VAT (Value Added Tax)
 * @param basePrice Base price before tax
 * @param vatRate VAT rate (e.g., 0.17 for 17%)
 */
export function calculateVAT(basePrice: number, vatRate: number): number {
  return Math.round(basePrice * vatRate * 100) / 100;
}

/**
 * Calculate price including VAT
 */
export function calculatePriceWithVAT(basePrice: number, vatRate: number): number {
  return basePrice + calculateVAT(basePrice, vatRate);
}

/**
 * Calculate price excluding VAT
 */
export function calculatePriceWithoutVAT(priceWithVAT: number, vatRate: number): number {
  return Math.round((priceWithVAT / (1 + vatRate)) * 100) / 100;
}

/**
 * Calculate import duty
 * @param basePrice Product price in USD
 * @param dutyRate Duty rate (e.g., 0.05 for 5%)
 * @param dutyThreshold Threshold below which no duty is charged (in USD)
 */
export function calculateImportDuty(
  basePrice: number,
  dutyRate: number,
  dutyThreshold = 75
): number {
  if (basePrice < dutyThreshold) {
    return 0;
  }

  return Math.round(basePrice * dutyRate * 100) / 100;
}

/**
 * Calculate shipping cost based on weight and destination
 * @param weightKg Weight in kilograms
 * @param baseRate Base rate per kg
 * @param fixedCost Fixed handling cost
 */
export function calculateShippingCost(
  weightKg: number,
  baseRate: number,
  fixedCost = 5
): number {
  return Math.round((weightKg * baseRate + fixedCost) * 100) / 100;
}

/**
 * Calculate total landed cost for international purchase
 */
export interface LandedCostInput {
  basePrice: number;
  baseCurrency: Currency;
  targetCurrency: Currency;
  shippingCost: number;
  dutyRate: number;
  dutyThreshold?: number;
  vatRate: number;
  handlingFee?: number;
  customsClearanceFee?: number;
}

export interface LandedCostBreakdown {
  basePrice: number;
  basePriceConverted: number;
  shipping: number;
  importDuty: number;
  vat: number;
  handlingFee: number;
  customsClearanceFee: number;
  totalCost: number;
  currency: Currency;
}

export function calculateLandedCost(input: LandedCostInput): LandedCostBreakdown {
  const {
    basePrice,
    baseCurrency,
    targetCurrency,
    shippingCost,
    dutyRate,
    dutyThreshold = 75,
    vatRate,
    handlingFee = 0,
    customsClearanceFee = 0,
  } = input;

  // Convert base price to target currency
  const basePriceConverted = convertCurrency(basePrice, baseCurrency, targetCurrency);

  // Calculate import duty (based on USD value)
  const basePriceInUSD = convertCurrency(basePrice, baseCurrency, Currency.USD);
  const importDutyUSD = calculateImportDuty(basePriceInUSD, dutyRate, dutyThreshold);
  const importDuty = convertCurrency(importDutyUSD, Currency.USD, targetCurrency);

  // Subtotal before VAT (price + shipping + duty + fees)
  const subtotal = basePriceConverted + shippingCost + importDuty + handlingFee + customsClearanceFee;

  // Calculate VAT on subtotal
  const vat = calculateVAT(subtotal, vatRate);

  // Total landed cost
  const totalCost = subtotal + vat;

  return {
    basePrice,
    basePriceConverted: Math.round(basePriceConverted * 100) / 100,
    shipping: Math.round(shippingCost * 100) / 100,
    importDuty: Math.round(importDuty * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    handlingFee: Math.round(handlingFee * 100) / 100,
    customsClearanceFee: Math.round(customsClearanceFee * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    currency: targetCurrency,
  };
}

/**
 * Calculate discount percentage from original and sale price
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0) {
    return 0;
  }

  const discount = ((originalPrice - salePrice) / originalPrice) * 100;
  return Math.max(0, Math.round(discount));
}

/**
 * Calculate final price after discount
 */
export function applyDiscount(price: number, discountPercent: number): number {
  const discount = (price * discountPercent) / 100;
  return Math.round((price - discount) * 100) / 100;
}

/**
 * Calculate recommendation score
 */
export interface RecommendationScoreInput {
  priceAdvantage: number; // 0-100
  deliverySpeed: number; // 0-100
  sellerTrust: number; // 0-100
  hassleFactor: number; // 0-100 (lower is better)
  weights?: {
    price?: number;
    delivery?: number;
    trust?: number;
    hassle?: number;
  };
}

export function calculateRecommendationScore(input: RecommendationScoreInput): number {
  const {
    priceAdvantage,
    deliverySpeed,
    sellerTrust,
    hassleFactor,
    weights = {
      price: 0.4,
      delivery: 0.2,
      trust: 0.2,
      hassle: 0.2,
    },
  } = input;

  // Invert hassle factor (lower is better)
  const invertedHassle = 100 - hassleFactor;

  const score =
    priceAdvantage * (weights.price || 0.4) +
    deliverySpeed * (weights.delivery || 0.2) +
    sellerTrust * (weights.trust || 0.2) +
    invertedHassle * (weights.hassle || 0.2);

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate delivery time score (0-100)
 * Faster delivery = higher score
 */
export function calculateDeliveryScore(deliveryDays: number, maxDays = 30): number {
  if (deliveryDays <= 0) {
    return 100;
  }

  if (deliveryDays >= maxDays) {
    return 0;
  }

  const score = ((maxDays - deliveryDays) / maxDays) * 100;
  return Math.round(score);
}

/**
 * Calculate price advantage score (0-100)
 * Better price = higher score
 */
export function calculatePriceAdvantageScore(
  currentPrice: number,
  competitorPrice: number
): number {
  if (currentPrice <= 0 || competitorPrice <= 0) {
    return 0;
  }

  const savings = competitorPrice - currentPrice;
  const savingsPercent = (savings / competitorPrice) * 100;

  // Cap at 50% savings = 100 score
  const score = Math.min((savingsPercent / 50) * 100, 100);

  return Math.round(Math.max(0, score));
}

/**
 * Round to nearest increment (for display purposes)
 */
export function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return Math.round((sum / numbers.length) * 100) / 100;
}

/**
 * Calculate median from array of numbers
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}
