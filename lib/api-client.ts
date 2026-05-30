import axios from 'axios'
import type {
  Protocol,
  Notification,
  FailedReceipt,
  EmailHealth,
  DesignPartner,
  PipelineStage,
  CampaignSource,
  BillingType,
  Incident,
  IncidentTimelineEntry,
  TeamMember,
  PaginatedResponse,
  ProtocolFilters,
  NotificationFilters,
  IncidentFilters,
  OverviewStats,
  ModerationQueueItem,
  ModerationFilters,
  AuditLogEntry,
  PendingTemplate,
  TemplateDetail,
  TemplateAnalysis,
  TemplateFilters,
  AbuseReport,
  AbuseReportFilters,
  SupportTicket,
  SupportFilters,
  SupportTicketListResponse,
} from '../types/api'
import type { Tier } from '../types/billing'

const client = axios.create({
  baseURL: '/api/admin',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Sign out and redirect to login when the session is gone or expired.
// Using /api/auth/signout clears the NextAuth cookie so the login page
// doesn't re-enter the loop with the stale token.
let _authRedirectPending = false
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401 && !_authRedirectPending) {
      _authRedirectPending = true
      window.location.href = '/signout'
    }
    return Promise.reject(error)
  }
)

export const apiClient = {
  // Overview
  getOverview: (params?: { days?: number }) =>
    client.get<OverviewStats>('/overview', { params }).then(r => r.data),

  // Protocols
  getProtocols: (filters?: ProtocolFilters) =>
    client.get<PaginatedResponse<Protocol>>('/protocols', { params: filters }).then(r => r.data),
  getProtocol: (id: string) =>
    client.get<Protocol>(`/protocols/${id}`).then(r => r.data),
  suspendProtocol: (id: string, reason: string) =>
    client.put<Protocol>(`/protocols/${id}/suspend`, { reason }).then(r => r.data),
  unsuspendProtocol: (id: string) =>
    client.put<Protocol>(`/protocols/${id}/unsuspend`).then(r => r.data),
  activateProtocol: (id: string) =>
    client.put<Protocol>(`/protocols/${id}/activate`).then(r => r.data),
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

  // Metrics
  getMetrics: () =>
    client.get<{ activeProtocols: number; totalWebhooks: number; notificationsSent: number }>('/metrics').then(r => r.data),

  // Email Health
  getEmailHealth: () =>
    client.get<EmailHealth>('/email-health').then(r => r.data),

  // Design Partners
  getDesignPartners: (params?: { status?: string; pipeline_stage?: PipelineStage }) =>
    client.get<PaginatedResponse<DesignPartner>>('/design-partners', { params }).then(r => r.data),
  getDesignPartner: (id: string) =>
    client.get<DesignPartner>(`/design-partners/${id}`).then(r => r.data),
  addDesignPartner: (data: {
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
  }) =>
    client.post<DesignPartner>('/design-partners', data).then(r => r.data),
  updateDesignPartner: (id: string, data: Partial<DesignPartner> & { pipeline_stage?: PipelineStage }) =>
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

  // Protocol actions
  verifyProtocol: (id: string, note?: string) =>
    client.put<Protocol>(`/protocols/${id}/verify`, { note }).then(r => r.data),
  rejectVerification: (id: string, note: string) =>
    client.put<Protocol>(`/protocols/${id}/reject-verification`, { note }).then(r => r.data),
  deleteProtocol: (id: string) =>
    client.delete<{ success: boolean }>(`/protocols/${id}`).then(r => r.data),
  getProtocolAuditLog: (id: string, params?: { page?: number; per_page?: number }) =>
    client.get<PaginatedResponse<AuditLogEntry>>(`/protocols/${id}/audit-log`, { params }).then(r => r.data),
  getProtocolTelegramSettings: (id: string) =>
    client.get<ProtocolTelegramSettings>(`/protocols/${id}/telegram`).then(r => r.data),

  // Moderation
  getModerationQueue: (filters?: ModerationFilters) =>
    client.get<PaginatedResponse<ModerationQueueItem>>('/moderation/queue', { params: filters }).then(r => r.data),
  getModerationQueueItem: (id: string) =>
    client.get<ModerationQueueItem>(`/moderation/queue/${id}`).then(r => r.data),
  approveModeration: (id: string) =>
    client.post<{ success: boolean; resolution: string }>(`/moderation/${id}/approve`).then(r => r.data),
  strikeProtocol: (id: string, data: { reason: string; suspend?: boolean }) =>
    client.post<{ success: boolean; strike_count: number; suspended: boolean }>(`/moderation/${id}/strike`, data).then(r => r.data),
  dismissModeration: (id: string) =>
    client.post<{ success: boolean; resolution: string }>(`/moderation/${id}/dismiss`).then(r => r.data),

  // Template review
  getPendingTemplates: (filters?: TemplateFilters) =>
    client.get<PaginatedResponse<PendingTemplate>>('/templates/pending', { params: filters }).then(r => r.data),
  getTemplate: (id: string) =>
    client.get<TemplateDetail>(`/templates/${id}`).then(r => r.data),
  analyzeTemplate: (id: string) =>
    client.post<TemplateAnalysis>(`/templates/${id}/analyze`).then(r => r.data),
  approveTemplate: (id: string) =>
    client.post<{ success: boolean }>(`/templates/${id}/approve`).then(r => r.data),
  rejectTemplate: (id: string, reason: string) =>
    client.post<{ success: boolean }>(`/templates/${id}/reject`, { reason }).then(r => r.data),

  // Abuse Reports (Sprint 5)
  getAbuseReports: (filters?: AbuseReportFilters) =>
    client.get<PaginatedResponse<AbuseReport>>('/reports', { params: filters }).then(r => r.data),

  // Support tickets (admin)
  getSupportTickets: (filters?: SupportFilters) =>
    client.get<SupportTicketListResponse>('/admin/support/tickets', { params: filters }).then(r => r.data),
  getSupportTicket: (id: string) =>
    client.get<SupportTicket>(`/admin/support/tickets/${id}`).then(r => r.data),
  adminReplyToTicket: (id: string, body: string, isInternal?: boolean) =>
    client.post<{ id: string }>(`/admin/support/tickets/${id}/reply`, { body, isInternal }).then(r => r.data),
  updateTicketStatus: (id: string, status: string, resolutionNote?: string) =>
    client.put<SupportTicket>(`/admin/support/tickets/${id}/status`, { status, resolutionNote }).then(r => r.data),
  assignTicket: (id: string, adminUserId: string) =>
    client.put<SupportTicket>(`/admin/support/tickets/${id}/assign`, { adminUserId }).then(r => r.data),
  updateTicketPriority: (id: string, priority: string) =>
    client.put<SupportTicket>(`/admin/support/tickets/${id}/priority`, { priority }).then(r => r.data),

  // Solana infrastructure
  getAuthority: () =>
    client.get<{ address: string; solBalance: number; lamports: number; funded: boolean }>('/authority').then(r => r.data),
  initializeOnchainConfig: () =>
    client.post<{ status: 'initialized' | 'already_initialized'; tx?: string; message?: string }>('/authority/initialize-config').then(r => r.data),

  // Team
  getTeam: () =>
    client.get<TeamMember[]>('/team').then(r => r.data),
  inviteTeamMember: (data: { display_name: string; role: string; auth_method: string; wallet_address?: string; email?: string }) =>
    client.post<TeamMember>('/team/invite', data).then(r => r.data),
  updateTeamRole: (id: string, role: string) =>
    client.put<TeamMember>(`/team/${id}/role`, { role }).then(r => r.data),
  removeTeamMember: (id: string) =>
    client.delete<{ success: boolean }>(`/team/${id}`).then(r => r.data),

  // AWS Costs
  getAwsCosts: () =>
    client.get<AwsCostSummary>('/aws-costs').then(r => r.data),
  clearAwsCostCache: () =>
    client.post<{ cleared: boolean }>('/aws-costs/cache/clear').then(r => r.data),

  // Broadcasts
  sendBroadcast: (data: SendBroadcastPayload) =>
    client.post<{ broadcastId: string; protocolsTargeted: number; emailsSent: number }>('/broadcasts', data).then(r => r.data),
  getBroadcasts: (params?: { page?: number; per_page?: number }) =>
    client.get<PaginatedResponse<BroadcastMessage>>('/broadcasts', { params }).then(r => r.data),
  getBroadcast: (id: string) =>
    client.get<BroadcastMessage & { stats: { read: number; emailsSent: number } }>(`/broadcasts/${id}`).then(r => r.data),
}

