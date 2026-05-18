'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { track } from '@/lib/analytics'
import { toast } from 'sonner'
import type { Protocol } from '@/types/api'

export function useRejectVerification(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (note: string) => apiClient.rejectVerification(id, note),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.protocol(id) })
      const previous = queryClient.getQueryData<Protocol>(QUERY_KEYS.protocol(id))
      if (previous) {
        queryClient.setQueryData<Protocol>(QUERY_KEYS.protocol(id), {
          ...previous,
          verification_status: 'REJECTED',
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.protocol(id), context.previous)
      }
      toast.error('Failed to reject verification')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocol(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
    },
    onSuccess: () => {
      track('protocol_verification_rejected', { protocol_id: id })
      toast.success('Verification rejected')
    },
  })
}
