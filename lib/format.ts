import { formatDistanceToNow } from 'date-fns'
import type { Tier, IncidentSeverity } from '../types'

/**
 * Format relative time (e.g., '2m ago', '3h ago')
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Format large numbers (e.g., 48.3K, 1.2M)
 */
export function formatCount(n: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

/**
 * Truncate Solana address (e.g., '7xR4...uW')
 */
export function truncateAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2) return addr
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`
}

/**
 * Truncate hash (e.g., '5a3f8b2c...')
 */
export function truncateHash(hash: string, chars = 8): string {
  if (hash.length <= chars) return hash
  return `${hash.slice(0, chars)}...`
}

/**
 * Format cents to USD (e.g., 100000 -> '$1,000.00')
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/**
 * Format Tier number to string
 */
export function formatTier(tier: Tier): string {
  const tiers: Record<Tier, string> = {
    0: 'Developer',
    1: 'Growth',
    2: 'Scale',
    3: 'Enterprise',
  }
  return tiers[tier]
}

/**
 * Format Severity to display string
 */
export function formatSeverity(sev: IncidentSeverity): string {
  const severities: Record<IncidentSeverity, string> = {
    P0: 'P0 — Critical',
    P1: 'P1 — High',
    P2: 'P2 — Medium',
    P3: 'P3 — Low',
  }
  return severities[sev]
}

const ACTIVITY_LABELS: Record<string, string> = {
  // Protocol CRUD
  'post.protocols': 'Protocol registered',
  'patch.protocols': 'Protocol updated',
  'put.protocols': 'Protocol updated',
  'delete.protocols': 'Protocol deleted',

  // API keys
  'post.api-keys': 'API key created',
  'patch.api-keys': 'API key updated',
  'put.api-keys': 'API key updated',
  'delete.api-keys': 'API key deleted',
  'post.apikeys': 'API key created',
  'delete.apikeys': 'API key deleted',

  // Protocol assets
  'protocol_asset.create': 'Protocol asset added',
  'protocol_asset.delete': 'Protocol asset removed',
  'protocol_asset.update': 'Protocol asset updated',

  // Sandbox / settings
  'protocol.sandbox_settings.update': 'Sandbox settings updated',
  'protocol.settings.update': 'Protocol settings updated',

  // Notifications
  'post.notifications': 'Notification sent',
  'patch.notifications': 'Notification updated',
  'delete.notifications': 'Notification deleted',

  // Moderation
  'protocol.suspend': 'Protocol suspended',
  'protocol.unsuspend': 'Protocol unsuspended',
  'protocol.reactivate': 'Protocol reactivated',
  'protocol.strike': 'Strike issued',
  'protocol.verify': 'Protocol verified',
  'protocol.tier_change': 'Tier changed',
  'tier.change': 'Tier changed',

  // Incidents
  'post.incidents': 'Incident created',
  'patch.incidents': 'Incident updated',
  'delete.incidents': 'Incident deleted',
  'incident.resolve': 'Incident resolved',

  // Templates
  'post.templates': 'Template created',
  'patch.templates': 'Template updated',
  'delete.templates': 'Template deleted',

  // Team / admins
  'post.admins': 'Admin added',
  'patch.admins': 'Admin updated',
  'delete.admins': 'Admin removed',

  // Design partners
  'post.design-partners': 'Design partner added',
  'patch.design-partners': 'Design partner updated',
  'delete.design-partners': 'Design partner removed',
}

/**
 * Convert a raw backend activity/audit action string into a human-readable label.
 * Handles dot-separated "method.resource" patterns and named action strings.
 */
export function formatActivityDescription(raw: string): string {
  if (!raw) return '—'

  const lower = raw.toLowerCase().trim()

  if (ACTIVITY_LABELS[lower]) return ACTIVITY_LABELS[lower]

  // Generic fallback: replace dots/underscores/hyphens with spaces and title-case
  return lower
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}