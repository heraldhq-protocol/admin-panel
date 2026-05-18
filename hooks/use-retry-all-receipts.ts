'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { track } from '@/lib/analytics'
import { toast } from 'sonner'

export function useRetryAllReceipts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.retryAllReceipts(),
    onSuccess: (data) => {
      track('receipt_retry_all_triggered', { count: data.retried, succeeded: data.succeeded, failed: data.failed })
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
