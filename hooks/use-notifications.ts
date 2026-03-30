'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { NotificationFilters } from '@/types/api'

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(filters),
    queryFn: () => apiClient.getNotifications(filters),
    staleTime: 30_000,
  })
}