/**
 * Shop configuration loader
 * Loads and validates shop configurations from YAML files
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { z } from "zod";
import { ShopConfig } from "@price-comparison/types";
import { getEnvironment } from "./environment";

/**
 * Zod schema for shop configuration validation
 */
const shopConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  country: z.string(),
  currency: z.string(),
  type: z.enum(["local", "global"]),
  enabled: z.boolean(),
  scraper: z.enum(["playwright", "simple", "scrapy"]),
  rate_limit: z.number().positive(),
  ships_to: z.array(z.string()).optional(),
  shipping: z
    .object({
      countries: z.array(z.string()),
      delivery_days: z.record(z.number()).optional(),
      free_threshold: z.record(z.number()).optional(),
    })
    .optional(),
  import_rules: z
    .object({
      duty_rates: z.record(z.number()).optional(),
      tax_rate: z.number().optional(),
      duty_threshold: z.number().optional(),
    })
    .optional(),
  scraper_config: z
    .object({
      selectors: z.record(z.string()).optional(),
      requires_js: z.boolean().optional(),
      headers: z.record(z.string()).optional(),
      requires_login: z.boolean().optional(),
    })
    .optional(),
  api_config: z
    .object({
      api_key: z.string().optional(),
      endpoint: z.string().optional(),
      rate_limit: z.number().optional(),
    })
    .optional(),
});

/**
 * YAML shop list schema
 */
const shopListSchema = z.object({
  shops: z.array(shopConfigSchema),
});

/**
 * Load shop configurations from a YAML file
 */
export function loadShopConfig(filePath: string): ShopConfig[] {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(fileContent);

    const result = shopListSchema.parse(data);
    return result.shops as ShopConfig[];
  } catch (error) {
    console.error(`Error loading shop config from ${filePath}:`, error);
    throw new Error(`Failed to load shop configuration: ${filePath}`);
  }
}

/**
 * Load all shop configurations from a directory
 */
export function loadAllShopConfigs(dirPath: string): ShopConfig[] {
  const configs: ShopConfig[] = [];

  try {
    // Read all YAML files in the directory and subdirectories
    const loadConfigsRecursive = (dir: string) => {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          loadConfigsRecursive(filePath);
        } else if (file.endsWith(".yaml") || file.endsWith(".yml")) {
          const shopConfigs = loadShopConfig(filePath);
          configs.push(...shopConfigs);
        }
      });
    };

    loadConfigsRecursive(dirPath);
  } catch (error) {
    console.error(`Error loading shop configs from ${dirPath}:`, error);
  }

  return configs;
}

/**
 * Get shop configuration path from environment
 */
export function getShopConfigPath(): string {
  const env = getEnvironment();
  return path.resolve(process.cwd(), env.SHOP_CONFIG_PATH);
}

/**
 * Get region configuration path from environment
 */
export function getRegionConfigPath(): string {
  const env = getEnvironment();
  return path.resolve(process.cwd(), env.REGION_CONFIG_PATH);
}

/**
 * Load local shop configurations (by country)
 */
export function loadLocalShops(country?: string): ShopConfig[] {
  const basePath = getShopConfigPath();
  const localPath = path.join(basePath, "local");

  if (country) {
    const countryFile = path.join(localPath, `${country.toLowerCase()}.yaml`);
    if (fs.existsSync(countryFile)) {
      return loadShopConfig(countryFile);
    }
    return [];
  }

  return loadAllShopConfigs(localPath).filter((shop) => shop.type === "local");
}

/**
 * Load global shop configurations
 */
export function loadGlobalShops(): ShopConfig[] {
  const basePath = getShopConfigPath();
  const globalPath = path.join(basePath, "global");

  return loadAllShopConfigs(globalPath).filter(
    (shop) => shop.type === "global",
  );
}

/**
 * Load all shop configurations
 */
export function loadAllShops(): ShopConfig[] {
  const basePath = getShopConfigPath();
  return loadAllShopConfigs(basePath);
}

/**
 * Get enabled shops only
 */
export function getEnabledShops(): ShopConfig[] {
  return loadAllShops().filter((shop) => shop.enabled);
}

/**
 * Get shop by ID
 */
export function getShopById(shopId: string): ShopConfig | undefined {
  return loadAllShops().find((shop) => shop.id === shopId);
}

/**
 * Get shops by country
 */
export function getShopsByCountry(country: string): ShopConfig[] {
  return loadAllShops().filter(
    (shop) => shop.country.toLowerCase() === country.toLowerCase(),
  );
}

/**
 * Get shops by type
 */
export function getShopsByType(type: "local" | "global"): ShopConfig[] {
  return loadAllShops().filter((shop) => shop.type === type);
}

/**
 * Regional configuration schema
 */
const regionConfigSchema = z.object({
  country: z.string(),
  currency: z.string(),
  tax_rate: z.number(),
  import_duty_threshold: z.number().optional(),
  import_duty_rate: z.union([z.number(), z.record(z.number())]).optional(),
  shipping_zones: z.array(z.string()).optional(),
});

/**
 * Regional configuration type
 */
export type RegionalConfig = z.infer<typeof regionConfigSchema>;

/**
 * Load regional configuration
 */
export function loadRegionalConfig(country: string): RegionalConfig | null {
  const basePath = getRegionConfigPath();
  const filePath = path.join(basePath, `${country.toLowerCase()}.yaml`);

  if (!fs.existsSync(filePath)) {
    console.warn(`Regional config not found for ${country}`);
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(fileContent);
    return regionConfigSchema.parse(data);
  } catch (error) {
    console.error(`Error loading regional config for ${country}:`, error);
    return null;
  }
}
