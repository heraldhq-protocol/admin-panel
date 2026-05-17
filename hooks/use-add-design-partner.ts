'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { PipelineStage, CampaignSource, BillingType } from '@/types/api'

export interface AddDesignPartnerInput {
  protocol_id: string
  retainer_amount_cents: number
  retainer_start: string
  retainer_end?: string
  equity_warrant_issued: boolean
  pipeline_stage?: PipelineStage
  contact_name?: string
  contact_email?: string
  campaign_source?: CampaignSource
  notes?: string
  billing_type?: BillingType
  granted_tier?: 1 | 2 | 3
  tier_grant_expires_at?: string
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
