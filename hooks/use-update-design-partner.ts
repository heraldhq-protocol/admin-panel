import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { DesignPartner, PipelineStage, CampaignSource, BillingType } from '@/types/api'

interface UpdateDesignPartnerInput {
  retainer_amount_cents?: number
  retainer_start?: string
  retainer_end?: string | null
  equity_warrant_issued?: boolean
  feedback_sessions?: number
  status?: 'active' | 'inactive' | 'pending'
  pipeline_stage?: PipelineStage
  contact_name?: string | null
  contact_email?: string | null
  campaign_source?: CampaignSource | null
  billing_type?: BillingType
  granted_tier?: 1 | 2 | 3 | null
  tier_grant_expires_at?: string | null
}

export function useUpdateDesignPartner(id: string) {
  const qc = useQueryClient()

  return useMutation<DesignPartner, Error, UpdateDesignPartnerInput>({
    mutationFn: (data) => apiClient.updateDesignPartner(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.designPartner(id), updated)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.designPartners() })
    },
  })
}
