'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { QUERY_KEYS } from '@/lib/query-keys'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export default function IncidentsPage() {
  const router = useRouter()
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
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button variant="danger">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report Incident
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-syne font-bold text-text-primary">Report New Incident</Dialog.Title>
                  <Dialog.Close className="text-text-muted hover:text-text-primary text-2xl h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                    <X size={20} />
                  </Dialog.Close>
                </div>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Severity</label>
                    <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red">
                      <option value="P2">P2 (Minor Degraded Performance)</option>
                      <option value="P1">P1 (Partial Outage)</option>
                      <option value="P0">P0 (Critical System Failure)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Title</label>
                    <input type="text" placeholder="e.g. RPC Latency Spike" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Dialog.Close asChild>
                    <Button variant="ghost">Cancel</Button>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Button variant="danger" onClick={() => toast.success('Paging on-call engineers. Incident reported.')}>Declare Incident</Button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
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
        onRowClick={(row: any) => router.push(`/incidents/${row.id}`)}
      />
    </div>
  )
}