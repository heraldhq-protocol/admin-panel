'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useDesignPartners(status?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.designPartners(),
    queryFn: () => apiClient.getDesignPartners(status),
    staleTime: 120_000,
  })
}