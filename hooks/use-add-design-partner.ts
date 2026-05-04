'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export interface AddDesignPartnerInput {
  protocol_id: string
  retainer_amount_cents: number
  retainer_start: string
  equity_warrant_issued: boolean
  notes?: string
}

export function useAddDesignPartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddDesignPartnerInput) => apiClient.addDesignPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.designPartners() })
      toast.success('Design partner added')
    },
    onError: () => {
      toast.error('Failed to add design partner')
    },
  })
}
