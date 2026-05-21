import type { ProtocolFilters, NotificationFilters, IncidentFilters, ModerationFilters, TemplateFilters, SupportFilters } from '../types/api'

export const QUERY_KEYS = {
  overview: () =>
    ['overview'] as const,

  metrics: () =>
    ['metrics'] as const,

  protocols: (filters?: ProtocolFilters) =>
    ['protocols', filters] as const,

  protocol: (id: string) =>
    ['protocol', id] as const,

  notifications: (filters?: NotificationFilters) =>
    ['notifications', filters] as const,

  notification: (id: string) =>
    ['notification', id] as const,

  receiptQueue: () =>
    ['receipt-queue'] as const,

  emailHealth: () =>
    ['email-health'] as const,

  designPartners: () =>
    ['design-partners'] as const,

  designPartner: (id: string) =>
    ['design-partner', id] as const,

  incidents: (filters?: IncidentFilters) =>
    ['incidents', filters] as const,

  incident: (id: string) =>
    ['incident', id] as const,

  team: () =>
    ['team'] as const,

  moderationQueue: (filters?: ModerationFilters) =>
    ['moderation-queue', filters] as const,

  moderationItem: (id: string) =>
    ['moderation-item', id] as const,

  protocolAuditLog: (id: string, page?: number) =>
    ['protocol-audit-log', id, page] as const,

  pendingTemplates: (filters?: TemplateFilters) =>
    ['pending-templates', filters] as const,

  abuseReports: (filters?: { page?: number; protocol_id?: string }) =>
    ['abuse-reports', filters] as const,

  supportTickets: (filters?: SupportFilters) =>
    ['support-tickets', filters] as const,

  supportTicket: (id: string) =>
    ['support-ticket', id] as const,
} as const