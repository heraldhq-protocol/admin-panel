'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api-client'
import { QUERY_KEYS } from '../lib/query-keys'
import type { TemplateFilters } from '../types/api'

export function usePendingTemplates(filters?: TemplateFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.pendingTemplates(filters),
    queryFn: () => apiClient.getPendingTemplates(filters),
  })
}

export function useApproveTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.approveTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-templates'] })
    },
  })
}

export function useRejectTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.rejectTemplate(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-templates'] })
    },
  })
}
