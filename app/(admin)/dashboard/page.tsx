/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Zap, ShieldAlert, Users, Activity, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useOverview } from '@/hooks/use-overview'
import { useMetrics } from '@/hooks/use-metrics'
import { useProtocols } from '@/hooks/use-protocols'
import { formatRelativeTime } from '@/lib/format'

export default function DashboardPage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const { data: overview, isLoading: overviewLoading } = useOverview()
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const { data: protocols, isLoading: protocolsLoading } = useProtocols({ per_page: 5, page: 1 })

  const sendsPerDay: Array<{ date: string; sends: number }> =
    (overview as unknown as Record<string, unknown>)?.sends_per_day as Array<{ date: string; sends: number }> ?? []

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Network Overview"
        description="Real-time monitoring of notification infrastructure and design partners."
        actions={<Badge variant="active" className="h-6">Systems Operational</Badge>}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Protocols"
          value={metricsLoading ? '—' : (metrics?.activeProtocols ?? '—')}
          delta={0}
          trend="neutral"
        />
        <StatCard
          label="Sends Today"
          value={overviewLoading ? '—' : (overview ? `${(overview.sends_today / 1_000_000).toFixed(2)}M` : '—')}
          delta={overview?.sends_today_delta ?? 0}
          trend="up"
          suffix="sends"
        />
        <StatCard
          label="Delivery Rate"
          value={overviewLoading ? '—' : (overview?.delivery_rate_24h ?? '—')}
          delta={overview?.delivery_rate_delta ?? 0}
          trend={overview && overview.delivery_rate_delta >= 0 ? 'up' : 'neutral'}
          suffix="% 24h"
        />
        <StatCard
          label="Open Incidents"
          value={overviewLoading ? '—' : (overview?.open_incidents ?? '—')}
          delta={0}
          trend="neutral"
        />
      </div>

      {/* Infrastructure Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Active Protocols"
          value={metricsLoading ? '—' : (metrics?.activeProtocols ?? '—')}
          delta={0}
          trend="neutral"
        />
        <StatCard
          label="Registered Webhooks"
          value={metricsLoading ? '—' : (metrics?.totalWebhooks ?? '—')}
          delta={0}
          trend="neutral"
        />
        <StatCard
          label="All-Time Delivered"
          value={metricsLoading ? '—' : (metrics?.notificationsSent != null ? `${(metrics.notificationsSent / 1_000_000).toFixed(2)}M` : '—')}
          delta={0}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Chart */}
        <Card className="lg:col-span-2 flex flex-col gap-6" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal" />
              Notification Volume
            </h3>
            <Badge variant="developer">7 Days</Badge>
          </div>

          <div className="w-full h-[280px]">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                <AreaChart data={sendsPerDay}>
                  <defs>
                    <linearGradient id="colorSends" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-teal)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-teal)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis hide domain={['dataMin - 10000', 'dataMax + 10000']} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(v: number) => [`${(Number(v) / 1000).toFixed(1)}K`, 'Sends']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sends"
                    stroke="var(--color-teal)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSends)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>

          {/* Recent Activity Feed */}
          {overview?.recent_activity && overview.recent_activity.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Recent Activity</p>
              <div className="space-y-2">
                {overview.recent_activity.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{event.description}</span>
                    <span className="text-text-muted font-mono">{formatRelativeTime(event.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Top Protocols */}
        <Card className="flex flex-col gap-6" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold">Top Protocols</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => router.push('/protocols')}>
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {protocolsLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : protocols?.data.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => router.push(`/protocols/${p.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-card-2 flex items-center justify-center border border-border group-hover:border-teal/50 transition-colors">
                        <span className="text-xs font-bold text-text-muted">{p.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary group-hover:text-teal transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-text-muted font-mono">
                          {p.protocol_pubkey.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <Badge variant={p.tier === 3 ? 'enterprise' : 'growth'}>
                      {(p.sends_this_period / 1000).toFixed(0)}K
                    </Badge>
                  </div>
                ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          padding="md"
          className="group hover:border-teal/50 transition-colors cursor-pointer border-dashed"
          onClick={() => toast.info('Instant Broadcast coming soon.')}
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Instant Broadcast</p>
              <p className="text-xs text-text-secondary">Send system-wide alert</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-text-muted group-hover:text-teal transition-transform group-hover:translate-x-1" />
          </div>
        </Card>

        <Card
          padding="md"
          className="group hover:border-admin/50 transition-colors cursor-pointer border-dashed"
          onClick={() => router.push('/incidents')}
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-admin-bg flex items-center justify-center text-admin">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">New Incident</p>
              <p className="text-xs text-text-secondary">Open P0/P1 event</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-text-muted group-hover:text-admin transition-transform group-hover:translate-x-1" />
          </div>
        </Card>

        <Card
          padding="md"
          className="group hover:border-purple/50 transition-colors cursor-pointer border-dashed"
          onClick={() => router.push('/team')}
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Team Audit</p>
              <p className="text-xs text-text-secondary">Review admin access</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-text-muted group-hover:text-purple transition-transform group-hover:translate-x-1" />
          </div>
        </Card>
      </div>
    </div>
  )
}
