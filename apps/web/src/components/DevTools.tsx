import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    Wrench,
    X,
    Database,
    RefreshCw,
    Smartphone,
    Gamepad2,
    Laptop,
    Headphones,
    Loader2,
    Check,
    AlertCircle,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface DevStatus {
    mockDataEnabled: boolean
    productCount: number
    stats: {
        totalProducts: number
        totalShops: number
        totalCategories: number
        totalBrands: number
    }
}

interface DevToolsProps {
    onDataChange?: () => void
}

export const DevTools: React.FC<DevToolsProps> = ({ onDataChange }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState<string | null>(null)
    const [status, setStatus] = useState<DevStatus | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [lastAction, setLastAction] = useState<string | null>(null)

    // Fetch dev status
    const fetchStatus = useCallback(async () => {
        setLoading('status')
        setError(null)
        try {
            const res = await fetch(`${API_URL}/api/v1/dev/status`)
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Mock data mode not enabled')
                    return
                }
                throw new Error(`API Error: ${res.status}`)
            }
            const data = await res.json()
            setStatus(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch status')
        } finally {
            setLoading(null)
        }
    }, [])

    // Seed data by category
    const seedData = useCallback(async (category: string) => {
        setLoading(category)
        setError(null)
        try {
            const res = await fetch(`${API_URL}/api/v1/dev/seed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category }),
            })
            if (!res.ok) throw new Error(`API Error: ${res.status}`)
            const data = await res.json()
            setLastAction(`Added ${data.added} products (${category})`)
            // Refresh status
            fetchStatus()
            onDataChange?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to seed data')
        } finally {
            setLoading(null)
        }
    }, [fetchStatus])

    // Reset data
    const resetData = useCallback(async () => {
        setLoading('reset')
        setError(null)
        try {
            const res = await fetch(`${API_URL}/api/v1/dev/reset`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error(`API Error: ${res.status}`)
            const data = await res.json()
            setLastAction(`Reset to ${data.productCount} products`)
            // Refresh status
            fetchStatus()
            onDataChange?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset data')
        } finally {
            setLoading(null)
        }
    }, [fetchStatus])

    // Fetch status when opening
    const handleOpen = useCallback(() => {
        setIsOpen(true)
        fetchStatus()
    }, [fetchStatus])

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="icon"
                className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700"
                onClick={handleOpen}
            >
                <Wrench className="h-5 w-5" />
            </Button>
        )
    }

    return (
        <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl border-purple-200">
            <CardHeader className="bg-purple-50 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-lg">Dev Tools</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <CardDescription>
                    Backend mock data management
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
                {/* Status */}
                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {lastAction && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                        <Check className="h-4 w-4" />
                        {lastAction}
                    </div>
                )}

                {status && (
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Products:</span>
                            <span className="font-medium">{status.stats.totalProducts}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shops:</span>
                            <span className="font-medium">{status.stats.totalShops}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Categories:</span>
                            <span className="font-medium">{status.stats.totalCategories}</span>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Seed Data by Category */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        Seed Mock Data
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={loading !== null}
                            onClick={() => seedData('headphones')}
                        >
                            {loading === 'headphones' ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                                <Headphones className="mr-1 h-3 w-3" />
                            )}
                            Audio
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={loading !== null}
                            onClick={() => seedData('smartphones')}
                        >
                            {loading === 'smartphones' ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                                <Smartphone className="mr-1 h-3 w-3" />
                            )}
                            Phones
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={loading !== null}
                            onClick={() => seedData('gaming')}
                        >
                            {loading === 'gaming' ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                                <Gamepad2 className="mr-1 h-3 w-3" />
                            )}
                            Gaming
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={loading !== null}
                            onClick={() => seedData('laptops')}
                        >
                            {loading === 'laptops' ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                                <Laptop className="mr-1 h-3 w-3" />
                            )}
                            Laptops
                        </Button>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        disabled={loading !== null}
                        onClick={() => seedData('all')}
                    >
                        {loading === 'all' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Database className="mr-2 h-4 w-4" />
                        )}
                        Seed All Categories
                    </Button>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={loading !== null}
                        onClick={fetchStatus}
                    >
                        {loading === 'status' ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-1 h-3 w-3" />
                        )}
                        Refresh
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        disabled={loading !== null}
                        onClick={resetData}
                    >
                        {loading === 'reset' ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                            <X className="mr-1 h-3 w-3" />
                        )}
                        Reset
                    </Button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                    API: {API_URL}
                </p>
            </CardContent>
        </Card>
    )
}

export default DevTools
