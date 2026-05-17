/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, Handshake, Save, ExternalLink, Pencil, X } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useDebounce } from '@/hooks/use-debounce'
import { useUpdateDesignPartnerNotes } from '@/hooks/use-update-design-partner-notes'
import { useUpdateDesignPartner } from '@/hooks/use-update-design-partner'
import type { PartnerStatus } from '@/types/api'

const STATUS_OPTIONS: PartnerStatus[] = ['active', 'inactive', 'pending']

export default function DesignPartnerDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: partner, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.designPartner(id),
    queryFn: () => apiClient.getDesignPartner(id),
    enabled: !!id,
  })

  const updateNotes = useUpdateDesignPartnerNotes(id)
  const updatePartner = useUpdateDesignPartner(id)

  const [notes, setNotes] = React.useState('')
  const debouncedNotes = useDebounce(notes, 1000)

  const [editOpen, setEditOpen] = React.useState(false)
  const [editForm, setEditForm] = React.useState({
    retainer_amount_usd: '',
    retainer_start: '',
    retainer_end: '',
    equity_warrant_issued: false,
    feedback_sessions: 0,
    status: 'active' as PartnerStatus,
  })

  React.useEffect(() => {
    if (partner?.notes != null) setNotes(partner.notes)
  }, [partner?.notes])

  React.useEffect(() => {
    if (partner && debouncedNotes !== (partner.notes ?? '')) {
      updateNotes.mutate(debouncedNotes)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes])

  function openEdit() {
    if (!partner) return
    setEditForm({
      retainer_amount_usd: (partner.retainer_amount_cents / 100).toFixed(2),
      retainer_start: partner.retainer_start.slice(0, 10),
      retainer_end: partner.retainer_end ? partner.retainer_end.slice(0, 10) : '',
      equity_warrant_issued: partner.equity_warrant_issued,
      feedback_sessions: partner.feedback_sessions,
      status: partner.status,
    })
    setEditOpen(true)
  }

  function handleSaveEdit() {
    const cents = Math.round(parseFloat(editForm.retainer_amount_usd) * 100)
    updatePartner.mutate(
      {
        retainer_amount_cents: cents,
        retainer_start: editForm.retainer_start,
        retainer_end: editForm.retainer_end || null,
        equity_warrant_issued: editForm.equity_warrant_issued,
        feedback_sessions: editForm.feedback_sessions,
        status: editForm.status,
      },
      { onSuccess: () => setEditOpen(false) },
    )
  }

  if (isLoading) return <div className="p-8"><Skeleton variant="rect" className="h-64" /></div>
  if (isError || !partner) {
    return (
      <div className="p-8 text-center">
        <p className="text-red mb-4">Failed to load partner or not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Design Partners
      </Button>

      <PageHeader
        title={partner.protocol_name}
        description="Design Partner Agreement"
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={partner.status === 'active' ? 'active' : 'suspended'}>
              {partner.status.toUpperCase()}
            </Badge>
            <Button variant="secondary" size="sm" onClick={openEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-4 text-sm">
          <h3 className="font-syne text-lg font-bold flex items-center gap-2">
            <Handshake className="h-5 w-5 text-teal" />
            Terms & Economics
          </h3>
          <div className="space-y-3 pt-2">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-muted">Monthly Retainer</span>
              <span className="font-bold font-mono text-teal">
                ${(partner.retainer_amount_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-muted">Start Date</span>
              <span>{new Date(partner.retainer_start).toLocaleDateString()}</span>
            </div>
            {partner.retainer_end && (
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">End Date</span>
                <span>{new Date(partner.retainer_end).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-muted">Equity Warrant</span>
              <span className={partner.equity_warrant_issued ? 'text-teal font-medium' : 'text-text-muted'}>
                {partner.equity_warrant_issued ? 'Issued' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-muted">Feedback Sessions</span>
              <span className="font-medium">{partner.feedback_sessions} completed</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-muted">Sends This Period</span>
              <span className="font-mono">{partner.sends_this_period.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-text-muted">Protocol</span>
              <Link href={`/protocols/${partner.protocol_id}`} className="text-teal font-medium flex items-center gap-1 hover:underline">
                View Protocol <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold">Internal Notes</h3>
            {updateNotes.isPending && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Save size={12} className="animate-pulse" /> Saving…
              </span>
            )}
          </div>
          <textarea
            className="w-full h-[220px] bg-bg rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal border border-border resize-none"
            placeholder="Document key requirements, feature requests, or strategic notes. Saved automatically."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-[10px] text-text-muted">Saved automatically. Never shown to the protocol.</p>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-syne font-bold text-text-primary">Edit Partner</Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Status</label>
                <select
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as PartnerStatus }))}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Monthly Retainer (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                  value={editForm.retainer_amount_usd}
                  onChange={(e) => setEditForm((f) => ({ ...f, retainer_amount_usd: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                    value={editForm.retainer_start}
                    onChange={(e) => setEditForm((f) => ({ ...f, retainer_start: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                    value={editForm.retainer_end}
                    onChange={(e) => setEditForm((f) => ({ ...f, retainer_end: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Feedback Sessions Completed</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                  value={editForm.feedback_sessions}
                  onChange={(e) => setEditForm((f) => ({ ...f, feedback_sessions: Number(e.target.value) }))}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-teal"
                  checked={editForm.equity_warrant_issued}
                  onChange={(e) => setEditForm((f) => ({ ...f, equity_warrant_issued: e.target.checked }))}
                />
                <span className="text-sm text-text-primary">Equity warrant issued</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.Close>
              <Button disabled={updatePartner.isPending} onClick={handleSaveEdit}>
                {updatePartner.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
