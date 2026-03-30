'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useTeam() {
  return useQuery({
    queryKey: QUERY_KEYS.team(),
    queryFn: () => apiClient.getTeam(),
    staleTime: 300_000,
  })
}