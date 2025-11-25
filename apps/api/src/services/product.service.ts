/**
 * Product Service
 * Business logic for product data access and manipulation
 */

import type { FastifyInstance } from "fastify";
import mongoose, { Schema, Model, Document } from "mongoose";
import type {
  Product,
  ProductGroup,
  PaginationMeta,
} from "@price-comparison/types";
import {
  ShopType,
  AvailabilityStatus,
  Currency,
  PriceTrend,
} from "@price-comparison/types";
import { MockDataService } from "./mock-data.service.js";

/**
 * Product document interface for Mongoose
 */
interface ProductDocument extends Omit<Product, "_id">, Document {}

/**
 * Product group document interface for Mongoose
 */
interface ProductGroupDocument extends Omit<ProductGroup, "_id">, Document {}

/**
 * Global statistics result
 */
interface GlobalStats {
  totalProducts: number;
  totalShops: number;
  productsByCountry: Record<string, number>;
  productsByShop: Record<string, number>;
  categories: string[];
}

/**
 * Shop statistics result
 */
interface ShopStats {
  name: string;
  country: string;
  type: string;
  product_count: number;
  enabled: boolean;
}

/**
 * Category statistics result
 */
interface CategoryStats {
  name: string;
  product_count: number;
  avg_price: number;
}

/**
 * Mongoose Product Schema
 */
