/**
 * Feature flags management
 * Controls which features are enabled in the application
 */

import { getEnvironment } from './environment';

/**
 * Feature flag definitions
 */
export interface FeatureFlags {
  /** Enable local shopping mode (Phase 1) */
  localShopping: boolean;
  /** Enable global shopping mode (Phase 3) */
  globalShopping: boolean;
  /** Enable smart deal recommendations (Phase 2) */
  smartRecommendations: boolean;
  /** Enable price drop alerts */
  priceAlerts: boolean;
  /** Enable user accounts and authentication */
  userAccounts: boolean;
  /** Enable vector search with Qdrant (Phase 4) */
  vectorSearch: boolean;
  /** Enable product comparison tables */
  comparisonTables: boolean;
}

/**
 * Get current feature flags
 */
export function getFeatureFlags(): FeatureFlags {
  const env = getEnvironment();

  return {
    localShopping: env.FEATURE_LOCAL_SHOPPING,
    globalShopping: env.FEATURE_GLOBAL_SHOPPING,
    smartRecommendations: env.FEATURE_SMART_RECOMMENDATIONS,
    priceAlerts: env.FEATURE_PRICE_ALERTS,
    userAccounts: env.FEATURE_USER_ACCOUNTS,
    vectorSearch: env.FEATURE_VECTOR_SEARCH,
    comparisonTables: env.FEATURE_COMPARISON_TABLES,
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Get enabled features list
 */
export function getEnabledFeatures(): string[] {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Get disabled features list
 */
export function getDisabledFeatures(): string[] {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature);
}

/**
 * Feature flag guards for type safety
 */
export const features = {
  /** Check if local shopping is enabled */
  isLocalShoppingEnabled: () => isFeatureEnabled('localShopping'),
  /** Check if global shopping is enabled */
  isGlobalShoppingEnabled: () => isFeatureEnabled('globalShopping'),
  /** Check if smart recommendations are enabled */
  areSmartRecommendationsEnabled: () => isFeatureEnabled('smartRecommendations'),
  /** Check if price alerts are enabled */
  arePriceAlertsEnabled: () => isFeatureEnabled('priceAlerts'),
  /** Check if user accounts are enabled */
  areUserAccountsEnabled: () => isFeatureEnabled('userAccounts'),
  /** Check if vector search is enabled */
  isVectorSearchEnabled: () => isFeatureEnabled('vectorSearch'),
  /** Check if comparison tables are enabled */
  areComparisonTablesEnabled: () => isFeatureEnabled('comparisonTables'),
};
