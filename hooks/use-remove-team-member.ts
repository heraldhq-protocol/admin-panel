'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useRemoveTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.removeTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.team() })
      toast.success('Team member removed')
    },
    onError: () => {
      toast.error('Failed to remove team member. Cannot remove last super_admin.')
    },
  })
}
