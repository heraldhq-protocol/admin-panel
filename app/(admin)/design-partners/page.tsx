/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Users, Plus, Search, ExternalLink, ShieldCheck, Gem, Calendar, X } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDesignPartners } from '@/hooks/use-design-partners'
import { useAddDesignPartner } from '@/hooks/use-add-design-partner'
import type { DesignPartner } from '@/types/api'

export default function DesignPartnersPage() {
  const router = useRouter()
  const { data, isLoading } = useDesignPartners()
  const addPartner = useAddDesignPartner()

  const [search, setSearch] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    protocol_id: '',
    retainer_amount_usd: '1000',
    retainer_start: new Date().toISOString().slice(0, 10),
    equity_warrant_issued: false,
    notes: '',
  })

  const partners: DesignPartner[] = (data?.data ?? []).filter((p) =>
    search.length === 0 || p.protocol_name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleAdd = () => {
    const cents = Math.round(parseFloat(form.retainer_amount_usd) * 100)
    addPartner.mutate(
      {
        protocol_id: form.protocol_id,
        retainer_amount_cents: cents,
        retainer_start: form.retainer_start,
        equity_warrant_issued: form.equity_warrant_issued,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setForm({ protocol_id: '', retainer_amount_usd: '1000', retainer_start: new Date().toISOString().slice(0, 10), equity_warrant_issued: false, notes: '' })
        },
      },
    )
  }

  const isFormValid =
    form.protocol_id.trim().length >= 5 &&
    !isNaN(parseFloat(form.retainer_amount_usd)) &&
    parseFloat(form.retainer_amount_usd) > 0

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Design Partners"
          description="Manage high-priority protocol teams with VIP access and retainer agreements."
        />
        <Button variant="default" className="gap-2 shadow-lg shadow-teal/20" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Partners" value={data?.total ?? 0} icon={<Users size={16} />} />
        <StatCard label="Active Teams" value={partners.filter((p) => p.status === 'active').length} icon={<ShieldCheck size={16} />} color="teal" />
        <StatCard label="Equity Warrants" value={partners.filter((p) => p.equity_warrant_issued).length} icon={<Gem size={16} />} color="gold" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search by protocol name…"
          className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-card-2 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Partner</th>
                <th className="px-6 py-4 font-bold text-center">Monthly Retainer</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Feedback Sessions</th>
                <th className="px-6 py-4 font-bold text-right pr-10">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                : partners.length === 0
                ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-text-muted">
                        {search ? 'No partners match your search.' : 'No design partners yet.'}
                      </td>
                    </tr>
                  )
                : partners.map((partner) => (
                    <tr
                      key={partner.id}
                      onClick={() => router.push(`/design-partners/${partner.id}`)}
                      className="hover:bg-card-2 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-text-primary">{partner.protocol_name}</span>
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Calendar className="h-3 w-3" />
                            <span>Since {new Date(partner.retainer_start).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-teal font-bold">
                        ${(partner.retainer_amount_cents / 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${partner.status === 'active' ? 'bg-green animate-pulse' : 'bg-text-muted'}`} />
                          <span className={partner.status === 'active' ? 'text-green font-medium text-xs' : 'text-text-muted text-xs'}>
                            {partner.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="developer">{partner.feedback_sessions} sessions</Badge>
                      </td>
                      <td className="px-6 py-4 text-right pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); router.push(`/design-partners/${partner.id}`) }}
                        >
                          <ExternalLink className="h-4 w-4 text-text-muted" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Partner Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-syne font-bold text-text-primary">New Design Partner</Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Protocol ID</label>
                <input
                  type="text"
                  placeholder="ULID from the protocols list"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-teal"
                  value={form.protocol_id}
                  onChange={(e) => setForm((f) => ({ ...f, protocol_id: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Monthly Retainer (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="1000"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                  value={form.retainer_amount_usd}
                  onChange={(e) => setForm((f) => ({ ...f, retainer_amount_usd: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                  value={form.retainer_start}
                  onChange={(e) => setForm((f) => ({ ...f, retainer_start: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-teal"
                  checked={form.equity_warrant_issued}
                  onChange={(e) => setForm((f) => ({ ...f, equity_warrant_issued: e.target.checked }))}
                />
                <span className="text-sm text-text-primary">Equity warrant issued</span>
              </label>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Notes (optional)</label>
                <textarea
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal min-h-[60px] resize-none"
                  placeholder="Initial onboarding notes, feature requests, strategic context…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.Close>
              <Button disabled={!isFormValid || addPartner.isPending} onClick={handleAdd}>
                Add Partner
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color?: 'teal' | 'gold' }) {
  return (
    <Card padding="lg" className="flex items-center gap-4">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color === 'teal' ? 'bg-teal/10 text-teal' : color === 'gold' ? 'bg-gold/10 text-gold' : 'bg-card-2 text-text-muted'}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</div>
        <div className="text-xl font-black text-text-primary font-syne mt-0.5">{value}</div>
      </div>
    </Card>
  )
}
