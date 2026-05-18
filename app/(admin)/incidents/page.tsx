/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, X } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useIncidents } from '@/hooks/use-incidents'
import { useCreateIncident } from '@/hooks/use-create-incident'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { IncidentSeverity } from '@/types/api'

const SEVERITY_OPTIONS: IncidentSeverity[] = ['P0', 'P1', 'P2', 'P3']

export default function IncidentsPage() {
  const router = useRouter()
  const { data, isLoading } = useIncidents()
  const createIncident = useCreateIncident()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    severity: 'P2' as IncidentSeverity,
    title: '',
    description: '',
    affected_component: '',
  })

  const PAGE_SIZE = 10
  const [page, setPage] = React.useState(1)

  const incidents = data?.data ?? []
  const openP0P1 = incidents.filter((i) => i.status !== 'resolved' && (i.severity === 'P0' || i.severity === 'P1')).length
  const investigating = incidents.filter((i) => i.status === 'investigating').length
  const totalIncidents = incidents.length
  const totalPages = Math.ceil(totalIncidents / PAGE_SIZE)
  const pagedIncidents = incidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCreate = () => {
    createIncident.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false)
        setForm({ severity: 'P2', title: '', description: '', affected_component: '' })
      },
    })
  }

  const isFormValid =
    form.title.trim().length >= 3 &&
    form.description.trim().length >= 5 &&
    form.affected_component.trim().length >= 2

  const columns = [
    {
      accessorKey: 'severity',
      header: 'Sev',
      cell: ({ row }: { row: { original: { severity: IncidentSeverity } } }) => {
        const sev = row.original.severity
        return <Badge variant={sev === 'P0' ? 'p0' : sev === 'P1' ? 'p1' : sev === 'P2' ? 'p2' : 'p3'}>{sev}</Badge>
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }: { row: { original: { title: string; affected_component: string } } }) => (
        <div className="flex flex-col">
          <span className="font-bold text-text-primary">{row.original.title}</span>
          <span className="text-[10px] text-text-muted">{row.original.affected_component}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: { status: string } } }) => {
        const status = row.original.status
        return (
          <div className="flex items-center gap-1.5">
            {status === 'resolved' ? (
              <CheckCircle2 size={14} className="text-green" />
            ) : (
              <Clock size={14} className="text-gold" />
            )}
            <span className={cn('text-xs font-medium capitalize', status === 'resolved' ? 'text-green' : 'text-gold')}>
              {status}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'detected_at',
      header: 'Detected',
      cell: ({ row }: { row: { original: { detected_at: string } } }) => (
        <span className="text-xs text-text-secondary">{formatRelativeTime(row.original.detected_at)}</span>
      ),
    },
    {
      accessorKey: 'created_by',
      header: 'Reporter',
      cell: ({ row }: { row: { original: { created_by: string } } }) => (
        <span className="text-xs font-medium">{row.original.created_by}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Command"
        description="Active and historical platform incidents. Manage responses and post-mortems."
        actions={
          <Button variant="danger" onClick={() => setDialogOpen(true)}>
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
          <p className="text-2xl font-bold text-admin mt-2">{isLoading ? '—' : openP0P1}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Investigating</p>
          <p className="text-2xl font-bold text-text-primary mt-2">{isLoading ? '—' : investigating}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total This Month</p>
          <p className="text-2xl font-bold text-text-primary mt-2">{isLoading ? '—' : incidents.length}</p>
        </Card>
      </div>

      <DataTable
        columns={columns as never[]}
        data={pagedIncidents}
        isLoading={isLoading}
        onRowClick={(row: { id: string }) => router.push(`/incidents/${row.id}`)}
      />

      {!isLoading && totalIncidents > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-text-muted">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalIncidents)} of {totalIncidents} incidents
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Report Incident Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-syne font-bold text-text-primary">Declare Incident</Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Severity</label>
                <div className="flex gap-2">
                  {SEVERITY_OPTIONS.map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setForm((f) => ({ ...f, severity: sev }))}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-bold border transition-colors',
                        form.severity === sev
                          ? sev === 'P0' ? 'bg-red text-white border-red'
                          : sev === 'P1' ? 'bg-red/10 text-red border-red'
                          : sev === 'P2' ? 'bg-gold/10 text-gold border-gold'
                          : 'bg-card-2 text-text-muted border-border'
                          : 'bg-card border-border text-text-muted hover:border-border-2',
                      )}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  placeholder="e.g. RPC latency spike — notification delivery degraded"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Affected Component</label>
                <input
                  type="text"
                  placeholder="e.g. Notification Delivery Pipeline"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red"
                  value={form.affected_component}
                  onChange={(e) => setForm((f) => ({ ...f, affected_component: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
                <textarea
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red min-h-[80px] resize-none"
                  placeholder="Describe the observed symptoms and initial impact…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <p className="text-[10px] text-text-muted">This action will be logged with your admin ID.</p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.Close>
              <Button
                variant="danger"
                disabled={!isFormValid || createIncident.isPending}
                onClick={handleCreate}
              >
                Declare Incident
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
