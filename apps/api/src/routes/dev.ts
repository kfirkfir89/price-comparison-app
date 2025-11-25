/**
 * Development Routes
 * Endpoints for seeding and managing mock data (development only)
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { MockDataService } from '../services/mock-data.service.js'
import {
    mockHeadphones,
    mockSmartphones,
    mockGaming,
    mockLaptops,
} from '../data/mock-products.js'

/**
 * Dev routes for mock data management
 * Only available when useMockData is true
 */
export const devRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const config = fastify.config

    // Guard: Only enable in development with mock data
    if (!config.useMockData) {
        fastify.log.info('Dev routes disabled (useMockData=false)')
        return
    }

    // Initialize mock data service (singleton)
    const mockDataService = new MockDataService(fastify)

    // Decorate fastify instance with mock service for other routes to use
    fastify.decorate('mockDataService', mockDataService)

    /**
     * GET /api/v1/dev/status
     * Check if mock data mode is enabled
     */
    fastify.get('/status', {
        schema: {
            description: 'Check dev mode status',
            tags: ['dev'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        mockDataEnabled: { type: 'boolean' },
                        productCount: { type: 'number' },
                        stats: {
                            type: 'object',
                            properties: {
                                totalProducts: { type: 'number' },
                                totalShops: { type: 'number' },
                                totalCategories: { type: 'number' },
                                totalBrands: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    }, async (_request, reply) => {
        const stats = mockDataService.getStats()
        return reply.send({
            mockDataEnabled: true,
            productCount: stats.totalProducts,
            stats,
        })
    })

    /**
     * POST /api/v1/dev/seed
     * Seed additional mock data
     */
    fastify.post<{
        Body: { category?: string }
    }>('/seed', {
        schema: {
            description: 'Seed additional mock data',
            tags: ['dev'],
            body: {
                type: 'object',
                properties: {
                    category: {
                        type: 'string',
                        enum: ['headphones', 'smartphones', 'gaming', 'laptops', 'all'],
                        default: 'all',
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        added: { type: 'number' },
                        total: { type: 'number' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { category = 'all' } = request.body || {}

        let productsToAdd = []
        switch (category) {
            case 'headphones':
                productsToAdd = mockHeadphones
                break
            case 'smartphones':
                productsToAdd = mockSmartphones
                break
            case 'gaming':
                productsToAdd = mockGaming
                break
            case 'laptops':
                productsToAdd = mockLaptops
                break
            case 'all':
            default:
                productsToAdd = [...mockHeadphones, ...mockSmartphones, ...mockGaming, ...mockLaptops]
        }

        const added = mockDataService.addProducts(productsToAdd)
        const stats = mockDataService.getStats()

        return reply.send({
            success: true,
            message: `Seeded ${category} data`,
            added,
            total: stats.totalProducts,
        })
    })

    /**
     * DELETE /api/v1/dev/reset
     * Reset mock data to defaults
     */
    fastify.delete('/reset', {
        schema: {
            description: 'Reset mock data to defaults',
            tags: ['dev'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        productCount: { type: 'number' },
                    },
                },
            },
        },
    }, async (_request, reply) => {
        mockDataService.reset()
        const stats = mockDataService.getStats()

        return reply.send({
            success: true,
            message: 'Mock data reset to defaults',
            productCount: stats.totalProducts,
        })
    })

    /**
     * GET /api/v1/dev/products
     * List all mock products
     */
    fastify.get<{
        Querystring: { page?: number; limit?: number }
    }>('/products', {
        schema: {
            description: 'List all mock products',
            tags: ['dev'],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'number', default: 1 },
                    limit: { type: 'number', default: 20 },
                },
            },
        },
    }, async (request, reply) => {
        const { page = 1, limit = 20 } = request.query
        const result = mockDataService.listProducts(page, limit)
        return reply.send(result)
    })

    fastify.log.info('🔧 Dev routes enabled (mock data mode)')
}
