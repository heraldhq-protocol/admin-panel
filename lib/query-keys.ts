import type { ProtocolFilters, NotificationFilters, IncidentFilters } from '../types'

export const QUERY_KEYS = {
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
} as const