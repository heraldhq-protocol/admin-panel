import { useEffect, useState, useCallback } from 'react'
import { apiClient, type AwsCostSummary } from '@/lib/api-client'

interface UseAwsCostsResult {
  data: AwsCostSummary | null
  loading: boolean
  error: string | null
  refetch: () => void
  clearCache: () => Promise<void>
}

export function useAwsCosts(): UseAwsCostsResult {
  const [data, setData] = useState<AwsCostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.getAwsCosts()
      setData(result)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as Error)?.message ??
        'Failed to load AWS cost data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const clearCache = useCallback(async () => {
    await apiClient.clearAwsCostCache()
    await fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch, clearCache }
}
