import type { DesignPartner } from '../../types/api'

export const mockDesignPartners: DesignPartner[] = [
  {
    id: 'dp_01',
    protocol_id: '01HXKP9M2Q3R5S6T7U8V9W0X',
    protocol_name: 'Drift Protocol',
    retainer_amount_cents: 100000,
    retainer_start: '2026-01-01T00:00:00Z',
    retainer_end: '2026-12-31T23:59:59Z',
    status: 'active',
    feedback_sessions: 12,
    sends_this_period: 847293,
    equity_warrant_issued: true,
    notes: 'Key design partner for v2 engine.',
    created_at: '2026-01-01T09:00:00Z',
  },
  {
    id: 'dp_02',
    protocol_id: '01HXKP9M2Q3R5S6T7U8V9W0Y',
    protocol_name: 'Jupiter Aggregator',
    retainer_amount_cents: 250000,
    retainer_start: '2026-02-15T00:00:00Z',
    retainer_end: '2027-02-14T23:59:59Z',
    status: 'active',
    feedback_sessions: 4,
    sends_this_period: 2341087,
    equity_warrant_issued: true,
    notes: 'Enterprise partner with high volume requirements.',
    created_at: '2026-02-15T14:00:00Z',
  },
]