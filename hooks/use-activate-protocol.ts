'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { Protocol } from '@/types/api'

export function useActivateProtocol(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.activateProtocol(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.protocol(id) })
      const previousProtocol = queryClient.getQueryData<Protocol>(QUERY_KEYS.protocol(id))

      if (previousProtocol) {
        queryClient.setQueryData<Protocol>(QUERY_KEYS.protocol(id), {
          ...previousProtocol,
          is_active: true,
        })
      }

      return { previousProtocol }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProtocol) {
        queryClient.setQueryData(QUERY_KEYS.protocol(id), context.previousProtocol)
      }
      toast.error('Failed to activate protocol')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocol(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
    },
    onSuccess: () => {
      toast.success('Protocol activated')
    },
  })
}
