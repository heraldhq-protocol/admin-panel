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

export type PipelineStage =
  | 'prospect'
  | 'outreach'
  | 'negotiating'
  | 'signed'
  | 'active'
  | 'on_hold'
  | 'churned'

export type CampaignSource =
  | 'conference'
  | 'twitter'
  | 'referral'
  | 'cold_outreach'
  | 'inbound'
  | 'colosseum'
  | 'other'

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
  contact_email_hash: string | null  // SHA-256 — NEVER plaintext. null when protocol has no settings record.
  design_partner: boolean
  admin_notes: string | null          // internal admin notes — never shown to protocol
  verification_status: string
  is_suspended: boolean
  strike_count: number
  strikes_reset_at: string | null
  last_strike_at: string | null
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
  reputation_score: number | null    // 0-100; null when SES_REGION not configured
  bounce_rate_percent: number | null // alarm threshold: > 5%
  complaint_rate_percent: number | null // alarm threshold: > 0.1%
  sending_quota_24h: number | null
  sends_last_24h: number
  dkim_status: 'pass' | 'fail' | 'unknown'
  spf_status: 'pass' | 'fail' | 'unknown'
  dmarc_status: 'pass' | 'fail' | 'unknown'
  dedicated_ip: string
  warmup_complete: boolean
  reputation_history: Array<{ date: string; score: number }>
  resend?: {
    configured: boolean
    api_status: 'ok' | 'error' | 'unconfigured'
    sends_last_24h: number
    bounces_last_24h: number
  }
  _no_aws_region?: boolean
  _error?: string
}

export type BillingType = 'retainer' | 'tier_grant'

export interface DesignPartner {
  id: string
  protocol_id: string
  protocol_name: string
  retainer_amount_cents: number
  retainer_start: string
  retainer_end: string | null
  status: PartnerStatus
  feedback_sessions: number
  sends_this_period: number
  equity_warrant_issued: boolean
  notes: string | null
  contact_name: string | null
  contact_email: string | null
  pipeline_stage: PipelineStage
  campaign_source: CampaignSource | null
  billing_type: BillingType
  granted_tier: 0 | 1 | 2 | 3 | null
  tier_grant_expires_at: string | null
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


export interface OverviewStats {
  sends_today: number
  sends_today_delta: number
  delivery_rate_24h: number
  delivery_rate_delta: number
  open_incidents: number
  pending_verifications: number
  recent_activity: Array<{
    id: string
    description: string
    created_at: string
  }>
  sends_per_day: Array<{
    date: string
    sends: number
  }>
}


// ─── Moderation ───────────────────────────────────────────────────────
export type ModerationItemType =
  | 'protocol_registration'
  | 'content_scan'
  | 'health_degradation'
  | 'user_report'

export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ModerationResolution = 'approved' | 'struck' | 'dismissed'

export interface ModerationQueueItem {
  id: string
  type: ModerationItemType
  protocol_id: string
  protocol_name: string
  severity: ModerationSeverity
  flag_reason: string
  ai_scan_result: { verdict: string; reason: string; confidence: number } | null
  rules_triggers: string[]
  protocol_status: {
    verification_status: string
    is_suspended: boolean
    strike_count: number
    strikes_reset_at: string | null
    last_strike_at: string | null
    strike_reasons: Array<{ date: string; reason: string; actionTaken: string }> | null
    registration_flags: Record<string, unknown> | null
  }
  resolved_at: string | null
  resolved_by: string | null
  resolution: ModerationResolution | null
  created_at: string
}

export interface ModerationFilters {
  page?: number
  per_page?: number
  type?: ModerationItemType
  severity?: ModerationSeverity
  resolved?: boolean
}

export interface AuditLogEntry {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  old_value: unknown
  new_value: unknown
  actor_role: string | null
  timestamp: string
}

// ─── Template Review ──────────────────────────────────────────────────
export type TemplateStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED'

export interface PendingTemplate {
  id: string
  name: string
  category: string
  subject_template: string | null
  version: number
  status: TemplateStatus
  protocol: {
    id: string
    name: string
    verification_status: string
    is_suspended: boolean
  }
  updated_at: string
  created_at: string
}

export interface TemplateFilters {
  page?: number
  per_page?: number
  protocol_id?: string
}

export interface TemplateVersion {
  id: string
  version: number
  subject_template: string | null
  created_at: string
}

export interface TemplateDetail extends PendingTemplate {
  html_source: string | null
  text_source: string | null
  preview_text: string | null
  herald_footer: string
  is_active: boolean
  is_default: boolean
  versions: TemplateVersion[]
  protocol: PendingTemplate['protocol'] & { tier: number }
}

export interface TemplateAnalysis {
  source: 'ai' | 'rule-based'
  spam_score: number
  tone: string
  flags: string[]
  compliance_flags?: string[]
  security_flags?: string[]
  quality_flags?: string[]
  suggestions: string[]
  summary: string
}

// ─── Abuse Reports ────────────────────────────────────────────────────
export interface AbuseReport {
  protocol_id: string
  protocol_name: string
  total_reports: number
  unique_reporters: number
  most_common_reason: string
  last_reported_at: string | null
  open_moderation_item: boolean
  moderation_queue_id: string | null
}

export interface AbuseReportFilters {
  page?: number
  per_page?: number
  protocol_id?: string
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