// ─── Broadcast types ─────────────────────────────────────────────────────────

export type BroadcastType = 'maintenance' | 'incident' | 'changelog' | 'general' | 'announcement'
export type BroadcastTargetMode = 'all' | 'active' | 'tier' | 'selected'

export interface BroadcastMessage {
  id: string
  title: string
  body: string
  type: BroadcastType
  targetMode: BroadcastTargetMode
  targetTier: number | null
  targetIds: string[]
  sentCount: number
  sentBy: string | null
  createdAt: string
}

export interface SendBroadcastPayload {
  title: string
  body: string
  type: BroadcastType
  targetMode: BroadcastTargetMode
  targetTier?: number
  targetIds?: string[]
}

// ─── AWS Cost types (used by api-client + useAwsCosts hook) ───────────────────

export interface AwsServiceCost {
  name: string
  amount: number
  unit: string
}

export interface AwsDailyEntry {
  date: string
  total: number
  services: { name: string; amount: number }[]
}

export interface AwsCostSummary {
  currentMonth: { period: { start: string; end: string }; services: AwsServiceCost[]; total: number }
  previousMonth: { period: { start: string; end: string }; services: AwsServiceCost[]; total: number }
  dailyBreakdown: AwsDailyEntry[]
  forecast: { forecastedAmount: number; unit: string } | null
}

export interface ProtocolTelegramSettings {
  configured: boolean
  botUsername: string | null
  groupChatId: string | null
  threadIds: Record<string, string> | null
  subscribers: number
  last30Days: {
    delivered: number
    failed: number
    total: number
    deliveryRate: number | null
  }
}