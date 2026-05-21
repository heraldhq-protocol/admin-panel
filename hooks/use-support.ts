'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { SupportFilters, SupportTicketListResponse } from '@/types/api'

export function useSupportTickets(filters?: SupportFilters) {
  return useQuery<SupportTicketListResponse>({
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
    staleTime: 10_000,
    refetchInterval: 15_000,
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

export function useUpdateTicketPriority() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      apiClient.updateTicketPriority(id, priority),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supportTicket(id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supportTickets() })
    },
  })
}

export function useAssignTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adminUserId }: { id: string; adminUserId: string }) =>
      apiClient.assignTicket(id, adminUserId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supportTicket(id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supportTickets() })
    },
  })
}
