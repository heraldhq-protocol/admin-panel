'use client'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.overview(),
    queryFn: () => apiClient.getOverview(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}
