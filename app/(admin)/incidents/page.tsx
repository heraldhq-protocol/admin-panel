'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { QUERY_KEYS } from '@/lib/query-keys'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export default function IncidentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.incidents(),
    queryFn: () => fetch('/api/admin/incidents').then(res => res.json()),
  })

  const columns = [
    {
      accessorKey: 'severity',
      header: 'Sev',
      cell: ({ row }: any) => {
        const sev = row.original.severity
        return (
          <Badge variant={sev === 'P0' ? 'p0' : sev === 'P1' ? 'p1' : 'p2'}>
            {sev}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-text-primary">{row.original.title}</span>
          <span className="text-[10px] text-text-muted">{row.original.affected_component}</span>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status
        return (
          <div className="flex items-center gap-1.5">
            {status === 'investigating' ? (
              <Clock size={14} className="text-gold" />
            ) : (
              <CheckCircle2 size={14} className="text-green" />
            )}
            <span className={cn(
              "text-xs font-medium capitalize",
              status === 'investigating' ? "text-gold" : "text-green"
            )}>
              {status}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: 'detected_at',
      header: 'Detected',
      cell: ({ row }: any) => (
        <span className="text-xs text-text-secondary">
          {formatRelativeTime(row.original.detected_at)}
        </span>
      )
    },
    {
      accessorKey: 'created_by',
      header: 'Reporter',
      cell: ({ row }: any) => <span className="text-xs font-medium">{row.original.created_by}</span>
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Incident Command" 
        description="Active and historical platform incidents. Manage responses and post-mortems."
        actions={
          <Button variant="danger">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Incident
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="md" className="bg-admin-bg/30 border-admin/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-admin uppercase tracking-wider">Active P0/P1</p>
            <ShieldAlert className="text-admin h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-admin mt-2">1</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Investigating</p>
          <p className="text-2xl font-bold text-text-primary mt-2">1</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">MSR (Last 30d)</p>
          <p className="text-2xl font-bold text-text-primary mt-2">12m</p>
        </Card>
      </div>

      <DataTable 
        columns={columns as any} 
        data={data?.data || []} 
        isLoading={isLoading}
      />
    </div>
  )
}