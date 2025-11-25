import { useState, useEffect, useCallback } from 'react'
import type { Product } from '@price-comparison/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Search,
    RefreshCw,
    ShoppingCart,
    Store,
    Package,
    Globe,
    MapPin,
    Loader2,
} from 'lucide-react'
import { DevTools } from '@/components/DevTools'

// Remove App.css import - using Tailwind CSS only

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Types
interface HealthStatus {
    status: string
    timestamp: string
    services?: Record<string, { status: string }>
}

interface PlatformStats {
    totalProducts?: number
    totalShops?: number
    totalCategories?: number
}

interface SearchResult {
    id: string
    name: string
    price: number
    currency: string
    shop: string
    availability: string
    url?: string
    category?: string
    image?: string
}

interface ProductDetail {
    id: string
    name: string
    description?: string
    price: number
    currency: string
    shop: string
    category?: string
    availability: string
    url?: string
    images?: string[]
}

interface GlobalStatsApiResponse {
    total_products: number
    total_shops: number
    categories: string[]
}

const mapProductToSearchResult = (product: Product): SearchResult => {
    const primaryImage =
        product.image_url ||
        (product.image_urls && product.image_urls.length > 0
            ? product.image_urls[0]
            : undefined)

    return {
        id: product._id,
        name: product.name,
        price: product.pricing?.base?.amount ?? 0,
        currency: product.pricing?.base?.currency ?? '',
        shop: product.shop_info?.name ?? 'Unknown shop',
        availability: product.availability ?? 'unknown',
        url: product.product_url,
        category: product.category,
        image: primaryImage,
    }
}

const mapProductToDetail = (product: Product): ProductDetail => ({
    id: product._id,
    name: product.name,
    description: product.description,
    price: product.pricing?.base?.amount ?? 0,
    currency: product.pricing?.base?.currency ?? '',
    shop: product.shop_info?.name ?? 'Unknown shop',
    category: product.category,
    availability: product.availability ?? 'unknown',
    url: product.product_url,
    images:
        product.image_urls && product.image_urls.length > 0
            ? product.image_urls
            : product.image_url
                ? [product.image_url]
                : [],
})

// API Client
const api = {
    async get<T>(endpoint: string): Promise<T> {
        const res = await fetch(`${API_URL}${endpoint}`)
        if (!res.ok) throw new Error(`API Error: ${res.status}`)
        return res.json()
    },
    async post<T>(endpoint: string, body: object): Promise<T> {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`API Error: ${res.status}`)
        return res.json()
    },
}

