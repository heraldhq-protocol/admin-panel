'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { track } from '@/lib/analytics'
import type { IncidentSeverity } from '@/types/api'

export interface CreateIncidentInput {
  severity: IncidentSeverity
  title: string
  description: string
  affected_component: string
}

export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIncidentInput) => apiClient.createIncident(data),
    onSuccess: (_data, input) => {
      track('incident_created', { severity: input.severity })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incidents() })
      toast.success('Incident declared. On-call paged.')
    },
    onError: () => {
      toast.error('Failed to declare incident')
    },
  })
}
