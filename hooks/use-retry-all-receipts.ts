'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useRetryAllReceipts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.retryAllReceipts(),
    onSuccess: (data) => {
      toast.success(
        `Bulk retry initiated: ${data.retried} retried (${data.succeeded} succeeded, ${data.failed} failed)`
      )
    },
    onError: () => {
      toast.error('Failed to execute bulk retry')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.receiptQueue() })
    },
  })
}
