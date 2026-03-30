'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { IncidentFilters } from '@/types/api'

export function useIncidents(filters?: IncidentFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.incidents(filters),
    queryFn: () => apiClient.getIncidents(filters),
    staleTime: 15_000,
  })
}