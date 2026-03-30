'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { toast } from 'sonner'
import type { Protocol } from '@/types/api'
import type { Tier } from '@/types/billing'

export function useChangeTier(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tier: Tier) => apiClient.changeProtocolTier(id, tier),
    onMutate: async (newTier) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.protocol(id) })
      const previousProtocol = queryClient.getQueryData<Protocol>(QUERY_KEYS.protocol(id))

      if (previousProtocol) {
        queryClient.setQueryData<Protocol>(QUERY_KEYS.protocol(id), {
          ...previousProtocol,
          tier: newTier,
        })
      }

      return { previousProtocol }
    },
    onError: (_err, _newTier, context) => {
      if (context?.previousProtocol) {
        queryClient.setQueryData(QUERY_KEYS.protocol(id), context.previousProtocol)
      }
      toast.error('Failed to change protocol tier')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocol(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
    },
    onSuccess: () => {
      toast.success('Protocol tier updated')
    },
  })
}