function App() {
    // State
    const [health, setHealth] = useState<HealthStatus | null>(null)
    const [healthLoading, setHealthLoading] = useState(false)
    const [stats, setStats] = useState<PlatformStats>({})
    const [statsLoading, setStatsLoading] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')
    const [searchMode, setSearchMode] = useState<'local' | 'global'>('local')
    const [country, setCountry] = useState('IL')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)

    const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
        null
    )
    const [productLoading, setProductLoading] = useState(false)

    // Fetch health status
    const fetchHealth = useCallback(async () => {
        setHealthLoading(true)
        try {
            const data = await api.get<HealthStatus>('/health/detailed')
            setHealth(data)
        } catch {
            setHealth({ status: 'error', timestamp: new Date().toISOString() })
        } finally {
            setHealthLoading(false)
        }
    }, [])

    // Fetch platform stats
    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        try {
            const globalStats = await api.get<GlobalStatsApiResponse>(
                '/api/v1/stats/global-products'
            )

            setStats({
                totalProducts: globalStats.total_products,
                totalShops: globalStats.total_shops,
                totalCategories: globalStats.categories?.length || 0,
            })
        } catch (err) {
            console.error('Failed to fetch stats', err)
        } finally {
            setStatsLoading(false)
        }
    }, [])

    // Search products
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return

        setSearchLoading(true)
        setSearchError(null)
        setSearchResults([])

        try {
            const endpoint =
                searchMode === 'local'
                    ? '/api/v1/search/local'
                    : '/api/v1/search/global'

            const payload =
                searchMode === 'local'
                    ? {
                        query: searchQuery,
                        country,
                        page: 1,
                        per_page: 10,
                    }
                    : {
                        query: searchQuery,
                        user_country: country,
                        page: 1,
                        per_page: 10,
                    }

            const data = await api.post<{ results: Product[] }>(
                endpoint,
                payload
            )

            setSearchResults(
                (data.results || []).map((product) =>
                    mapProductToSearchResult(product)
                )
            )
        } catch (err) {
            setSearchError(
                err instanceof Error ? err.message : 'Search failed'
            )
        } finally {
            setSearchLoading(false)
        }
    }, [searchQuery, searchMode, country])

    // Fetch product details
    const fetchProductDetails = async (productId: string) => {
        setProductLoading(true)
        try {
            const data = await api.get<{ product: Product }>(
                `/api/v1/products/${productId}`
            )
            if (data?.product) {
                setSelectedProduct(mapProductToDetail(data.product))
            } else {
                setSelectedProduct(null)
            }
        } catch {
            setSelectedProduct(null)
        } finally {
            setProductLoading(false)
        }
    }

    // Initial load
    useEffect(() => {
        fetchHealth()
        fetchStats()
    }, [fetchHealth, fetchStats])

    const handleDevDataChange = useCallback(() => {
        fetchStats()
        if (searchQuery.trim()) {
            handleSearch()
        }
    }, [fetchStats, handleSearch, searchQuery])

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Price Comparison API Demo
                        </h1>
                        <p className="text-gray-500">
                            Testing API endpoints interactively
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={
                                health?.status === 'healthy'
                                    ? 'default'
                                    : 'destructive'
                            }
                            className="flex items-center gap-1"
                        >
                            {healthLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : health?.status === 'healthy' ? (
                                '● Online'
                            ) : (
                                '● Offline'
                            )}
                        </Badge>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchHealth}
                            disabled={healthLoading}
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`}
                            />
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Products
                            </CardTitle>
                            <Package className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statsLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    stats.totalProducts?.toLocaleString() || '—'
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Active Shops
                            </CardTitle>
                            <Store className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statsLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    stats.totalShops?.toLocaleString() || '—'
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Categories
                            </CardTitle>
                            <ShoppingCart className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statsLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    stats.totalCategories?.toLocaleString() ||
                                    '—'
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Search</CardTitle>
                        <CardDescription>
                            Search for products across local and global shops
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Search Controls */}
                        <div className="flex flex-wrap gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && handleSearch()
                                    }
                                    className="pl-10"
                                />
                            </div>

                            {/* Country Selector */}
                            <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                            >
                                <option value="IL">🇮🇱 Israel</option>
                                <option value="US">🇺🇸 USA</option>
                                <option value="UK">🇬🇧 UK</option>
                                <option value="DE">🇩🇪 Germany</option>
                                <option value="FR">🇫🇷 France</option>
                            </select>

                            {/* Search Mode Toggle */}
                            <div className="flex rounded-md border border-gray-300">
                                <Button
                                    variant={
                                        searchMode === 'local'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    size="sm"
                                    onClick={() => setSearchMode('local')}
                                    className="rounded-r-none"
                                >
                                    <MapPin className="mr-1 h-4 w-4" />
                                    Local
                                </Button>
                                <Button
                                    variant={
                                        searchMode === 'global'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    size="sm"
                                    onClick={() => setSearchMode('global')}
                                    className="rounded-l-none"
                                >
                                    <Globe className="mr-1 h-4 w-4" />
                                    Global
                                </Button>
                            </div>

                            <Button
                                onClick={handleSearch}
                                disabled={searchLoading || !searchQuery.trim()}
                            >
                                {searchLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                Search
                            </Button>
                        </div>

                        {/* Error Message */}
                        {searchError && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                                {searchError}
                            </div>
                        )}

                        {/* Results Table */}
                        {searchResults.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Shop</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Availability</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {searchResults.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>
                                            <TableCell>{product.shop}</TableCell>
                                            <TableCell>
                                                {product.currency}{' '}
                                                {product.price}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        product.availability ===
                                                            'in_stock'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {product.availability}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        fetchProductDetails(
                                                            product.id
                                                        )
                                                    }
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Empty State */}
                        {!searchLoading &&
                            searchResults.length === 0 &&
                            searchQuery && (
                                <div className="py-8 text-center text-gray-500">
                                    No results found. Try a different search
                                    term.
                                </div>
                            )}
                    </CardContent>
                </Card>

                {/* Product Detail Panel */}
                {(selectedProduct || productLoading) && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Product Details</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedProduct(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {productLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : selectedProduct ? (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-semibold">
                                            {selectedProduct.name}
                                        </h3>
                                        <p className="text-gray-500">
                                            {selectedProduct.description ||
                                                'No description available'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500">
                                                Price
                                            </span>
                                            <p className="text-lg font-bold">
                                                {selectedProduct.currency}{' '}
                                                {selectedProduct.price.toFixed(
                                                    2
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">
                                                Shop
                                            </span>
                                            <p className="font-medium">
                                                {selectedProduct.shop}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">
                                                Category
                                            </span>
                                            <p>
                                                {selectedProduct.category ||
                                                    '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">
                                                Availability
                                            </span>
                                            <p>
                                                <Badge>
                                                    {
                                                        selectedProduct.availability
                                                    }
                                                </Badge>
                                            </p>
                                        </div>
                                    </div>
                                    {selectedProduct.url && (
                                        <Button asChild className="mt-4">
                                            <a
                                                href={selectedProduct.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Visit Shop
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                )}

                {/* API Info Footer */}
                <Card className="bg-gray-100">
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                            <span>
                                API Endpoint:{' '}
                                <code className="rounded bg-gray-200 px-1">
                                    {API_URL}
                                </code>
                            </span>
                            <span>
                                Last health check:{' '}
                                {health?.timestamp
                                    ? new Date(
                                        health.timestamp
                                    ).toLocaleTimeString()
                                    : '—'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* DevTools - Only shown in development */}
            {import.meta.env.DEV && <DevTools onDataChange={handleDevDataChange} />}
        </div>
    )
}

export default App
