import type { EmailHealth } from '../../types/api'

export const mockEmailHealth: EmailHealth = {
  reputation_score: 98,
  bounce_rate_percent: 0.8,
  complaint_rate_percent: 0.01,
  sending_quota_24h: 1_000_000,
  sends_last_24h: 142_893,
  dkim_status: 'pass',
  spf_status: 'pass',
  dmarc_status: 'pass',
  dedicated_ip: '54.240.1.1',
  warmup_complete: true,
  reputation_history: [
    { date: '2026-03-22', score: 97 },
    { date: '2026-03-23', score: 98 },
    { date: '2026-03-24', score: 98 },
    { date: '2026-03-25', score: 97 },
    { date: '2026-03-26', score: 98 },
    { date: '2026-03-27', score: 99 },
    { date: '2026-03-28', score: 98 },
  ],
}
