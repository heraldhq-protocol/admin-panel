/* eslint-disable import/no-default-export */
'use client'

import * as React from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, Bell, Percent, Activity,
  Database, ShieldCheck, Zap, AlertTriangle,
  CheckCircle, Clock, XCircle, BarChart2,
} from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useOverview } from '@/hooks/use-overview'
import { useProtocols } from '@/hooks/use-protocols'
import { useMetrics } from '@/hooks/use-metrics'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIERS = [
  { value: 0, label: 'Developer',  color: '#6b7280' },
  { value: 1, label: 'Growth',     color: '#2dd4bf' },
  { value: 2, label: 'Scale',      color: '#8b5cf6' },
  { value: 3, label: 'Enterprise', color: '#f59e0b' },
]

const VERIFICATION_COLORS: Record<string, string> = {
  verified:  '#2dd4bf',
  pending:   '#f59e0b',
  rejected:  '#ef4444',
  unverified:'#6b7280',
}

// ─── Reusable custom tooltip ──────────────────────────────────────────────────

function ChartTooltip({
  active, payload, label, valueFormatter, labelFormatter,
}: {
  active?: boolean
  payload?: Array<{ value: number; name?: string; color?: string }>
  label?: string
  valueFormatter?: (v: number) => string
  labelFormatter?: (l: string) => string
}) {
  if (!active || !payload?.length) return null
  const displayLabel = labelFormatter ? labelFormatter(label ?? '') : label
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      {displayLabel && (
        <p className="mb-1.5 font-medium text-text-muted">{displayLabel}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary">{entry.name ?? 'Value'}:</span>
          <span className="font-bold font-mono text-text-primary">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function QuotaTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: { name: string; sends: number; limit: number } }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-medium text-text-muted">{d.payload.name}</p>
      <p className="text-text-primary font-bold font-mono">{d.value}% quota used</p>
      <p className="text-text-secondary">
        {formatCount(d.payload.sends)} / {formatCount(d.payload.limit)} sends
      </p>
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, delta, icon, iconClass, isLoading, suffix = '',
}: {
  label: string
  value: string | number
  delta?: number
  icon: React.ReactNode
  iconClass: string
  isLoading?: boolean
  suffix?: string
}) {
  return (
    <Card padding="lg" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider leading-tight">
          {label}
        </p>
        <div className={cn('h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shrink-0', iconClass)}>
          {icon}
        </div>
      </div>
      {isLoading ? (
        <Skeleton variant="rect" className="h-7 w-24" />
      ) : (
        <p className="text-xl sm:text-2xl font-black font-syne text-text-primary leading-none">
          {value}{suffix}
        </p>
      )}
      {!isLoading && delta !== undefined && (
        <p className={cn('text-xs font-medium', delta >= 0 ? 'text-teal' : 'text-red')}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs yesterday
        </p>
      )}
    </Card>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, right,
}: {
  icon: React.ReactNode
  title: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <h3 className="font-syne font-bold flex items-center gap-2 text-text-primary text-sm sm:text-base">
        {icon}{title}
      </h3>
      {right}
    </div>
  )
}

// ─── Axis tick defaults ────────────────────────────────────────────────────────

