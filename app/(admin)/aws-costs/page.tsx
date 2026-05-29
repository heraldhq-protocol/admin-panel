/* eslint-disable import/no-default-export */
'use client'

import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  DollarSign,
  Trash2,
} from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAwsCosts } from '@/hooks/use-aws-costs'
import type { AwsServiceCost, AwsDailyEntry } from '@/lib/api-client'

// ─── Constants ────────────────────────────────────────────────────────────────

// Friendly service name shortener
const SERVICE_SHORT: Record<string, string> = {
  'Amazon Elastic Container Service': 'ECS',
  'Elastic Container Service': 'ECS',
  'Amazon ElastiCache': 'ElastiCache',
  'Amazon CloudWatch': 'CloudWatch',
  'AmazonCloudWatch': 'CloudWatch',
  'Amazon Virtual Private Cloud': 'VPC',
  'Virtual Private Cloud': 'VPC',
  'Elastic Load Balancing': 'ELB',
  'Amazon Relational Database Service': 'RDS',
  'AWS Key Management Service': 'KMS',
  'AWS Secrets Manager': 'Secrets Manager',
  'Amazon Simple Notification Service': 'SNS',
  'Amazon Simple Email Service': 'SES',
  'Amazon S3': 'S3',
  'AWS Lambda': 'Lambda',
  'Amazon Route 53': 'Route 53',
  'Amazon EC2': 'EC2',
}

function shortName(full: string): string {
  return SERVICE_SHORT[full] ?? full
}

// Chart palette — works well on both light and dark backgrounds
const PALETTE = [
  '#2DD4BF', // teal
  '#60A5FA', // blue
  '#A78BFA', // violet
  '#F59E0B', // amber
  '#34D399', // emerald
  '#F87171', // red
  '#FB923C', // orange
  '#38BDF8', // sky
  '#E879F9', // fuchsia
  '#A3E635', // lime
  '#94A3B8', // slate
]

function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? '#94A3B8'
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'flat'
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-black font-syne text-text-primary">{value}</p>
        {trend && (
          <span className="mb-0.5">
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-red" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-teal" />}
            {trend === 'flat' && <Minus className="h-4 w-4 text-text-muted" />}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CostTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-text-primary mb-1.5">{label}</p>
      {payload
        .filter((p: any) => p.value > 0)
        .sort((a: any, b: any) => b.value - a.value)
        .map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 text-text-secondary">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ background: p.fill ?? p.stroke }}
            />
            <span className="flex-1">{shortName(p.name)}</span>
            <span className="font-mono font-semibold text-text-primary">
              ${p.value.toFixed(2)}
            </span>
          </div>
        ))}
      <div className="mt-1.5 border-t border-border pt-1 flex justify-between">
        <span className="text-text-muted">Total</span>
        <span className="font-mono font-semibold text-text-primary">
          ${payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0).toFixed(2)}
        </span>
      </div>
    </div>
  )
}

// ─── Daily stacked bar chart ──────────────────────────────────────────────────

