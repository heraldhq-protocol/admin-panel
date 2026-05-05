'use client'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.metrics(),
    queryFn: () => apiClient.getMetrics(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
}
