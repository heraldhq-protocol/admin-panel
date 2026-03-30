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
  reputation_history: Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-03-22')
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toISOString().slice(0, 10),
      score: 95 + Math.floor(Math.random() * 5),
    }
  }),
}
