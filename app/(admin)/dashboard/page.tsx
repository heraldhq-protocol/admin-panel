'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import {
  Zap,
  ShieldAlert,
  Users,
  Activity,
  ArrowRight
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEYS } from '@/lib/query-keys'
import { adminLiveApi } from '@/lib/admin-live-api'

interface OverviewData {
  total_protocols: number
  total_protocols_delta: number
  sends_today: number
  sends_today_delta: number
  delivery_rate_24h: number
  delivery_rate_delta: number
  open_incidents: number
  sends_per_day: Array<{ date: string; sends: number }>
}

interface ProtocolItem {
  id: string
  name: string
  protocol_pubkey: string
  sends_this_period: number
  tier: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: overview } = useQuery<OverviewData>({
    queryKey: ['overview'],
    queryFn: () => fetch('/api/admin/overview').then(res => res.json()),
  })

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => adminLiveApi.getMetrics(),
  })

  const { data: protocols, isLoading: protocolsLoading } = useQuery<{ data: ProtocolItem[]; total: number }>({
    queryKey: QUERY_KEYS.protocols({ per_page: 5 }),
    queryFn: async () => {
      const r = await adminLiveApi.getProtocols({ per_page: 5, page: 1 })
      return r as any
    },
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Network Overview"
        description="Real-time monitoring of notification infrastructure and design partners."
        actions={
          <Badge variant="active" className="h-6">Systems Operational</Badge>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Protocols"
          value={metricsLoading ? '—' : (metrics?.totalProtocols ?? '—')}
          delta={0}
          trend="neutral"
        />
        <StatCard
          label="Sends Today"
          value={overview ? `${(overview.sends_today / 1_000_000).toFixed(2)}M` : '1.85M'}
          delta={overview?.sends_today_delta ?? 12.4}
          trend="up"
          suffix="sends"
        />
        <StatCard
          label="Delivery Rate"
          value={overview?.delivery_rate_24h ?? 97.3}
          delta={overview?.delivery_rate_delta ?? -0.4}
          trend={overview && overview.delivery_rate_delta >= 0 ? 'up' : 'down'}
          suffix="% 24h"
        />
        <StatCard
          label="Open Incidents"
          value={overview?.open_incidents ?? 1}
          delta={0}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 flex flex-col gap-6" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal" />
              Notification Volume
            </h3>
            <div className="flex gap-2">
              <Badge variant="developer">7 Days</Badge>
              <Badge variant="developer" className="opacity-50">30 Days</Badge>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] w-full grow">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={overview?.sends_per_day ?? []}>
                <defs>
                  <linearGradient id="colorSends" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-teal)" stopOpacity={0.3} />
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
                <YAxis
                  hide
                  domain={['dataMin - 10000', 'dataMax + 10000']}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(v: any) => [`${(Number(v) / 1000).toFixed(1)}K`, 'Sends']}
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
          </div>
        </Card>

        {/* Top Protocols */}
        <Card className="flex flex-col gap-6" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold">Top Protocols</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => router.push('/protocols')}>View All</Button>
          </div>

          <div className="space-y-4">
            {protocolsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : (
              protocols?.data.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between group cursor-pointer">
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
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="md" className="group hover:border-teal/50 transition-colors cursor-pointer border-dashed" onClick={() => toast.info('Instant Broadcast configuration opening soon...')}>
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

        <Card padding="md" className="group hover:border-admin/50 transition-colors cursor-pointer border-dashed" onClick={() => router.push('/incidents')}>
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

        <Card padding="md" className="group hover:border-purple/50 transition-colors cursor-pointer border-dashed" onClick={() => router.push('/team')}>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Team Audit</p>
              <p className="text-xs text-text-secondary">Review admin logs</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-text-muted group-hover:text-purple transition-transform group-hover:translate-x-1" />
          </div>
        </Card>
      </div>
    </div>
  )
}
