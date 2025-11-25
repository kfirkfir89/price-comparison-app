/**
 * Search Service
 * Business logic for product search using Meilisearch and Qdrant
 */

import type { FastifyInstance } from "fastify";
import { MeiliSearch, Index as MeiliIndex } from "meilisearch";
import { QdrantClient } from "@qdrant/js-client-rest";
import type {
  LocalSearchRequest,
  GlobalSearchRequest,
  SearchFilters,
  PaginationMeta,
  Product,
  SmartDeal,
} from "@price-comparison/types";
import { ShopType, Country } from "@price-comparison/types";
import { MockDataService } from "./mock-data.service.js";

/**
 * Search result interface
 */
interface SearchResult {
  products: Product[];
  pagination: PaginationMeta;
  smartDeal?: SmartDeal;
}

/**
 * Search Service
 * Provides search functionality using Meilisearch for keyword search
 * and Qdrant for semantic/vector search
 */
export class SearchService {
  private fastify: FastifyInstance;
  private meilisearch: MeiliSearch | null = null;
  private qdrant: QdrantClient | null = null;
  private productIndex: MeiliIndex | null = null;
  private mockDataService: MockDataService | null = null;
  private useMockData: boolean;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.useMockData = fastify.config.useMockData;

    if (this.useMockData) {
      // Use mock data service
      this.mockDataService = new MockDataService(fastify);
      fastify.log.info("SearchService: Using mock data mode");
    } else {
      // Initialize Meilisearch client
      this.meilisearch = new MeiliSearch({
        host: fastify.config.meilisearch.host,
        apiKey: fastify.config.meilisearch.apiKey,
      });

      // Get the products index
      this.productIndex = this.meilisearch.index(
        fastify.config.meilisearch.indexes.products,
      );

      // Initialize Qdrant client
      this.qdrant = new QdrantClient({
        host: fastify.config.qdrant.host,
        port: fastify.config.qdrant.port,
        apiKey: fastify.config.qdrant.apiKey,
      });
    }
  }

  /**
   * Search local shops
   */
  async searchLocal(request: LocalSearchRequest): Promise<SearchResult> {
    const {
      query,
      filters = {},
      sort_by = "relevance",
      page = 1,
      per_page = 20,
      country,
      check_international = false,
    } = request;

    // Use mock data if enabled
    if (this.useMockData && this.mockDataService) {
      const mockResult = this.mockDataService.searchLocal(
        query,
        country,
        filters,
        page,
        per_page,
      );
      return {
        products: mockResult.results,
        pagination: mockResult.pagination,
        smartDeal: mockResult.smart_deal,
      };
    }

    // Build Meilisearch filter for local shops only
    const meilisearchFilters = this.buildLocalFilters(filters, country);

    try {
      // Execute search on Meilisearch
      const searchResult = await this.productIndex!.search(query, {
        filter: meilisearchFilters,
        sort: this.buildSortOrder(sort_by),
        limit: per_page,
        offset: (page - 1) * per_page,
        attributesToRetrieve: ["*"],
      });

      // Map results to Product type
      const products = searchResult.hits as unknown as Product[];

      // Build pagination
      const pagination = this.buildPagination(
        page,
        per_page,
        searchResult.estimatedTotalHits || 0,
      );

      // Check for smart deals if requested
      let smartDeal: SmartDeal | undefined;
      const firstProduct = products[0];
      if (check_international && firstProduct) {
        smartDeal = await this.checkSmartDeals(query, firstProduct, country);
      }

      return {
        products,
        pagination,
        smartDeal,
      };
    } catch (error) {
      this.fastify.log.error(
        { error, query },
        "Meilisearch local search error",
      );

      // Fallback to MongoDB search if Meilisearch fails
      return this.fallbackSearchLocal(request);
    }
  }

  /**
   * Search global retailers
   */
  async searchGlobal(request: GlobalSearchRequest): Promise<SearchResult> {
    const {
      query,
      filters = {},
      sort_by = "price_asc",
      page = 1,
      per_page = 20,
      user_country,
      include_shipping = true,
      include_all_fees = true,
      min_seller_rating,
    } = request;

    // Use mock data if enabled
    if (this.useMockData && this.mockDataService) {
      const mockResult = this.mockDataService.searchGlobal(
        query,
        user_country,
        filters,
        page,
        per_page,
      );
      return {
        products: mockResult.results,
        pagination: mockResult.pagination,
      };
    }

    // Build Meilisearch filter for global shops only
    const meilisearchFilters = this.buildGlobalFilters(
      filters,
      min_seller_rating,
    );

    try {
      // Execute search on Meilisearch
      const searchResult = await this.productIndex!.search(query, {
        filter: meilisearchFilters,
        sort: this.buildSortOrder(sort_by),
        limit: per_page,
        offset: (page - 1) * per_page,
        attributesToRetrieve: ["*"],
      });

      // Map results to Product type
      let products = searchResult.hits as unknown as Product[];

      // Calculate total costs if requested
      if (include_shipping || include_all_fees) {
        products = products.map((product) =>
          this.calculateTotalCost(product, user_country, include_all_fees),
        );
      }

      // Re-sort by total cost if sorting by price
      if (sort_by === "price_asc" || sort_by === "price_desc") {
        products = this.sortByTotalCost(products, sort_by === "price_desc");
      }

      // Build pagination
      const pagination = this.buildPagination(
        page,
        per_page,
        searchResult.estimatedTotalHits || 0,
      );

      return {
        products,
        pagination,
      };
    } catch (error) {
      this.fastify.log.error(
        { error, query },
        "Meilisearch global search error",
      );

      // Fallback to MongoDB search if Meilisearch fails
      return this.fallbackSearchGlobal(request);
    }
  }

  /**
   * Semantic search using Qdrant (vector search)
   */
  async semanticSearch(query: string, _limit: number = 20): Promise<Product[]> {
    // TODO: Implement embedding generation for the query
    // This requires an embedding model (e.g., sentence-transformers)
    // For now, return empty array - will be implemented in Phase 4
    this.fastify.log.warn("Semantic search not yet implemented");
    return [];
  }

  /**
   * Build Meilisearch filters for local search
   */
  private buildLocalFilters(
    filters: SearchFilters,
    country: Country,
  ): string[] {
    const filterArray: string[] = [];

    // Only local shops
    filterArray.push(`shop_info.type = "${ShopType.LOCAL}"`);

    // Filter by country
    filterArray.push(`shop_info.country = "${country}"`);

    // Price filters
    if (filters.min_price !== undefined) {
      filterArray.push(`pricing.base.amount >= ${filters.min_price}`);
    }
    if (filters.max_price !== undefined) {
      filterArray.push(`pricing.base.amount <= ${filters.max_price}`);
    }

    // Stock filter
    if (filters.in_stock === true) {
      filterArray.push(`availability = "in_stock"`);
    }

    // Shop filter
    if (filters.shops && filters.shops.length > 0) {
      const shopFilter = filters.shops
        .map((s) => `shop_info.name = "${s}"`)
        .join(" OR ");
      filterArray.push(`(${shopFilter})`);
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      const categoryFilter = filters.categories
        .map((c) => `category = "${c}"`)
        .join(" OR ");
      filterArray.push(`(${categoryFilter})`);
    }

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      const brandFilter = filters.brands
        .map((b) => `brand = "${b}"`)
        .join(" OR ");
      filterArray.push(`(${brandFilter})`);
    }

    // Rating filter
    if (filters.min_rating !== undefined) {
      filterArray.push(`rating >= ${filters.min_rating}`);
    }

    return filterArray;
  }

  /**
   * Build Meilisearch filters for global search
   */
  private buildGlobalFilters(
    filters: SearchFilters,
    minSellerRating?: number,
  ): string[] {
    const filterArray: string[] = [];

    // Only global shops
    filterArray.push(`shop_info.type = "${ShopType.GLOBAL}"`);

    // Price filters
    if (filters.min_price !== undefined) {
      filterArray.push(`pricing.base.amount >= ${filters.min_price}`);
    }
    if (filters.max_price !== undefined) {
      filterArray.push(`pricing.base.amount <= ${filters.max_price}`);
    }

    // Stock filter
    if (filters.in_stock === true) {
      filterArray.push(`availability = "in_stock"`);
    }

    // Shop filter
    if (filters.shops && filters.shops.length > 0) {
      const shopFilter = filters.shops
        .map((s) => `shop_info.name = "${s}"`)
        .join(" OR ");
      filterArray.push(`(${shopFilter})`);
    }

    // Rating filter
    if (filters.min_rating !== undefined) {
      filterArray.push(`rating >= ${filters.min_rating}`);
    }

    // Seller rating filter
    if (minSellerRating !== undefined) {
      filterArray.push(`rating >= ${minSellerRating}`);
    }

    return filterArray;
  }

  /**
   * Build sort order for Meilisearch
   */
  private buildSortOrder(sortBy: string): string[] {
    switch (sortBy) {
      case "price_asc":
        return ["pricing.base.amount:asc"];
      case "price_desc":
        return ["pricing.base.amount:desc"];
      case "rating":
        return ["rating:desc"];
      case "newest":
        return ["created_at:desc"];
      case "relevance":
      default:
        return []; // Meilisearch default relevance ranking
    }
  }

  /**
   * Build pagination metadata
   */
  private buildPagination(
    page: number,
    perPage: number,
    totalResults: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(totalResults / perPage);

    return {
      current_page: page,
      total_pages: totalPages,
      per_page: perPage,
      total_results: totalResults,
      has_next: page < totalPages,
      has_prev: page > 1,
    };
  }

  /**
   * Calculate total landed cost for international products
   */
  private calculateTotalCost(
    product: Product,
    userCountry: Country,
    includeAllFees: boolean,
  ): Product {
    // If international pricing already calculated, return as-is
    if (product.pricing.international?.total_landed_cost) {
      return product;
    }

    // TODO: Implement proper shipping and duty calculation
    // For now, return product with estimated costs
    const basePrice = product.pricing.base.amount;
    const estimatedShipping = basePrice * 0.1; // 10% estimate
    const estimatedDuties = includeAllFees ? basePrice * 0.17 : 0; // VAT estimate

    return {
      ...product,
      pricing: {
        ...product.pricing,
        international: {
          shipping: {
            available: true,
            cost: estimatedShipping,
            estimated_days: { standard: 14 },
          },
          fees: {
            import_duty: estimatedDuties * 0.3,
            vat: estimatedDuties * 0.7,
            handling: 0,
            customs_clearance: 0,
          },
          total_landed_cost: basePrice + estimatedShipping + estimatedDuties,
          risks: {
            customs_delay: true,
            warranty_void: true,
            return_difficult: true,
          },
        },
      },
    };
  }

  /**
   * Sort products by total cost
   */
  private sortByTotalCost(products: Product[], descending: boolean): Product[] {
    return products.sort((a, b) => {
      const costA =
        a.pricing.international?.total_landed_cost || a.pricing.base.amount;
      const costB =
        b.pricing.international?.total_landed_cost || b.pricing.base.amount;

      return descending ? costB - costA : costA - costB;
    });
  }

  /**
   * Check for smart deals (international savings)
   */
  private async checkSmartDeals(
    _query: string,
    _localProduct: Product,
    _userCountry: Country,
  ): Promise<SmartDeal | undefined> {
    // TODO: Implement smart deal detection
    // Search for the same product in global shops
    // Calculate savings including all fees
    // Only suggest if savings > 15%

    // For now, return no deal
    return {
      available: false,
    };
  }

  /**
   * Fallback search using MongoDB when Meilisearch is unavailable
   */
  private async fallbackSearchLocal(
    request: LocalSearchRequest,
  ): Promise<SearchResult> {
    this.fastify.log.warn("Using MongoDB fallback for local search");

    // TODO: Implement MongoDB fallback search
    // Use Product model to search

    return {
      products: [],
      pagination: this.buildPagination(
        request.page || 1,
        request.per_page || 20,
        0,
      ),
    };
  }

  /**
   * Fallback search using MongoDB when Meilisearch is unavailable
   */
  private async fallbackSearchGlobal(
    request: GlobalSearchRequest,
  ): Promise<SearchResult> {
    this.fastify.log.warn("Using MongoDB fallback for global search");

    // TODO: Implement MongoDB fallback search
    // Use Product model to search

    return {
      products: [],
      pagination: this.buildPagination(
        request.page || 1,
        request.per_page || 20,
        0,
      ),
    };
  }
}
