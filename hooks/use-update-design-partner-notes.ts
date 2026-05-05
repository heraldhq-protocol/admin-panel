'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export function useUpdateDesignPartnerNotes(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notes: string) => apiClient.updateDesignPartnerNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.designPartner(id) })
    },
  })
}
