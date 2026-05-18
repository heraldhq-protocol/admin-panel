/* eslint-disable import/no-default-export */
'use client'

import * as React from 'react'
import {
  TrendingUp, Users, Bell, Percent, Activity,
  Database, ShieldCheck, Zap,
} from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOverview } from '@/hooks/use-overview'
import { useProtocols } from '@/hooks/use-protocols'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

// ─── Tier config ─────────────────────────────────────────────────────────────

const TIERS = [
  { value: 0, label: 'Developer',  color: 'bg-card-2 text-text-muted' },
  { value: 1, label: 'Growth',     color: 'bg-teal/10 text-teal' },
  { value: 2, label: 'Scale',      color: 'bg-violet-bg text-violet' },
  { value: 3, label: 'Enterprise', color: 'bg-amber-bg text-amber' },
]

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, color = '#2dd4bf' }: { data: number[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (v / max) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={`0,100 ${points} 100,100`}
        fill={color}
        fillOpacity="0.08"
        stroke="none"
      />
    </svg>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, delta, icon, color = 'teal', suffix = '',
}: {
  label: string
  value: string | number
  delta?: number
  icon: React.ReactNode
  color?: 'teal' | 'purple' | 'amber' | 'red' | 'blue'
  suffix?: string
}) {
  const colors = {
    teal:   'bg-teal/10 text-teal',
    purple: 'bg-violet-bg text-violet',
    amber:  'bg-amber-bg text-amber',
    red:    'bg-red/10 text-red',
    blue:   'bg-blue-bg text-blue',
  }

  return (
    <Card padding="lg" className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</p>
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', colors[color])}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-black font-syne text-text-primary">
          {value}{suffix}
        </p>
        {delta !== undefined && (
          <p className={cn('text-xs font-medium mt-0.5', delta >= 0 ? 'text-teal' : 'text-red')}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs yesterday
          </p>
        )}
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: overview, isLoading: overviewLoading } = useOverview()
  const { data: allProtocols, isLoading: protocolsLoading } = useProtocols({ per_page: 200 } as never)
  const { data: activeProtocols } = useProtocols({ is_active: true, per_page: 200 } as never)

  const isLoading = overviewLoading || protocolsLoading

  // Tier distribution
  const tierCounts = React.useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
    allProtocols?.data?.forEach((p) => { counts[p.tier] = (counts[p.tier] ?? 0) + 1 })
    return counts
  }, [allProtocols])

  const totalProtocols = allProtocols?.total ?? 0
  const activeCount = activeProtocols?.total ?? 0

  // Volume from last 7 days chart data
  const sendsHistory = overview?.sends_per_day?.slice(-14) ?? []
  const sendsValues = sendsHistory.map((d) => d.sends)

  // Total sends (last 14 days window)
  const totalSendsWindow = sendsValues.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="Platform-wide metrics across all registered protocols."
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Protocols"
            value={totalProtocols.toLocaleString()}
            icon={<Database size={16} />}
            color="teal"
          />
          <StatCard
            label="Active Protocols"
            value={activeCount.toLocaleString()}
            icon={<ShieldCheck size={16} />}
            color="blue"
          />
          <StatCard
            label="Sends Today"
            value={overview?.sends_today != null ? formatCount(overview.sends_today) : '—'}
            delta={overview?.sends_today_delta ?? 0}
            icon={<Bell size={16} />}
            color="purple"
          />
          <StatCard
            label="Delivery Rate (24h)"
            value={overview?.delivery_rate_24h != null
              ? overview.delivery_rate_24h.toFixed(1)
              : '—'}
            delta={overview?.delivery_rate_delta ?? 0}
            suffix="%"
            icon={<Percent size={16} />}
            color={overview?.delivery_rate_24h != null && overview.delivery_rate_24h < 90 ? 'red' : 'teal'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sends volume chart */}
        <Card padding="lg" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-syne font-bold flex items-center gap-2">
              <TrendingUp size={16} className="text-teal" />
              Send Volume (Last 14 Days)
            </h3>
            <span className="text-xs text-text-muted font-mono">
              {formatCount(totalSendsWindow)} total
            </span>
          </div>
          {overviewLoading ? (
            <Skeleton variant="rect" className="h-32" />
          ) : sendsHistory.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">No send data available.</p>
          ) : (
            <div className="space-y-1">
              <Sparkline data={sendsValues} />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>{sendsHistory[0]?.date?.slice(5)}</span>
                <span>{sendsHistory[sendsHistory.length - 1]?.date?.slice(5)}</span>
              </div>
              <div className="grid grid-cols-7 gap-1 mt-3">
                {sendsHistory.slice(-7).map((d) => {
                  const max = Math.max(...sendsValues.slice(-7), 1)
                  const pct = Math.max((d.sends / max) * 100, 4)
                  return (
                    <div key={d.date} className="flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col justify-end h-16">
                        <div
                          className="bg-teal/50 rounded-sm w-full"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-text-muted">{d.date?.slice(8)}</span>
                      <span className="text-[9px] text-teal font-mono">{formatCount(d.sends)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Tier distribution */}
        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne font-bold flex items-center gap-2">
            <Users size={16} className="text-teal" />
            Tier Distribution
          </h3>
          {protocolsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-8" />)}
            </div>
          ) : totalProtocols === 0 ? (
            <p className="text-sm text-text-muted">No protocols yet.</p>
          ) : (
            <div className="space-y-3">
              {TIERS.map((t) => {
                const count = tierCounts[t.value] ?? 0
                const pct = totalProtocols > 0 ? (count / totalProtocols) * 100 : 0
                return (
                  <div key={t.value} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded', t.color)}>
                        {t.label}
                      </span>
                      <span className="text-xs text-text-muted font-mono">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-card-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      {overview?.recent_activity && overview.recent_activity.length > 0 && (
        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne font-bold flex items-center gap-2">
            <Activity size={16} className="text-teal" />
            Recent Platform Activity
          </h3>
          <div className="space-y-2">
            {overview.recent_activity.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
                <div className="h-1.5 w-1.5 rounded-full bg-teal mt-2 shrink-0" />
                <p className="text-sm text-text-secondary flex-1">{a.description}</p>
                <span className="text-[11px] text-text-muted shrink-0">
                  {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Open incidents alert */}
      {(overview?.open_incidents ?? 0) > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red/10 border border-red/20 text-red">
          <Zap size={16} className="shrink-0" />
          <p className="text-sm font-medium">
            {overview!.open_incidents} open incident{overview!.open_incidents !== 1 ? 's' : ''} — platform reliability may be affected.
          </p>
        </div>
      )}
    </div>
  )
}