const TICK = { fill: 'var(--color-text-muted)', fontSize: 11 } as const
const GRID_STROKE = 'var(--color-border)'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => { setIsMounted(true) }, [])

  const { data: overview, isLoading: overviewLoading } = useOverview()
  const { data: allProtocols, isLoading: protocolsLoading } = useProtocols({ per_page: 200 } as never)
  const { data: metrics, isLoading: metricsLoading } = useMetrics()

  // ── Derived: tier distribution ─────────────────────────────────────────────
  const tierData = React.useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
    allProtocols?.data?.forEach((p) => { counts[p.tier] = (counts[p.tier] ?? 0) + 1 })
    return TIERS.map((t) => ({ name: t.label, count: counts[t.value] ?? 0, color: t.color }))
  }, [allProtocols])

  // ── Derived: verification status ───────────────────────────────────────────
  const verificationData = React.useMemo(() => {
    const counts: Record<string, number> = {}
    allProtocols?.data?.forEach((p) => {
      const s = (p.verification_status ?? 'unverified').toLowerCase()
      counts[s] = (counts[s] ?? 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: VERIFICATION_COLORS[status] ?? '#6b7280',
    }))
  }, [allProtocols])

  // ── Derived: top 10 protocols by sends ────────────────────────────────────
  const topProtocols = React.useMemo(() => {
    if (!allProtocols?.data) return []
    return [...allProtocols.data]
      .sort((a, b) => b.sends_this_period - a.sends_this_period)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name,
        sends: p.sends_this_period,
      }))
  }, [allProtocols])

  // ── Derived: quota utilization top 8 ─────────────────────────────────────
  const quotaData = React.useMemo(() => {
    if (!allProtocols?.data) return []
    return [...allProtocols.data]
      .filter((p) => p.sends_limit > 0)
      .map((p) => ({
        name: p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name,
        used: Math.min(Math.round((p.sends_this_period / p.sends_limit) * 100), 100),
        sends: p.sends_this_period,
        limit: p.sends_limit,
      }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 8)
  }, [allProtocols])

  // ── Derived: protocol health ───────────────────────────────────────────────
  const healthSummary = React.useMemo(() => {
    const data = allProtocols?.data ?? []
    return {
      active:    data.filter((p) => p.is_active && !p.is_suspended).length,
      suspended: data.filter((p) => p.is_suspended).length,
      struck:    data.filter((p) => p.strike_count > 0).length,
      nearQuota: data.filter((p) => p.sends_limit > 0 && p.sends_this_period / p.sends_limit >= 0.8).length,
    }
  }, [allProtocols])

  // ── Send volume ────────────────────────────────────────────────────────────
  const sendsHistory = overview?.sends_per_day ?? []
  const sendsValues = sendsHistory.map((d) => d.sends)
  const totalSendsWindow = sendsValues.reduce((a, b) => a + b, 0)
  const avgSendsPerDay = sendsHistory.length > 0 ? Math.round(totalSendsWindow / sendsHistory.length) : 0
  const peakDay = sendsHistory.reduce(
    (best, d) => d.sends > best.sends ? d : best,
    { date: '—', sends: 0 },
  )

  const totalProtocols = allProtocols?.total ?? 0
  const activeCount = allProtocols?.data?.filter((p) => p.is_active).length ?? 0

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Platform Analytics"
        description="Platform-wide metrics across all registered protocols."
      />

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard
          label="Total Protocols"
          value={totalProtocols.toLocaleString()}
          icon={<Database size={14} />}
          iconClass="bg-teal/10 text-teal"
          isLoading={protocolsLoading}
        />
        <KpiCard
          label="Active Protocols"
          value={activeCount.toLocaleString()}
          icon={<ShieldCheck size={14} />}
          iconClass="bg-blue-bg text-blue"
          isLoading={protocolsLoading}
        />
        <KpiCard
          label="Sends Today"
          value={overview?.sends_today != null ? formatCount(overview.sends_today) : '—'}
          delta={overview?.sends_today_delta}
          icon={<Bell size={14} />}
          iconClass="bg-violet-bg text-violet"
          isLoading={overviewLoading}
        />
        <KpiCard
          label="Delivery Rate"
          value={overview?.delivery_rate_24h != null ? overview.delivery_rate_24h.toFixed(1) : '—'}
          delta={overview?.delivery_rate_delta}
          suffix="%"
          icon={<Percent size={14} />}
          iconClass={
            overview?.delivery_rate_24h != null && overview.delivery_rate_24h < 90
              ? 'bg-red/10 text-red'
              : 'bg-teal/10 text-teal'
          }
          isLoading={overviewLoading}
        />
        <KpiCard
          label="Open Incidents"
          value={overview?.open_incidents ?? '—'}
          icon={<AlertTriangle size={14} />}
          iconClass={(overview?.open_incidents ?? 0) > 0 ? 'bg-red/10 text-red' : 'bg-teal/10 text-teal'}
          isLoading={overviewLoading}
        />
        <KpiCard
          label="Pending Reviews"
          value={overview?.pending_verifications ?? '—'}
          icon={<Clock size={14} />}
          iconClass="bg-amber-bg text-amber"
          isLoading={overviewLoading}
        />
      </div>

      {/* ── Send Volume Chart ─────────────────────────────────────────────── */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeader
            icon={<TrendingUp size={16} className="text-teal" />}
            title="Send Volume"
          />
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-text-muted">
            <span>
              <span className="font-mono text-text-primary font-bold">{formatCount(totalSendsWindow)}</span>
              {' '}total ({sendsHistory.length}d)
            </span>
            <span>
              avg <span className="font-mono text-text-primary font-bold">{formatCount(avgSendsPerDay)}</span>/day
            </span>
            {peakDay.sends > 0 && (
              <span className="hidden sm:inline">
                peak <span className="font-mono text-teal font-bold">{formatCount(peakDay.sends)}</span>
                {' '}on {peakDay.date?.slice(5)}
              </span>
            )}
          </div>
        </div>

        {overviewLoading ? (
          <Skeleton variant="rect" className="h-44 sm:h-56" />
        ) : sendsHistory.length === 0 ? (
          <div className="h-44 sm:h-56 flex items-center justify-center text-sm text-text-muted">
            No send data available yet.
          </div>
        ) : isMounted ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sendsHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aGradSends" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2dd4bf" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v?.slice(5) ?? ''}
                axisLine={false}
                tickLine={false}
                tick={TICK}
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={TICK}
                tickFormatter={(v: number) => formatCount(v)}
                width={40}
                domain={([min, max]: [number, number]) => {
                  const pad = Math.max(Math.ceil((max - min) * 0.15), 1)
                  return [Math.max(0, min - pad), max + pad]
                }}
              />
              <RechartsTooltip
                content={
                  <ChartTooltip
                    valueFormatter={formatCount}
                    labelFormatter={(l) => l}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="sends"
                name="Sends"
                stroke="#2dd4bf"
                strokeWidth={2}
                fill="url(#aGradSends)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton variant="rect" className="h-44 sm:h-56" />
        )}
      </Card>

      {/* ── Protocol Breakdown ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Tier distribution */}
        <Card padding="lg" className="space-y-4">
          <SectionHeader
            icon={<BarChart2 size={16} className="text-teal" />}
            title="Tier Distribution"
            right={<span className="text-xs text-text-muted font-mono">{totalProtocols} total</span>}
          />
          {protocolsLoading ? (
            <Skeleton variant="rect" className="h-44" />
          ) : isMounted && totalProtocols > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={tierData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={TICK} />
                <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} />
                <RechartsTooltip
                  content={<ChartTooltip valueFormatter={(v) => `${v} protocol${v !== 1 ? 's' : ''}`} />}
                />
                <Bar dataKey="count" name="Protocols" radius={[4, 4, 0, 0]}>
                  {tierData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-sm text-text-muted">No protocols yet.</div>
          )}
        </Card>

        {/* Verification status donut */}
        <Card padding="lg" className="space-y-4">
          <SectionHeader
            icon={<ShieldCheck size={16} className="text-teal" />}
            title="Verification Status"
          />
          {protocolsLoading ? (
            <Skeleton variant="rect" className="h-44" />
          ) : isMounted && verificationData.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {verificationData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(v) => `${v} protocol${v !== 1 ? 's' : ''}`}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                {verificationData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-text-secondary">{d.name}</span>
                    <span className="font-mono font-bold text-text-primary">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-sm text-text-muted">No data.</div>
          )}
        </Card>

        {/* Protocol health */}
        <Card padding="lg" className="space-y-4 sm:col-span-2 lg:col-span-1">
          <SectionHeader
            icon={<Activity size={16} className="text-teal" />}
            title="Protocol Health"
          />
          {protocolsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-10" />)}
            </div>
          ) : (
            <div className="space-y-1">
              {[
                { label: 'Healthy & Active',  value: healthSummary.active,    icon: <CheckCircle size={14} />, color: 'text-teal',   bg: 'bg-teal/10' },
                { label: 'Suspended',          value: healthSummary.suspended, icon: <XCircle size={14} />,     color: 'text-red',    bg: 'bg-red/10' },
                { label: 'Strike History',     value: healthSummary.struck,    icon: <AlertTriangle size={14} />,color: 'text-amber',  bg: 'bg-amber-bg' },
                { label: 'Near Quota (≥80%)',  value: healthSummary.nearQuota, icon: <Zap size={14} />,         color: 'text-violet', bg: 'bg-violet-bg' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', row.bg, row.color)}>
                      {row.icon}
                    </div>
                    <span className="text-sm text-text-secondary">{row.label}</span>
                  </div>
                  <span className={cn('text-xl font-black font-syne', row.color)}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Top Protocols & Quota ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Top 10 protocols by sends */}
        <Card padding="lg" className="space-y-4">
          <SectionHeader
            icon={<TrendingUp size={16} className="text-teal" />}
            title="Top Protocols by Sends"
            right={<Badge variant="developer">This Period</Badge>}
          />
          {protocolsLoading ? (
            <Skeleton variant="rect" className="h-56" />
          ) : topProtocols.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-text-muted">No send data.</div>
          ) : isMounted ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topProtocols}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={TICK}
                  tickFormatter={formatCount}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ ...TICK, fontSize: 10 }}
                  width={80}
                />
                <RechartsTooltip
                  content={<ChartTooltip valueFormatter={formatCount} />}
                />
                <Bar dataKey="sends" name="Sends" fill="#2dd4bf" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton variant="rect" className="h-56" />
          )}
        </Card>

        {/* Quota utilization */}
        <Card padding="lg" className="space-y-4">
          <SectionHeader
            icon={<Percent size={16} className="text-teal" />}
            title="Quota Utilization"
            right={<Badge variant="developer">Top 8</Badge>}
          />
          {protocolsLoading ? (
            <Skeleton variant="rect" className="h-56" />
          ) : quotaData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-text-muted">No quota data.</div>
          ) : isMounted ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={quotaData}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={TICK}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ ...TICK, fontSize: 10 }}
                  width={80}
                />
                <RechartsTooltip content={<QuotaTooltip />} />
                <Bar dataKey="used" name="Quota Used" radius={[0, 4, 4, 0]}>
                  {quotaData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.used >= 90 ? '#ef4444' : entry.used >= 70 ? '#f59e0b' : '#2dd4bf'}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton variant="rect" className="h-56" />
          )}
        </Card>
      </div>

      {/* ── Platform Totals ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'All-Time Delivered',
            value: metrics?.notificationsSent != null ? formatCount(metrics.notificationsSent) : '—',
            desc: 'Total notifications delivered to end users',
            loading: metricsLoading,
          },
          {
            label: 'Registered Webhooks',
            value: metrics?.totalWebhooks?.toLocaleString() ?? '—',
            desc: 'Active webhook endpoints across all protocols',
            loading: metricsLoading,
          },
          {
            label: 'Avg Daily Sends',
            value: formatCount(avgSendsPerDay),
            desc: `Average over the last ${sendsHistory.length} days`,
            loading: overviewLoading,
          },
        ].map((stat) => (
          <Card key={stat.label} padding="lg" className="space-y-1">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
            {stat.loading ? (
              <Skeleton variant="rect" className="h-8 w-28" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black font-syne text-text-primary">{stat.value}</p>
            )}
            <p className="text-xs text-text-muted">{stat.desc}</p>
          </Card>
        ))}
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      {overview?.recent_activity && overview.recent_activity.length > 0 && (
        <Card padding="lg" className="space-y-4">
          <SectionHeader
            icon={<Activity size={16} className="text-teal" />}
            title="Recent Platform Activity"
            right={<span className="text-xs text-text-muted">{overview.recent_activity.length} events</span>}
          />
          <div className="divide-y divide-border">
            {overview.recent_activity.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="h-1.5 w-1.5 rounded-full bg-teal mt-2 shrink-0" />
                <p className="text-sm text-text-secondary flex-1 leading-snug min-w-0">{a.description}</p>
                <span className="text-[11px] text-text-muted shrink-0 font-mono tabular-nums">
                  {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Open incidents alert ──────────────────────────────────────────── */}
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
