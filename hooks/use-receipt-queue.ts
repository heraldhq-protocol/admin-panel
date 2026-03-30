'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useReceiptQueue() {
  return useQuery({
    queryKey: QUERY_KEYS.receiptQueue(),
    queryFn: () => apiClient.getFailedReceipts(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}