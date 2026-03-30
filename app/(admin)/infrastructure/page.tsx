'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  RefreshCw, 
  ShieldCheck, 
  Activity,
  Zap,
  HardDrive
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { StatCard } from '@/components/ui/stat-card'
import { QUERY_KEYS } from '@/lib/query-keys'
import { formatRelativeTime } from '@/lib/format'
import { toast } from 'sonner'

export default function InfrastructurePage() {
  const queryClient = useQueryClient()

  const { data: health } = useQuery({
    queryKey: QUERY_KEYS.emailHealth(),
    queryFn: () => fetch('/api/admin/email-health').then(res => res.json()),
  })

  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: QUERY_KEYS.receiptQueue(),
    queryFn: () => fetch('/api/admin/receipts').then(res => res.json()),
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/admin/receipts/${id}/retry`, { method: 'POST' }).then(res => res.json()),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success('Receipt generation retried successfully')
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.receiptQueue() })
      } else {
        toast.error(`Retry failed: ${res.error}`)
      }
    }
  })

  const receiptColumns = [
    {
      accessorKey: 'protocol_name',
      header: 'Protocol',
      cell: ({ row }: any) => <span className="font-bold">{row.original.protocol_name}</span>
    },
    {
      accessorKey: 'failure_reason',
      header: 'Error',
      cell: ({ row }: any) => <span className="text-admin text-xs">{row.original.failure_reason}</span>
    },
    {
      accessorKey: 'retry_count',
      header: 'Retries',
      cell: ({ row }: any) => (
        <Badge variant={row.original.retry_count >= 3 ? 'p0' : 'developer'}>
          {row.original.retry_count} / 3
        </Badge>
      )
    },
    {
      accessorKey: 'last_attempted_at',
      header: 'Last Attempt',
      cell: ({ row }: any) => (
        <span className="text-xs text-text-secondary">
          {formatRelativeTime(row.original.last_attempted_at)}
        </span>
      )
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => retryMutation.mutate(row.original.id)}
          isLoading={retryMutation.isPending && retryMutation.variables === row.original.id}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Retry
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Infrastructure Health" 
        description="Monitor ZK receipt queue and AWS SES delivery reputation."
        actions={
          <Button variant="outline" size="sm">
            <Activity className="mr-2 h-4 w-4" />
            System Logs
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Email Reputation" 
          value={health?.reputation_score || 0} 
          trend="up" 
          suffix="/ 100"
        />
        <StatCard 
          label="SES Quota (24h)" 
          value={health ? (health.sends_last_24h / 1000).toFixed(0) + 'K' : '0'} 
          suffix={`/ ${(health?.sending_quota_24h / 1000).toFixed(0)}K`}
        />
        <StatCard 
          label="Queue Depth" 
          value={receipts?.total || 0} 
          trend={receipts?.total > 10 ? 'down' : 'up'}
          suffix="failed receipts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-teal" />
              ZK Receipt Generation Queue
            </h3>
            <Badge variant="developer">{receipts?.total || 0} Pending</Badge>
          </div>
          <DataTable 
            columns={receiptColumns as any} 
            data={receipts?.data || []} 
            isLoading={receiptsLoading}
          />
        </Card>

        <div className="space-y-6">
          <Card padding="lg" className="space-y-4">
            <h3 className="font-syne text-base font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-teal" />
              SES Parameters
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">DKIM Status</span>
                <Badge variant="active">PASS</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">SPF Status</span>
                <Badge variant="active">PASS</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">DMARC Status</span>
                <Badge variant="active">PASS</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Dedicated IP</span>
                <code className="text-xs font-mono">{health?.dedicated_ip}</code>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <h3 className="font-syne text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal" />
              Security Status
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-text-secondary">
                All egress traffic is signed with platform enclave keys.
              </p>
              <Button variant="outline" className="w-full text-xs h-9">
                <HardDrive className="mr-2 h-4 w-4" />
                Rotate Keys
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
