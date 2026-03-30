'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { ProtocolFilters } from '@/types/api'

export function useProtocols(filters?: ProtocolFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.protocols(filters),
    queryFn: () => apiClient.getProtocols(filters),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}