const productSchema = new Schema<ProductDocument>(
  {
    product_group_id: { type: String, index: true },
    shop_info: {
      name: { type: String, required: true, index: true },
      type: {
        type: String,
        enum: Object.values(ShopType),
        required: true,
        index: true,
      },
      country: { type: String, required: true, index: true },
      ships_to: [String],
      is_marketplace: Boolean,
      global_reach: Boolean,
    },
    name: { type: String, required: true, index: "text" },
    description: String,
    image_url: String,
    image_urls: [String],
    product_url: { type: String, required: true },
    sku: String,
    brand: { type: String, index: true },
    category: { type: String, index: true },
    rating: Number,
    review_count: Number,
    availability: {
      type: String,
      enum: Object.values(AvailabilityStatus),
      default: AvailabilityStatus.UNKNOWN,
    },
    pricing: {
      base: {
        amount: { type: Number, required: true },
        currency: {
          type: String,
          enum: Object.values(Currency),
          required: true,
        },
        includes_tax: Boolean,
      },
      local_total: Number,
      international: {
        shipping: {
          available: Boolean,
          cost: Number,
          express_cost: Number,
          free_threshold: Number,
          estimated_days: {
            standard: Number,
            express: Number,
          },
        },
        fees: {
          import_duty: Number,
          vat: Number,
          handling: Number,
          customs_clearance: Number,
        },
        total_landed_cost: Number,
        risks: {
          customs_delay: Boolean,
          warranty_void: Boolean,
          return_difficult: Boolean,
        },
      },
    },
    recommendation: {
      score: Number,
      factors: {
        price_advantage: Number,
        delivery_speed: Number,
        seller_trust: Number,
        hassle_factor: Number,
      },
      last_checked: Date,
      price_trend: { type: String, enum: Object.values(PriceTrend) },
    },
    last_scraped_at: Date,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

// Create compound indexes
productSchema.index({ "shop_info.type": 1, "shop_info.country": 1 });
productSchema.index({ "pricing.base.amount": 1 });
productSchema.index({ name: "text", brand: "text", category: "text" });

/**
 * Product Group Schema
 */
const productGroupSchema = new Schema<ProductGroupDocument>(
  {
    normalized_name: { type: String, required: true, index: true },
    canonical_data: {
      name: String,
      brand: String,
      category: String,
      image_url: String,
    },
    product_ids: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    shop_count: Number,
    price_range: {
      min: Number,
      max: Number,
      currency: { type: String, enum: Object.values(Currency) },
    },
    average_rating: Number,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

/**
 * Product Service
 * Handles all product-related database operations
 */
export class ProductService {
  private fastify: FastifyInstance;
  private ProductModel: Model<ProductDocument> | null = null;
  private ProductGroupModel: Model<ProductGroupDocument> | null = null;
  private mockDataService: MockDataService | null = null;
  private useMockData: boolean;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.useMockData = fastify.config.useMockData;

    if (this.useMockData) {
      // Use mock data service
      this.mockDataService = new MockDataService(fastify);
      fastify.log.info("ProductService: Using mock data mode");
    } else {
      // Get or create models
      this.ProductModel =
        mongoose.models.Product ||
        mongoose.model<ProductDocument>("Product", productSchema);

      this.ProductGroupModel =
        mongoose.models.ProductGroup ||
        mongoose.model<ProductGroupDocument>("ProductGroup", productGroupSchema);
    }
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<Product | null> {
    // Use mock data if enabled
    if (this.useMockData && this.mockDataService) {
      return this.mockDataService.findProductById(id);
    }

    try {
      const product = await this.ProductModel!.findById(id).lean();
      return product as Product | null;
    } catch (error) {
      this.fastify.log.error({ error, id }, "Error finding product by ID");
      throw error;
    }
  }

  /**
   * Find all products with pagination and filters
   */
  async findAll(options: {
    page: number;
    per_page: number;
    shop?: string;
    category?: string;
    brand?: string;
  }): Promise<{ products: Product[]; pagination: PaginationMeta }> {
    const { page, per_page, shop, category, brand } = options;

    // Use mock data if enabled
    if (this.useMockData && this.mockDataService) {
      return this.mockDataService.listProducts(page, per_page);
    }

    // Build filter
    const filter: Record<string, unknown> = {};
    if (shop) filter["shop_info.name"] = shop;
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    try {
      // Get total count
      const totalResults = await this.ProductModel!.countDocuments(filter);

      // Get products
      const products = await this.ProductModel!.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * per_page)
        .limit(per_page)
        .lean();

      // Build pagination
      const totalPages = Math.ceil(totalResults / per_page);
      const pagination: PaginationMeta = {
        current_page: page,
        total_pages: totalPages,
        per_page,
        total_results: totalResults,
        has_next: page < totalPages,
        has_prev: page > 1,
      };

      return {
        products: products as unknown as Product[],
        pagination,
      };
    } catch (error) {
      this.fastify.log.error({ error }, "Error finding products");
      throw error;
    }
  }

  /**
   * Find product group with alternatives
   */
  async findProductGroup(
    groupId: string,
  ): Promise<{ group: ProductGroup; alternatives: Product[] } | null> {
    // Mock data mode doesn't support product groups yet
    if (this.useMockData) {
      this.fastify.log.warn("Product groups not yet implemented for mock data");
      return null;
    }

    try {
      const group = await this.ProductGroupModel!.findById(groupId).lean();

      if (!group) {
        return null;
      }

      // Get all products in the group
      const alternatives = await this.ProductModel!.find({
        product_group_id: groupId,
      })
        .sort({ "pricing.base.amount": 1 })
        .lean();

      return {
        group: group as unknown as ProductGroup,
        alternatives: alternatives as unknown as Product[],
      };
    } catch (error) {
      this.fastify.log.error({ error, groupId }, "Error finding product group");
      throw error;
    }
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(
    _productId: string,
  ): Promise<Array<{ date: string; price: number; shop: string }>> {
    // TODO: Implement price history collection and retrieval
    // For now, return empty array
    this.fastify.log.warn("Price history not yet implemented");
    return [];
  }

  /**
   * Get global statistics
   */
  async getGlobalStats(): Promise<GlobalStats> {
    // Use mock data if enabled
    if (this.useMockData && this.mockDataService) {
      const mockStats = this.mockDataService.getStats();
      const products = this.mockDataService.getAllProducts();

      // Build mock country/shop breakdown
      const productsByCountry: Record<string, number> = {};
      const productsByShop: Record<string, number> = {};
      const categoriesSet = new Set<string>();

      products.forEach((p) => {
        productsByCountry[p.shop_info.country] = (productsByCountry[p.shop_info.country] || 0) + 1;
        productsByShop[p.shop_info.name] = (productsByShop[p.shop_info.name] || 0) + 1;
        if (p.category) categoriesSet.add(p.category);
      });

      return {
        totalProducts: mockStats.totalProducts,
        totalShops: mockStats.totalShops,
        productsByCountry,
        productsByShop,
        categories: Array.from(categoriesSet),
      };
    }

    try {
      // Get total products
      const totalProducts = await this.ProductModel!.countDocuments();

      // Get products by country
      const countryAgg = await this.ProductModel!.aggregate([
        { $group: { _id: "$shop_info.country", count: { $sum: 1 } } },
      ]);
      const productsByCountry: Record<string, number> = {};
      countryAgg.forEach((item) => {
        productsByCountry[item._id] = item.count;
      });

      // Get products by shop
      const shopAgg = await this.ProductModel!.aggregate([
        { $group: { _id: "$shop_info.name", count: { $sum: 1 } } },
      ]);
      const productsByShop: Record<string, number> = {};
      shopAgg.forEach((item) => {
        productsByShop[item._id] = item.count;
      });

      // Get unique shops count
      const totalShops = Object.keys(productsByShop).length;

      // Get unique categories
      const categoriesAgg = await this.ProductModel!.distinct("category");
      const categories = categoriesAgg.filter(Boolean) as string[];

      return {
        totalProducts,
        totalShops,
        productsByCountry,
        productsByShop,
        categories,
      };
    } catch (error) {
      this.fastify.log.error({ error }, "Error getting global stats");
      throw error;
    }
  }

  /**
   * Get shop statistics
   */
  async getShopStats(): Promise<ShopStats[]> {
    // Use mock data if enabled
    if (this.useMockData && this.mockDataService) {
      const products = this.mockDataService.getAllProducts();
      const shopMap = new Map<string, { country: string; type: string; count: number }>();

      products.forEach((p) => {
        const existing = shopMap.get(p.shop_info.name);
        if (existing) {
          existing.count++;
        } else {
          shopMap.set(p.shop_info.name, {
            country: p.shop_info.country,
            type: p.shop_info.type,
            count: 1,
          });
        }
      });

      return Array.from(shopMap.entries())
        .map(([name, data]) => ({
          name,
          country: data.country,
          type: data.type,
          product_count: data.count,
          enabled: true,
        }))
        .sort((a, b) => b.product_count - a.product_count);
    }

    try {
      const stats = await this.ProductModel!.aggregate([
        {
          $group: {
            _id: "$shop_info.name",
            country: { $first: "$shop_info.country" },
            type: { $first: "$shop_info.type" },
            product_count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            name: "$_id",
            country: 1,
            type: 1,
            product_count: 1,
            enabled: { $literal: true },
          },
        },
        { $sort: { product_count: -1 } },
      ]);

      return stats as ShopStats[];
    } catch (error) {
      this.fastify.log.error({ error }, "Error getting shop stats");
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    // Use mock data if enabled
    if (this.useMockData && this.mockDataService) {
      const products = this.mockDataService.getAllProducts();
      const categoryMap = new Map<string, { count: number; totalPrice: number }>();

      products.forEach((p) => {
        if (!p.category) return;
        const existing = categoryMap.get(p.category);
        if (existing) {
          existing.count++;
          existing.totalPrice += p.pricing.base.amount;
        } else {
          categoryMap.set(p.category, {
            count: 1,
            totalPrice: p.pricing.base.amount,
          });
        }
      });

      return Array.from(categoryMap.entries())
        .map(([name, data]) => ({
          name,
          product_count: data.count,
          avg_price: Math.round((data.totalPrice / data.count) * 100) / 100,
        }))
        .sort((a, b) => b.product_count - a.product_count);
    }

    try {
      const stats = await this.ProductModel!.aggregate([
        { $match: { category: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$category",
            product_count: { $sum: 1 },
            avg_price: { $avg: "$pricing.base.amount" },
          },
        },
        {
          $project: {
            _id: 0,
            name: "$_id",
            product_count: 1,
            avg_price: { $round: ["$avg_price", 2] },
          },
        },
        { $sort: { product_count: -1 } },
      ]);

      return stats as CategoryStats[];
    } catch (error) {
      this.fastify.log.error({ error }, "Error getting category stats");
      throw error;
    }
  }
}
