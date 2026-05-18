'use client'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useOverview(params?: { days?: number }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.overview(), params?.days ?? 7],
    queryFn: () => apiClient.getOverview(params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}