function DailyChart({ days }: { days: AwsDailyEntry[] }) {
  // Collect all unique services (top 8 by total spend to keep chart readable)
  const serviceTotals: Record<string, number> = {}
  days.forEach((d) =>
    d.services.forEach((s) => {
      serviceTotals[s.name] = (serviceTotals[s.name] ?? 0) + s.amount
    }),
  )
  const topServices = Object.entries(serviceTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name)

  const chartData = days.map((d) => {
    const row: Record<string, string | number> = {
      date: d.date.slice(5), // "MM-DD"
    }
    topServices.forEach((svc) => {
      const found = d.services.find((s) => s.name === svc)
      row[svc] = parseFloat((found?.amount ?? 0).toFixed(3))
    })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#64748B' }}
          interval={4}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 10, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CostTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          formatter={(value) => (
            <span className="text-[10px] text-text-muted">{shortName(value)}</span>
          )}
          wrapperStyle={{ paddingTop: 8 }}
        />
        {topServices.map((svc, i) => (
          <Bar
            key={svc}
            dataKey={svc}
            stackId="a"
            fill={colorFor(i)}
            {...(i === topServices.length - 1 ? { radius: [3, 3, 0, 0] as [number, number, number, number] } : {})}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Horizontal service bar ───────────────────────────────────────────────────

function ServiceBar({ service, max, index }: { service: AwsServiceCost; max: number; index: number }) {
  const pct = max > 0 ? (service.amount / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-xs text-text-secondary truncate text-right">
        {shortName(service.name)}
      </div>
      <div className="flex-1 h-2 rounded-full bg-card-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: colorFor(index) }}
        />
      </div>
      <div className="w-16 shrink-0 text-right font-mono text-xs text-text-primary">
        ${service.amount.toFixed(2)}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AwsCostDashboard() {
  const { data, loading, error, refetch, clearCache } = useAwsCosts()
  const [clearing, setClearing] = React.useState(false)

  const handleClearCache = async () => {
    setClearing(true)
    try {
      await clearCache()
    } finally {
      setClearing(false)
    }
  }

  const currentTotal = data?.currentMonth.total ?? 0
  const previousTotal = data?.previousMonth.total ?? 0
  const delta = currentTotal - previousTotal
  const deltaPct = previousTotal > 0 ? (delta / previousTotal) * 100 : 0
  const trend: 'up' | 'down' | 'flat' =
    Math.abs(deltaPct) < 1 ? 'flat' : delta > 0 ? 'up' : 'down'

  const maxServiceAmount = data?.currentMonth.services[0]?.amount ?? 1

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="AWS Cost Dashboard"
        description="Real-time spend breakdown from AWS Cost Explorer. Cached 1 hour."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={clearing || loading}
              title="Bust 1-hour cache and re-fetch"
            >
              <Trash2 className={`h-3.5 w-3.5 mr-2 ${clearing ? 'opacity-50' : ''}`} />
              Clear cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red/30 bg-red/5 px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Failed to load cost data</p>
            <p className="text-xs text-text-muted mt-0.5">{error}</p>
            <p className="text-xs text-text-muted mt-1">
              Make sure <code className="font-mono">AWS_COST_ACCESS_KEY_ID</code> / task role has{' '}
              <code className="font-mono">ce:GetCostAndUsage</code> permission in{' '}
              <code className="font-mono">us-east-1</code>.
            </p>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <MetricCard
              label="This month"
              value={`$${currentTotal.toFixed(2)}`}
              sub={`${data?.currentMonth.period.start} → today`}
            />
            <MetricCard
              label="Last month"
              value={`$${previousTotal.toFixed(2)}`}
              sub="Full calendar month"
            />
            <MetricCard
              label="Month-on-month"
              value={`${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}`}
              sub={`${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}% vs last month`}
              trend={trend}
            />
            <MetricCard
              label="Forecast (EOM)"
              value={data?.forecast ? `$${data.forecast.forecastedAmount.toFixed(2)}` : '—'}
              sub={data?.forecast ? 'AWS projected end-of-month total' : 'Not available'}
            />
          </>
        )}
      </div>

      {/* High-spend warning */}
      {!loading && currentTotal > 200 && (
        <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            <span className="font-bold text-text-primary">Spend is elevated.</span>{' '}
            Month-to-date is <span className="font-mono font-semibold">${currentTotal.toFixed(2)}</span>.
            Check CloudWatch log retention, NAT Gateway traffic, and idle load balancers.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service breakdown — current month */}
        <Card padding="lg" className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-syne font-bold text-text-primary flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-teal" />
              Cost by service
            </h2>
            <Badge variant="inactive" className="text-[10px]">
              {data?.currentMonth.period.start} → {data?.currentMonth.period.end}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-5 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {(data?.currentMonth.services ?? []).slice(0, 12).map((svc, i) => (
                <ServiceBar
                  key={svc.name}
                  service={svc}
                  max={maxServiceAmount}
                  index={i}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Month comparison table */}
        <Card padding="lg" className="flex flex-col gap-5">
          <h2 className="font-syne font-bold text-text-primary">Month comparison</h2>

          {loading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border text-xs">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg">
                    <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                      Service
                    </th>
                    <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                      This month
                    </th>
                    <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                      Last month
                    </th>
                    <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                      Δ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(data?.currentMonth.services ?? []).slice(0, 10).map((svc) => {
                    const prev = data?.previousMonth.services.find(
                      (s) => s.name === svc.name,
                    )
                    const d = svc.amount - (prev?.amount ?? 0)
                    return (
                      <tr key={svc.name} className="bg-card hover:bg-card-2 transition-colors">
                        <td className="px-3 py-2 text-text-secondary truncate max-w-[140px]">
                          {shortName(svc.name)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-primary">
                          ${svc.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-muted">
                          ${(prev?.amount ?? 0).toFixed(2)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono font-semibold ${
                            d > 0.01 ? 'text-red' : d < -0.01 ? 'text-teal' : 'text-text-muted'
                          }`}
                        >
                          {d >= 0 ? '+' : ''}${d.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-bg font-semibold">
                    <td className="px-3 py-2 text-text-primary">Total</td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary">
                      ${currentTotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-muted">
                      ${previousTotal.toFixed(2)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${
                        delta > 0.01 ? 'text-red' : delta < -0.01 ? 'text-teal' : 'text-text-muted'
                      }`}
                    >
                      {delta >= 0 ? '+' : ''}${delta.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Daily spend chart */}
      <Card padding="lg" className="flex flex-col gap-5">
        <h2 className="font-syne font-bold text-text-primary">Daily spend — last 30 days</h2>
        {loading ? (
          <Skeleton className="h-60 rounded-xl" />
        ) : (
          <DailyChart days={data?.dailyBreakdown ?? []} />
        )}
      </Card>
    </div>
  )
}
