'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useUpdateProtocolNotes(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notes: string) => apiClient.updateProtocolNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocol(id) })
    },
  })
}
