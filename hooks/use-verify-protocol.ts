'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { track } from '@/lib/analytics'
import { toast } from 'sonner'
import type { Protocol } from '@/types/api'

export function useVerifyProtocol(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (note?: string) => apiClient.verifyProtocol(id, note),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.protocol(id) })
      const previous = queryClient.getQueryData<Protocol>(QUERY_KEYS.protocol(id))
      if (previous) {
        queryClient.setQueryData<Protocol>(QUERY_KEYS.protocol(id), {
          ...previous,
          verification_status: 'VERIFIED',
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.protocol(id), context.previous)
      }
      toast.error('Failed to verify protocol')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocol(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
    },
    onSuccess: () => {
      track('protocol_verified', { protocol_id: id })
      toast.success('Protocol verified')
    },
  })
}
