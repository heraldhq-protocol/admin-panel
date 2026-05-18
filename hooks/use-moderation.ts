'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { track } from '@/lib/analytics'
import type { ModerationFilters } from '@/types/api'

export function useModerationQueue(filters?: ModerationFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.moderationQueue(filters),
    queryFn: () => apiClient.getModerationQueue(filters),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function useModerationQueueItem(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.moderationItem(id),
    queryFn: () => apiClient.getModerationQueueItem(id),
    staleTime: 15_000,
  })
}

export function useProtocolAuditLog(protocolId: string, page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.protocolAuditLog(protocolId, page),
    queryFn: () => apiClient.getProtocolAuditLog(protocolId, { page, per_page: 50 }),
    staleTime: 30_000,
  })
}

export function useApproveModeration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.approveModeration(id),
    onSuccess: (_data, id) => {
      track('moderation_approved', { item_id: id })
      qc.invalidateQueries({ queryKey: ['moderation-queue'] })
      qc.invalidateQueries({ queryKey: ['moderation-item'] })
    },
  })
}

export function useStrikeProtocol() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason, suspend }: { id: string; reason: string; suspend?: boolean }) =>
      apiClient.strikeProtocol(id, { reason, ...(suspend !== undefined ? { suspend } : {}) }),
    onSuccess: (_data, { id }) => {
      track('protocol_strike_issued', { protocol_id: id })
      qc.invalidateQueries({ queryKey: ['moderation-queue'] })
      qc.invalidateQueries({ queryKey: ['moderation-item'] })
      qc.invalidateQueries({ queryKey: ['protocols'] })
    },
  })
}

export function useDismissModeration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.dismissModeration(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation-queue'] })
      qc.invalidateQueries({ queryKey: ['moderation-item'] })
    },
  })
}
