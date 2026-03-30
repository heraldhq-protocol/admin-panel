'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useProtocolDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.protocol(id),
    queryFn: () => apiClient.getProtocol(id),
    staleTime: 15_000,
    enabled: !!id,
  })
}