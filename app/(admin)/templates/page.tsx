/* eslint-disable import/no-default-export */
'use client'
import * as React from 'react'
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { usePendingTemplates, useApproveTemplate, useRejectTemplate } from '@/hooks/use-templates'
import { formatDistanceToNow } from 'date-fns'
import type { PendingTemplate } from '@/types/api'

export default function TemplatesPage() {
  const [page, setPage] = React.useState(1)
  const [rejectDialog, setRejectDialog] = React.useState<{ open: boolean; templateId: string | null }>({
    open: false,
    templateId: null,
  })
  const [rejectReason, setRejectReason] = React.useState('')

  const perPage = 20
  const { data, isLoading } = usePendingTemplates({ page, per_page: perPage })
  const approveTemplate = useApproveTemplate()
  const rejectTemplate = useRejectTemplate()

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveTemplate.mutateAsync(id)
      toast.success(`Template "${name}" approved.`)
    } catch {
      toast.error('Failed to approve template')
    }
  }

  const handleRejectOpen = (id: string) => {
    setRejectReason('')
    setRejectDialog({ open: true, templateId: id })
  }

  const handleRejectConfirm = async () => {
    if (!rejectDialog.templateId) return
    if (rejectReason.trim().length < 5) {
      toast.error('Reason must be at least 5 characters')
      return
    }
    try {
      await rejectTemplate.mutateAsync({ id: rejectDialog.templateId, reason: rejectReason.trim() })
      toast.success('Template rejected — reset to draft.')
      setRejectDialog({ open: false, templateId: null })
    } catch {
      toast.error('Failed to reject template')
    }
  }

  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / perPage)

  const columns = [
    {
      accessorKey: 'name',
      header: 'Template',
      cell: ({ row }: { row: { original: PendingTemplate } }) => {
        const t = row.original
        return (
          <div>
            <div className="font-semibold text-text-primary">{t.name}</div>
            {t.subject_template && (
              <div className="text-xs text-text-muted mt-0.5 truncate max-w-xs">
                {t.subject_template}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'protocol',
      header: 'Protocol',
      cell: ({ row }: { row: { original: PendingTemplate } }) => {
        const t = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-text-primary">{t.protocol.name}</span>
            {t.protocol.is_suspended && (
              <Badge variant="suspended">Suspended</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: { row: { original: PendingTemplate } }) => (
        <span className="text-xs text-text-secondary capitalize">{row.original.category}</span>
      ),
    },
    {
      accessorKey: 'version',
      header: 'Ver.',
      cell: ({ row }: { row: { original: PendingTemplate } }) => (
        <span className="text-xs text-text-muted">v{row.original.version}</span>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: 'Submitted',
      cell: ({ row }: { row: { original: PendingTemplate } }) => (
        <span className="text-xs text-text-muted flex items-center gap-1">
          <Clock size={11} />
          {formatDistanceToNow(new Date(row.original.updated_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: PendingTemplate } }) => {
        const t = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
              disabled={approveTemplate.isPending}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); void handleApprove(t.id, t.name) }}
            >
              <CheckCircle size={14} className="mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleRejectOpen(t.id) }}
            >
              <XCircle size={14} className="mr-1" />
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Template Review"
        description="Approve or reject custom templates before they can be used in live sends."
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No templates pending review — queue is clear."
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>{total} template{total !== 1 ? 's' : ''} pending</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <span>{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => !open && setRejectDialog({ open: false, templateId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-secondary">
            Describe why this template is being rejected. It will be reset to draft status.
          </p>
          <textarea
            className="w-full rounded-md border border-border bg-card-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-teal resize-none"
            placeholder="e.g. Contains phishing-style urgency language..."
            value={rejectReason}
            rows={3}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, templateId: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={rejectTemplate.isPending || rejectReason.trim().length < 5}
              onClick={() => void handleRejectConfirm()}
            >
              Reject Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
