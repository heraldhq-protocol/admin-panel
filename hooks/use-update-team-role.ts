'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { AdminRole } from '@/types/auth'

export interface UpdateTeamRoleInput {
  id: string
  role: Exclude<AdminRole, 'super_admin'>
}

export function useUpdateTeamRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, role }: UpdateTeamRoleInput) => apiClient.updateTeamRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.team() })
      toast.success('Role updated')
    },
    onError: () => {
      toast.error('Failed to update role')
    },
  })
}
