'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { PipelineStage } from '@/types/api'

export function useDesignPartners(params?: { status?: string; pipeline_stage?: PipelineStage }) {
  return useQuery({
    queryKey: QUERY_KEYS.designPartners(),
    queryFn: () => apiClient.getDesignPartners(params),
    staleTime: 30_000,
  })
}
