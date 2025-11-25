/**
 * Mock Data Service
 * In-memory "database" for development without MongoDB
 */

import type { FastifyInstance } from 'fastify'
import {
    type Product,
    type LocalSearchResponse,
    type GlobalSearchResponse,
    type SearchFilters,
    type PaginationMeta,
    type SmartDeal,
    ShopType,
    AvailabilityStatus,
} from '@price-comparison/types'
import { allMockProducts, getMockProductsByCategory } from '../data/mock-products'

export interface MockStats {
    totalProducts: number
    totalShops: number
    totalCategories: number
    totalBrands: number
}

export class MockDataService {
    private products: Map<string, Product> = new Map()
    private fastify: FastifyInstance

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify
        this.seedData()
    }

    /**
     * Initialize with mock products
     */
    private seedData(): void {
        for (const product of allMockProducts) {
            this.products.set(product._id, product)
        }
        this.fastify.log.info(`MockDataService: Loaded ${this.products.size} products`)
    }

    /**
     * Add more products (for dev seeding)
     */
    addProducts(products: Product[]): number {
        let added = 0
        for (const product of products) {
            if (!this.products.has(product._id)) {
                this.products.set(product._id, product)
                added++
            }
        }
        return added
    }

    /**
     * Reset to default mock data
     */
    reset(): void {
        this.products.clear()
        this.seedData()
    }

    /**
     * Get all products
     */
    getAllProducts(): Product[] {
        return Array.from(this.products.values())
    }

    /**
     * Find product by ID
     */
    findProductById(id: string): Product | null {
        return this.products.get(id) || null
    }

    /**
     * Search local products
     */
    searchLocal(
        query: string,
        country: string,
        filters?: SearchFilters,
        page: number = 1,
        perPage: number = 10
    ): LocalSearchResponse {
        const startTime = Date.now()
        const queryLower = query.toLowerCase()

        // Filter products
        let results = this.getAllProducts().filter((p) => {
            // Must be local shop
            if (p.shop_info.type !== ShopType.LOCAL) return false

            // Must match country
            if (p.shop_info.country !== country) return false

            // Must match query
            const matchesQuery =
                p.name.toLowerCase().includes(queryLower) ||
                p.brand?.toLowerCase().includes(queryLower) ||
                p.category?.toLowerCase().includes(queryLower) ||
                p.description?.toLowerCase().includes(queryLower)

            if (!matchesQuery) return false

            // Apply filters
            if (filters) {
                if (filters.min_price && p.pricing.base.amount < filters.min_price) return false
                if (filters.max_price && p.pricing.base.amount > filters.max_price) return false
                if (filters.in_stock && p.availability !== AvailabilityStatus.IN_STOCK) return false
                if (filters.brands?.length && !filters.brands.includes(p.brand || '')) return false
                if (filters.shops?.length && !filters.shops.includes(p.shop_info.name)) return false
                if (filters.min_rating && (p.rating || 0) < filters.min_rating) return false
            }

            return true
        })

        // Sort by recommendation score
        results.sort((a, b) => (b.recommendation?.score || 0) - (a.recommendation?.score || 0))

        // Paginate
        const totalResults = results.length
        const totalPages = Math.ceil(totalResults / perPage)
        const startIndex = (page - 1) * perPage
        results = results.slice(startIndex, startIndex + perPage)

        // Check for smart deal (cheaper global option)
        const smartDeal = this.findSmartDeal(query, results[0])

        const pagination: PaginationMeta = {
            current_page: page,
            total_pages: totalPages,
            per_page: perPage,
            total_results: totalResults,
            has_next: page < totalPages,
            has_prev: page > 1,
        }

        return {
            results,
            pagination,
            smart_deal: smartDeal,
            query,
            filters: filters || {},
            took_ms: Date.now() - startTime,
        }
    }

    /**
     * Search global products
     */
    searchGlobal(
        query: string,
        userCountry: string,
        filters?: SearchFilters,
        page: number = 1,
        perPage: number = 10
    ): GlobalSearchResponse {
        const startTime = Date.now()
        const queryLower = query.toLowerCase()

        // Filter products
        let results = this.getAllProducts().filter((p) => {
            // Must be global shop
            if (p.shop_info.type !== ShopType.GLOBAL) return false

            // Must ship to user country
            if (!p.shop_info.ships_to.includes(userCountry)) return false

            // Must match query
            const matchesQuery =
                p.name.toLowerCase().includes(queryLower) ||
                p.brand?.toLowerCase().includes(queryLower) ||
                p.category?.toLowerCase().includes(queryLower) ||
                p.description?.toLowerCase().includes(queryLower)

            if (!matchesQuery) return false

            // Apply filters
            if (filters) {
                if (filters.min_price && p.pricing.base.amount < filters.min_price) return false
                if (filters.max_price && p.pricing.base.amount > filters.max_price) return false
                if (filters.in_stock && p.availability !== AvailabilityStatus.IN_STOCK) return false
                if (filters.brands?.length && !filters.brands.includes(p.brand || '')) return false
                if (filters.shops?.length && !filters.shops.includes(p.shop_info.name)) return false
                if (filters.min_rating && (p.rating || 0) < filters.min_rating) return false
            }

            return true
        })

        // Sort by total landed cost
        results.sort((a, b) => {
            const costA = a.pricing.international?.total_landed_cost || a.pricing.base.amount
            const costB = b.pricing.international?.total_landed_cost || b.pricing.base.amount
            return costA - costB
        })

        // Paginate
        const totalResults = results.length
        const totalPages = Math.ceil(totalResults / perPage)
        const startIndex = (page - 1) * perPage
        results = results.slice(startIndex, startIndex + perPage)

        const pagination: PaginationMeta = {
            current_page: page,
            total_pages: totalPages,
            per_page: perPage,
            total_results: totalResults,
            has_next: page < totalPages,
            has_prev: page > 1,
        }

        return {
            results,
            pagination,
            query,
            filters: filters || {},
            took_ms: Date.now() - startTime,
        }
    }

    /**
     * Find smart deal (cheaper global option for local product)
     */
    private findSmartDeal(query: string, bestLocal?: Product): SmartDeal | undefined {
        if (!bestLocal) return undefined

        const queryLower = query.toLowerCase()

        // Find global alternatives in same product group
        const globalAlternatives = this.getAllProducts().filter(
            (p) =>
                p.shop_info.type === ShopType.GLOBAL &&
                p.product_group_id === bestLocal.product_group_id &&
                p.availability === AvailabilityStatus.IN_STOCK
        )

        if (globalAlternatives.length === 0) return undefined

        // Find cheapest global option
        const cheapestGlobal = globalAlternatives.reduce((best, current) => {
            const currentCost = current.pricing.international?.total_landed_cost || current.pricing.base.amount
            const bestCost = best.pricing.international?.total_landed_cost || best.pricing.base.amount
            return currentCost < bestCost ? current : best
        })

        const localPrice = bestLocal.pricing.local_total || bestLocal.pricing.base.amount
        const globalPrice = cheapestGlobal.pricing.international?.total_landed_cost || cheapestGlobal.pricing.base.amount

        // Only show deal if savings > 10%
        const savings = localPrice - globalPrice
        const savingsPercent = (savings / localPrice) * 100

        if (savingsPercent < 10) return undefined

        return {
            available: true,
            message: `Save ${savingsPercent.toFixed(0)}% by ordering from ${cheapestGlobal.shop_info.name}`,
            summary: {
                best_local: localPrice,
                best_international: globalPrice,
                savings,
                savings_percent: savingsPercent,
                delivery_difference: (cheapestGlobal.pricing.international?.shipping.estimated_days.standard || 14) - 3,
                shop: cheapestGlobal.shop_info.name,
                country: cheapestGlobal.shop_info.country,
            },
            product: cheapestGlobal,
        }
    }

    /**
     * Get platform statistics
     */
    getStats(): MockStats {
        const products = this.getAllProducts()
        const shops = new Set(products.map((p) => p.shop_info.name))
        const categories = new Set(products.map((p) => p.category).filter(Boolean))
        const brands = new Set(products.map((p) => p.brand).filter(Boolean))

        return {
            totalProducts: products.length,
            totalShops: shops.size,
            totalCategories: categories.size,
            totalBrands: brands.size,
        }
    }

    /**
     * List products with pagination
     */
    listProducts(page: number = 1, perPage: number = 20): { products: Product[]; pagination: PaginationMeta } {
        const allProducts = this.getAllProducts()
        const totalResults = allProducts.length
        const totalPages = Math.ceil(totalResults / perPage)
        const startIndex = (page - 1) * perPage
        const products = allProducts.slice(startIndex, startIndex + perPage)

        return {
            products,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: perPage,
                total_results: totalResults,
                has_next: page < totalPages,
                has_prev: page > 1,
            },
        }
    }
}
