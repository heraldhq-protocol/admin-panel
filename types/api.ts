import type { AdminRole, AuthMethod } from './auth'

// ─── Enums ────────────────────────────────────────────────────────────
export type Tier = 0 | 1 | 2 | 3
// 0 = Developer | 1 = Growth | 2 = Scale | 3 = Enterprise

export type ProtocolStatus = 'active' | 'suspended'

export type NotificationStatus =
  | 'queued' | 'processing' | 'delivered' | 'failed' | 'opted_out'

export type NotificationCategory =
  | 'defi' | 'governance' | 'system' | 'marketing'

export type IncidentSeverity = 'P0' | 'P1' | 'P2' | 'P3'
export type IncidentStatus = 'open' | 'investigating' | 'resolved'

export type PartnerStatus = 'active' | 'inactive' | 'pending'

// ─── Core entities ────────────────────────────────────────────────────
export interface Protocol {
  id: string                        // ULID
  protocol_pubkey: string           // base58 Solana pubkey
  name: string                      // display name (not encrypted in admin)
  tier: Tier
  is_active: boolean
  suspension_reason: string | null
  sends_this_period: number
  sends_limit: number
  period_reset_at: string           // ISO datetime
  created_at: string
  stripe_customer_id: string | null
  contact_email_hash: string        // SHA-256 — NEVER plaintext
  design_partner: boolean
}

export interface Notification {
  id: string
  protocol_id: string
  protocol_name: string             // joined from protocols
  wallet_hash: string               // SHA-256(wallet_pubkey) — never pubkey
  status: NotificationStatus
  category: NotificationCategory
  queued_at: string
  delivered_at: string | null
  receipt_tx: string | null
  bounce: boolean
  error_code: string | null
  latency_ms: number | null
}

export interface FailedReceipt {
  id: string
  notification_id: string
  protocol_id: string
  protocol_name: string
  failure_reason: string
  retry_count: number               // max 3
  last_attempted_at: string
  created_at: string
}

export interface EmailHealth {
  reputation_score: number          // 0-100
  bounce_rate_percent: number       // alarm threshold: > 5%
  complaint_rate_percent: number    // alarm threshold: > 0.1%
  sending_quota_24h: number
  sends_last_24h: number
  dkim_status: 'pass' | 'fail' | 'unknown'
  spf_status: 'pass' | 'fail' | 'unknown'
  dmarc_status: 'pass' | 'fail' | 'unknown'
  dedicated_ip: string
  warmup_complete: boolean
  reputation_history: Array<{ date: string; score: number }>
}

export interface DesignPartner {
  id: string
  protocol_id: string
  protocol_name: string
  retainer_amount_cents: number     // $1,000/month = 100000
  retainer_start: string
  retainer_end: string
  status: PartnerStatus
  feedback_sessions: number
  sends_this_period: number
  equity_warrant_issued: boolean
  notes: string | null
  created_at: string
}

export interface Incident {
  id: string
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  description: string
  affected_component: string
  detected_at: string
  resolved_at: string | null
  created_by: string                // admin user ID
  resolved_by: string | null
  timeline: IncidentTimelineEntry[]
}

export interface IncidentTimelineEntry {
  id: string
  incident_id: string
  message: string
  author: string
  created_at: string
}

export interface TeamMember {
  id: string
  display_name: string
  role: AdminRole
  auth_method: AuthMethod
  wallet_address_hash: string | null  // SHA-256 if wallet auth
  last_active_at: string | null
  created_at: string
}


// ─── Shared response shapes ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
  field?: string
}

// ─── Filter shapes ────────────────────────────────────────────────────
export interface ProtocolFilters {
  page?: number
  per_page?: number
  search?: string
  tier?: Tier
  is_active?: boolean
  design_partner?: boolean
}

export interface NotificationFilters {
  page?: number
  per_page?: number
  protocol_id?: string
  status?: NotificationStatus
  category?: NotificationCategory
  date_from?: string
  date_to?: string
}

export interface IncidentFilters {
  severity?: IncidentSeverity
  status?: IncidentStatus
}