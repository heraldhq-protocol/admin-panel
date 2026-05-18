/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign, TrendingUp, Users, ArrowUpRight, AlertTriangle, Handshake,
} from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useProtocols } from '@/hooks/use-protocols'
import { useDesignPartners } from '@/hooks/use-design-partners'
import { cn } from '@/lib/cn'
import { truncateAddress } from '@/lib/format'
import type { Protocol } from '@/types/api'

// ─── Pricing constants ─────────────────────────────────────────────────────────
// Monthly pricing per tier (USD)
const TIER_PRICE_USD: Record<number, number> = {
  0: 0,
  1: 99,
  2: 499,
  3: 2_000,
}

const TIER_LABEL: Record<number, string> = {
  0: 'Developer',
  1: 'Growth',
  2: 'Scale',
  3: 'Enterprise',
}

const TIER_SEND_LIMITS: Record<number, number> = {
  0: 1_000,
  1: 50_000,
  2: 500_000,
  3: 10_000_000,
}

const TIER_VARIANTS: Record<number, string> = {
  0: 'developer',
  1: 'growth',
  2: 'scale',
  3: 'enterprise',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtUSD(cents: number) {
  if (cents >= 100_000) return `$${(cents / 100_000).toFixed(1)}k`
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number) {
  return `${n.toFixed(0)}%`
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon,
  accent = 'teal',
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: 'teal' | 'amber' | 'purple' | 'red' | 'blue'
}) {
  const colors: Record<string, string> = {
    teal:   'bg-teal/10 text-teal',
    amber:  'bg-amber-900/30 text-amber-300',
    purple: 'bg-purple-900/30 text-purple-300',
    red:    'bg-red/10 text-red',
    blue:   'bg-blue-900/30 text-blue-300',
  }

  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', colors[accent])}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-black font-syne text-text-primary">{value}</div>
        {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter()

  const { data: allProtocols, isLoading: loadingProtocols } = useProtocols({ per_page: 200 } as never)
  const { data: designPartners, isLoading: loadingPartners } = useDesignPartners({ status: 'active' })

  const isLoading = loadingProtocols || loadingPartners

  const protocols: Protocol[] = allProtocols?.data ?? []

  // ── Revenue computations ───────────────────────────────────────────────────

  const tierCounts = React.useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
    protocols.forEach((p) => { counts[p.tier] = (counts[p.tier] ?? 0) + 1 })
    return counts
  }, [protocols])

  // MRR from paid tiers (cents)
  const tierMrrCents = React.useMemo(() =>
    [1, 2, 3].reduce((sum, tier) => sum + (tierCounts[tier] ?? 0) * TIER_PRICE_USD[tier]! * 100, 0),
  [tierCounts])

  // MRR from design partner retainers (cents)
  const retainerMrrCents = React.useMemo(() =>
    (designPartners?.data ?? []).reduce((sum, dp) => {
      if (dp.billing_type !== 'retainer') return sum
      return sum + (dp.retainer_amount_cents ?? 0)
    }, 0),
  [designPartners])

  const totalMrrCents = tierMrrCents + retainerMrrCents
  const arrCents = totalMrrCents * 12

  // Paying protocols (Growth+)
  const payingCount = (tierCounts[1] ?? 0) + (tierCounts[2] ?? 0) + (tierCounts[3] ?? 0)

  // Protocols near their send limit (>= 80%)
  const nearLimitProtocols = React.useMemo(() =>
    protocols
      .filter((p) => {
        const limit = TIER_SEND_LIMITS[p.tier] ?? 1
        return (p.sends_this_period / limit) >= 0.8 && p.is_active
      })
      .sort((a, b) => {
        const aLimit = TIER_SEND_LIMITS[a.tier] ?? 1
        const bLimit = TIER_SEND_LIMITS[b.tier] ?? 1
        return (b.sends_this_period / bLimit) - (a.sends_this_period / aLimit)
      }),
  [protocols])

  // ── Tier revenue breakdown ─────────────────────────────────────────────────

  const tierRevenue = [1, 2, 3].map((tier) => ({
    tier,
    count: tierCounts[tier] ?? 0,
    mrrCents: (tierCounts[tier] ?? 0) * TIER_PRICE_USD[tier]! * 100,
    label: TIER_LABEL[tier]!,
    variant: TIER_VARIANTS[tier]!,
  }))

  const maxMrrCents = Math.max(...tierRevenue.map((t) => t.mrrCents), 1)

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Billing Overview"
        description="Revenue metrics, tier distribution, and upgrade signals across all protocols."
      />

      {/* Stats row */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total MRR"
            value={fmtUSD(totalMrrCents)}
            sub="Tiers + design partners"
            icon={<DollarSign size={16} />}
            accent="teal"
          />
          <MetricCard
            label="ARR (projected)"
            value={fmtUSD(arrCents)}
            sub="MRR × 12"
            icon={<TrendingUp size={16} />}
            accent="purple"
          />
          <MetricCard
            label="Paying Protocols"
            value={payingCount.toString()}
            sub={`of ${protocols.length} total`}
            icon={<Users size={16} />}
            accent="blue"
          />
          <MetricCard
            label="Near Limit"
            value={nearLimitProtocols.length.toString()}
            sub="Upgrade candidates ≥80%"
            icon={<AlertTriangle size={16} />}
            accent={nearLimitProtocols.length > 0 ? 'amber' : 'teal'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tier revenue breakdown */}
        <Card padding="lg" className="flex flex-col gap-5">
          <h3 className="font-syne text-base font-bold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-teal" />
            Revenue by Tier
          </h3>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {tierRevenue.map((t) => (
                <div key={t.tier} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={t.variant as never}>{t.label.toUpperCase()}</Badge>
                      <span className="text-xs text-text-muted">{t.count} protocol{t.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {fmtUSD(t.mrrCents)}/mo
                    </span>
                  </div>
                  <div className="w-full h-2 bg-card-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all"
                      style={{ width: `${(t.mrrCents / maxMrrCents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border flex justify-between text-sm">
                <span className="text-text-muted font-medium">Tier MRR</span>
                <span className="font-mono font-bold text-teal">{fmtUSD(tierMrrCents)}/mo</span>
              </div>
            </div>
          )}
        </Card>

        {/* Upgrade candidates */}
        <Card padding="lg" className="lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-base font-bold flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-amber-400" />
              Upgrade Candidates
            </h3>
            <span className="text-xs text-text-muted">≥80% of send limit used this period</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
            </div>
          ) : nearLimitProtocols.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
              <TrendingUp className="h-8 w-8 opacity-30" />
              <p className="text-sm">No protocols near their send limit.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] text-text-muted uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="pb-2 text-left font-bold">Protocol</th>
                    <th className="pb-2 text-left font-bold">Current Tier</th>
                    <th className="pb-2 text-right font-bold">Usage</th>
                    <th className="pb-2 text-right font-bold">Next Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {nearLimitProtocols.map((p) => {
                    const limit = TIER_SEND_LIMITS[p.tier] ?? 1
                    const pct = Math.min((p.sends_this_period / limit) * 100, 100)
                    const nextTier = p.tier < 3 ? p.tier + 1 : null

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-card-2 cursor-pointer transition-colors"
                        onClick={() => router.push(`/protocols/${p.id}`)}
                      >
                        <td className="py-2.5">
                          <div className="font-bold text-text-primary">{p.name}</div>
                          <code className="text-[10px] text-text-muted">
                            {truncateAddress(p.protocol_pubkey, 6)}
                          </code>
                        </td>
                        <td className="py-2.5">
                          <Badge variant={TIER_VARIANTS[p.tier] as never}>
                            {TIER_LABEL[p.tier]?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className={cn(
                            'font-mono text-xs font-bold',
                            pct >= 95 ? 'text-red' : pct >= 80 ? 'text-amber-400' : 'text-text-primary',
                          )}>
                            {fmtPct(pct)}
                          </div>
                          <div className="w-20 h-1 bg-card-2 rounded-full overflow-hidden ml-auto mt-1">
                            <div
                              className={cn('h-full rounded-full', pct >= 95 ? 'bg-red' : 'bg-amber-400')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          {nextTier ? (
                            <div className="text-xs text-text-muted">
                              <Badge variant={TIER_VARIANTS[nextTier] as never}>
                                {TIER_LABEL[nextTier]?.toUpperCase()}
                              </Badge>
                              <div className="text-[10px] mt-0.5 text-right">
                                {fmtUSD(TIER_PRICE_USD[nextTier]! * 100)}/mo
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">At max tier</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Design partner retainers */}
      <Card padding="lg" className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-syne text-base font-bold flex items-center gap-2">
            <Handshake className="h-4 w-4 text-teal" />
            Design Partner Retainers
          </h3>
          <span className="font-mono text-sm font-bold text-teal">
            {isLoading ? '—' : `${fmtUSD(retainerMrrCents)}/mo`}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
          </div>
        ) : !designPartners?.data || designPartners.data.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No active design partners.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] text-text-muted uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="pb-2 text-left font-bold">Partner</th>
                  <th className="pb-2 text-left font-bold">Billing</th>
                  <th className="pb-2 text-left font-bold">Stage</th>
                  <th className="pb-2 text-right font-bold">MRR</th>
                  <th className="pb-2 text-right font-bold">Retainer End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {designPartners.data.map((dp) => (
                  <tr
                    key={dp.id}
                    className="hover:bg-card-2 cursor-pointer transition-colors"
                    onClick={() => router.push(`/design-partners/${dp.id}`)}
                  >
                    <td className="py-2.5">
                      <div className="font-bold text-text-primary">{dp.protocol_name}</div>
                      {dp.contact_name && (
                        <div className="text-[10px] text-text-muted">{dp.contact_name}</div>
                      )}
                    </td>
                    <td className="py-2.5">
                      <Badge variant={dp.billing_type === 'retainer' ? 'active' : 'developer'}>
                        {dp.billing_type === 'retainer' ? 'Retainer' : 'Tier Grant'}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs capitalize text-text-secondary">
                        {dp.pipeline_stage?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs font-bold text-text-primary">
                      {dp.billing_type === 'retainer'
                        ? fmtUSD(dp.retainer_amount_cents)
                        : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="py-2.5 text-right text-xs text-text-muted">
                      {dp.retainer_end
                        ? new Date(dp.retainer_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : 'Ongoing'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
