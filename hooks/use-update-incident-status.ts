'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { IncidentStatus } from '@/types/api'

export interface UpdateIncidentStatusInput {
  status: IncidentStatus
  resolution?: string
}

export function useUpdateIncidentStatus(incidentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateIncidentStatusInput) => apiClient.updateIncidentStatus(incidentId, data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incident(incidentId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incidents() })
      toast.success(vars.status === 'resolved' ? 'Incident resolved' : 'Status updated')
    },
    onError: () => {
      toast.error('Failed to update incident status')
    },
  })
}
