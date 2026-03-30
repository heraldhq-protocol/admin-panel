'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useEmailHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.emailHealth(),
    queryFn: () => apiClient.getEmailHealth(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}