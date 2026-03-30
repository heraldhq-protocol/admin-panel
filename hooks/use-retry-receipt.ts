'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useRetryReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.retryReceipt(id),
    onSuccess: () => {
      toast.success('Receipt queued for retry')
    },
    onError: () => {
      toast.error('Failed to queue receipt for retry')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.receiptQueue() })
    },
  })
}
