import axios from 'axios'
import type {
  Protocol,
  Notification,
  FailedReceipt,
  EmailHealth,
  DesignPartner,
  Incident,
  IncidentTimelineEntry,
  TeamMember,
  PaginatedResponse,
  ProtocolFilters,
  NotificationFilters,
  IncidentFilters,
} from '../types/api'
import type { Tier } from '../types/billing'

const client = axios.create({
  baseURL: '/api/admin',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Redirect to login on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const apiClient = {
  // Overview
  getOverview: () =>
    client.get('/overview').then(r => r.data),

  // Protocols
  getProtocols: (filters?: ProtocolFilters) =>
    client.get<PaginatedResponse<Protocol>>('/protocols', { params: filters }).then(r => r.data),
  getProtocol: (id: string) =>
    client.get<Protocol>(`/protocols/${id}`).then(r => r.data),
  suspendProtocol: (id: string, reason: string) =>
    client.put<Protocol>(`/protocols/${id}/suspend`, { reason }).then(r => r.data),
  unsuspendProtocol: (id: string) =>
    client.put<Protocol>(`/protocols/${id}/unsuspend`).then(r => r.data),
  changeProtocolTier: (id: string, tier: Tier) =>
    client.put<Protocol>(`/protocols/${id}/tier`, { tier }).then(r => r.data),
  updateProtocolNotes: (id: string, notes: string) =>
    client.post<Protocol>(`/protocols/${id}/notes`, { notes }).then(r => r.data),

  // Notifications
  getNotifications: (filters?: NotificationFilters) =>
    client.get<PaginatedResponse<Notification>>('/notifications', { params: filters }).then(r => r.data),
  getNotification: (id: string) =>
    client.get<Notification>(`/notifications/${id}`).then(r => r.data),

  // Receipts
  getFailedReceipts: () =>
    client.get<FailedReceipt[]>('/receipts/failed').then(r => r.data),
  retryReceipt: (id: string) =>
    client.post<{ success: boolean; tx?: string; error?: string }>(`/receipts/${id}/retry`).then(r => r.data),
  retryAllReceipts: () =>
    client.post<{ retried: number; succeeded: number; failed: number }>('/receipts/retry-all').then(r => r.data),

  // Email Health
  getEmailHealth: () =>
    client.get<EmailHealth>('/email-health').then(r => r.data),

  // Design Partners
  getDesignPartners: (status?: string) =>
    client.get<PaginatedResponse<DesignPartner>>('/design-partners', { params: status ? { status } : undefined }).then(r => r.data),
  getDesignPartner: (id: string) =>
    client.get<DesignPartner>(`/design-partners/${id}`).then(r => r.data),
  addDesignPartner: (data: { protocol_id: string; retainer_amount_cents: number; retainer_start: string; equity_warrant_issued: boolean; notes?: string }) =>
    client.post<DesignPartner>('/design-partners', data).then(r => r.data),
  updateDesignPartner: (id: string, data: Partial<DesignPartner>) =>
    client.put<DesignPartner>(`/design-partners/${id}`, data).then(r => r.data),
  updateDesignPartnerNotes: (id: string, notes: string) =>
    client.post<DesignPartner>(`/design-partners/${id}/notes`, { notes }).then(r => r.data),

  // Incidents
  getIncidents: (filters?: IncidentFilters) =>
    client.get<PaginatedResponse<Incident>>('/incidents', { params: filters }).then(r => r.data),
  getIncident: (id: string) =>
    client.get<Incident>(`/incidents/${id}`).then(r => r.data),
  createIncident: (data: { severity: string; title: string; description: string; affected_component: string }) =>
    client.post<Incident>('/incidents', data).then(r => r.data),
  updateIncidentStatus: (id: string, data: { status: string; resolution?: string }) =>
    client.put<Incident>(`/incidents/${id}/status`, data).then(r => r.data),
  addTimelineEntry: (id: string, message: string) =>
    client.post<IncidentTimelineEntry>(`/incidents/${id}/timeline`, { message }).then(r => r.data),

  // Team
  getTeam: () =>
    client.get<TeamMember[]>('/team').then(r => r.data),
  inviteTeamMember: (data: { display_name: string; role: string; auth_method: string; wallet_address?: string; email?: string }) =>
    client.post<TeamMember>('/team/invite', data).then(r => r.data),
  updateTeamRole: (id: string, role: string) =>
    client.put<TeamMember>(`/team/${id}/role`, { role }).then(r => r.data),
  removeTeamMember: (id: string) =>
    client.delete<{ success: boolean }>(`/team/${id}`).then(r => r.data),
}