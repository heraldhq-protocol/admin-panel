'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { SupportFilters } from '@/types/api'

export function useSupportTickets(filters?: SupportFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.supportTickets(filters),
    queryFn: () => apiClient.getSupportTickets(filters),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function useSupportTicket(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.supportTicket(id),
    queryFn: () => apiClient.getSupportTicket(id),
    staleTime: 15_000,
    enabled: !!id,
  })
}

export function useAdminReplyToTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body, isInternal }: { id: string; body: string; isInternal?: boolean }) =>
      apiClient.adminReplyToTicket(id, body, isInternal),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supportTicket(id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supportTickets() })
    },
  })
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, resolutionNote }: { id: string; status: string; resolutionNote?: string }) =>
      apiClient.updateTicketStatus(id, status, resolutionNote),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supportTicket(id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supportTickets() })
    },
  })
}
