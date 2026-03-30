'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { toast } from 'sonner'
import type { Protocol } from '@/types/api'

export function useSuspendProtocol(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reason: string) => apiClient.suspendProtocol(id, reason),
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.protocol(id) })

      // Snapshot the previous value
      const previousProtocol = queryClient.getQueryData<Protocol>(QUERY_KEYS.protocol(id))

      // Optimistically update to the new value
      if (previousProtocol) {
        queryClient.setQueryData<Protocol>(QUERY_KEYS.protocol(id), {
          ...previousProtocol,
          is_active: false,
        })
      }

      // Return a context object with the snapshotted value
      return { previousProtocol }
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _newTodo, context) => {
      if (context?.previousProtocol) {
        queryClient.setQueryData(QUERY_KEYS.protocol(id), context.previousProtocol)
      }
      toast.error('Failed to suspend protocol')
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocol(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
    },
    onSuccess: () => {
      toast.success('Protocol suspended')
    },
  })
}
