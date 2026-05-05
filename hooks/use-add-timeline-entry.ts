'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useAddTimelineEntry(incidentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: string) => apiClient.addTimelineEntry(incidentId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incident(incidentId) })
      toast.success('Update posted to timeline')
    },
    onError: () => {
      toast.error('Failed to post timeline update')
    },
  })
}
