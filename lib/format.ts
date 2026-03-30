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