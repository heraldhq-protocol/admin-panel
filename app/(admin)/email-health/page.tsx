'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Mail, 
  Server,
  AlertCircle
} from 'lucide-react'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

interface EmailHealth {
  reputation_score: number
  bounce_rate_percent: number
  complaint_rate_percent: number
  sending_quota_24h: number
  sends_last_24h: number
  dkim_status: 'pass' | 'fail'
  spf_status: 'pass' | 'fail'
  dmarc_status: 'pass' | 'fail'
  dedicated_ip: string
  warmup_complete: boolean
  reputation_history: Array<{ date: string; score: number }>
}

export default function EmailHealthPage() {
  const { data: health, isLoading } = useQuery<EmailHealth>({
    queryKey: ['email-health'],
    queryFn: () => fetch('/api/admin/email-health').then(res => res.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Email Health" description="Monitor reputation and delivery status." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  const dnsRecords = [
    { name: 'DKIM (DomainKeys)', status: health?.dkim_status, desc: 'Digital signature for message integrity' },
    { name: 'SPF (Sender Policy)', status: health?.spf_status, desc: 'Authorized IP list for the domain' },
    { name: 'DMARC (Reporting)', status: health?.dmarc_status, desc: 'Policy for handling failed auth' },
  ]

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader 
        title="Email Delivery Health" 
        description="Monitor sending reputation, DNS authentication, and delivery performance."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HealthMetric 
          label="Reputation Score" 
          value={`${health?.reputation_score}/100`} 
          icon={<ShieldCheck className="text-teal h-5 w-5" />}
          trend="+1.2%"
          color="teal"
        />
        <HealthMetric 
          label="Bounce Rate" 
          value={`${health?.bounce_rate_percent}%`} 
          icon={<AlertCircle className="text-gold h-5 w-5" />}
          trend="-0.05%"
          isNegative
        />
        <HealthMetric 
          label="Complaint Rate" 
          value={`${health?.complaint_rate_percent}%`} 
          icon={<AlertCircle className="text-red h-5 w-5" />}
          trend="0%"
        />
        <HealthMetric 
          label="Warmup Status" 
          value={health?.warmup_complete ? 'Complete' : 'In Progress'} 
          icon={<Activity className="text-purple h-5 w-5" />}
          subValue="Dedicated IP Active"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Card */}
        <Card className="lg:col-span-2 flex flex-col gap-6" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal" />
              Reputation History
            </h3>
            <Badge variant="growth">Last 7 Days</Badge>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={health?.reputation_history ?? []}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-teal)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-teal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} 
                />
                <YAxis hide domain={[90, 100]} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="var(--color-teal)" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* DNS / Infrastructure Card */}
        <div className="flex flex-col gap-8">
          <Card padding="lg" className="flex flex-col gap-6">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <Server className="h-5 w-5 text-teal" />
              Infrastructure
            </h3>
            
            <div className="space-y-6">
              {dnsRecords.map((record) => (
                <div key={record.name} className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">{record.name}</span>
                    <span className="text-xs text-text-muted">{record.desc}</span>
                  </div>
                  <Badge variant={record.status === 'pass' ? 'active' : 'failed'}>
                    {record.status?.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                <span>Sending Quota Used (24h)</span>
                <span>{((health?.sends_last_24h ?? 0) / (health?.sending_quota_24h ?? 1) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={((health?.sends_last_24h ?? 0) / (health?.sending_quota_24h ?? 1) * 100)} className="h-2" />
              <div className="mt-2 text-[10px] text-text-muted">
                {health?.sends_last_24h.toLocaleString()} / {health?.sending_quota_24h.toLocaleString()} msgs
              </div>
            </div>
          </Card>
          
          <Card padding="lg" className="bg-teal/5 border-teal/20">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-teal" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Dedicated IP</h4>
                <p className="text-xs text-text-secondary mt-1">{health?.dedicated_ip}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function HealthMetric({ label, value, icon, trend, subValue, isNegative }: { label: string, value: string | number, icon: React.ReactNode, trend?: string, subValue?: string, isNegative?: boolean, color?: string }) {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-black text-text-primary font-syne">{value}</div>
          {subValue && <div className="text-[10px] text-text-muted mt-1 uppercase">{subValue}</div>}
        </div>
        {trend && (
          <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${isNegative ? 'bg-red/10 text-red' : 'bg-green/10 text-green'}`}>
            {trend}
          </div>
        )}
      </div>
    </Card>
  )
}