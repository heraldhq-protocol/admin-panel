import type { Protocol } from '@/types/api'

export type HealthLabel = 'Healthy' | 'Warning' | 'At Risk'

/**
 * Computes a 0–100 health score for a protocol from fields already returned
 * by GET /v1/admin/protocols/:id. No extra API calls required.
 *
 * Weights:
 *   - Active status:        30 pts
 *   - Strike count:         25 pts (−8 per strike, capped)
 *   - Quota usage:          25 pts (penalised when >80% used)
 *   - Verification status:  20 pts
 */
export function computeHealthScore(protocol: Protocol): number {
  let score = 100

  // Suspended protocol is immediately at-risk
  if (!protocol.is_active) score -= 30

  // Each strike deducts 8pts, capped at 25
  score -= Math.min(protocol.strike_count * 8, 25)

  // High quota usage signals risk of overage / churn
  const usagePct = protocol.sends_this_period / Math.max(protocol.sends_limit, 1)
  if (usagePct >= 1.0) score -= 25        // over quota
  else if (usagePct >= 0.8) score -= 10   // approaching limit

  // Unverified protocol is lower trust
  if (protocol.verification_status !== 'verified') score -= 20

  return Math.max(0, Math.round(score))
}

export function healthLabel(score: number): HealthLabel {
  if (score >= 80) return 'Healthy'
  if (score >= 50) return 'Warning'
  return 'At Risk'
}

export function healthVariant(score: number): 'active' | 'developer' | 'suspended' {
  if (score >= 80) return 'active'
  if (score >= 50) return 'developer'
  return 'suspended'
}
