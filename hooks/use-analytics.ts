'use client'

import { track } from '@/lib/analytics'

/**
 * Typed analytics hook for explicit admin panel events.
 * Event naming convention: <noun>_<past_tense_verb>
 *
 * All events flow through lib/analytics.ts → posthog.capture().
 */

type AnalyticsEvent =
  | { event: 'protocol_suspended';             props: { protocol_id: string; protocol_name: string; reason_length: number } }
  | { event: 'protocol_activated';             props: { protocol_id: string; protocol_name: string } }
  | { event: 'protocol_unsuspended';           props: { protocol_id: string; protocol_name: string } }
  | { event: 'protocol_tier_changed';          props: { protocol_id: string; protocol_name: string; old_tier: number; new_tier: number } }
  | { event: 'protocol_verified';              props: { protocol_id: string; protocol_name: string } }
  | { event: 'protocol_verification_rejected'; props: { protocol_id: string; protocol_name: string } }
  | { event: 'protocol_deleted';               props: { protocol_id: string } }
  | { event: 'moderation_approved';            props: { item_id: string; type: string; severity: string } }
  | { event: 'moderation_dismissed';           props: { item_id: string; type: string } }
  | { event: 'moderation_strike_issued';       props: { item_id: string; protocol_id: string; strike_count: number; force_suspend: boolean } }
  | { event: 'incident_created';               props: { incident_id: string; severity: string; title: string } }
  | { event: 'incident_resolved';              props: { incident_id: string; severity: string } }
  | { event: 'design_partner_added';           props: { protocol_id: string; billing_type: string; pipeline_stage: string } }
  | { event: 'team_member_invited';            props: { role: string; auth_method: string } }
  | { event: 'team_member_removed';            props: { role: string } }

export function useAnalytics() {
  function capture<T extends AnalyticsEvent['event']>(
    event: T,
    props: Extract<AnalyticsEvent, { event: T }>['props'],
  ) {
    track(event, props as Record<string, unknown>)
  }

  return { capture }
}
