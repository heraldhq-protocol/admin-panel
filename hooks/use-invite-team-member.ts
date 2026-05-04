'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { AdminRole, AuthMethod } from '@/types/auth'

export interface InviteTeamMemberInput {
  display_name: string
  role: Exclude<AdminRole, 'super_admin'>
  auth_method: AuthMethod
  wallet_address?: string
  email?: string
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteTeamMemberInput) => apiClient.inviteTeamMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.team() })
      toast.success('Invitation created. Check server logs for the invite token (email delivery not yet wired).')
    },
    onError: () => {
      toast.error('Failed to send invitation')
    },
  })
}
