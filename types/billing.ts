export type { Tier } from './api'

export const TIER_CONFIG = {
  0: { name: 'Developer', price_cents: 0,      sends: 1_000,     rps: 2   },
  1: { name: 'Growth',    price_cents: 9900,    sends: 50_000,    rps: 20  },
  2: { name: 'Scale',     price_cents: 29900,   sends: 250_000,   rps: 100 },
  3: { name: 'Enterprise',price_cents: 99900,   sends: 1_000_000, rps: 500 },
} as const satisfies Record<import('./api').Tier, {
  name: string; price_cents: number; sends: number; rps: number
}>