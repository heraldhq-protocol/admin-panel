/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'
import * as React from 'react'
import { cn } from '@/lib/cn'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, X, ShieldAlert, ShieldCheck,
  CheckSquare, Square, ChevronDown, Layers,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { truncateAddress, formatTier } from '@/lib/format'
import { useProtocols } from '@/hooks/use-protocols'
import { useDebounce } from '@/hooks/use-debounce'
import { QUERY_KEYS } from '@/lib/query-keys'
import { apiClient } from '@/lib/api-client'
import type { Protocol } from '@/types/api'
import type { Tier } from '@/types/billing'

const TIER_LABELS: Record<number, string> = { 0: 'Developer', 1: 'Growth', 2: 'Scale', 3: 'Enterprise' }
const TIER_VARIANTS: Record<number, string> = { 0: 'developer', 1: 'growth', 2: 'scale', 3: 'enterprise' }

export default function ProtocolsPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [tierFilter, setTierFilter] = React.useState<number | undefined>(undefined)
  const [statusFilter, setStatusFilter] = React.useState<boolean | undefined>(undefined)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useProtocols({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(tierFilter !== undefined ? { tier: tierFilter as Tier } : {}),
    ...(statusFilter !== undefined ? { is_active: statusFilter } : {}),
    page,
    per_page: 20,
  })

  const protocols: Protocol[] = data?.data ?? []

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const allPageIds = protocols.map((p) => p.id)
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        allPageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => new Set([...prev, ...allPageIds]))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const [bulkPending, setBulkPending] = React.useState(false)
  const [bulkSuspendOpen, setBulkSuspendOpen] = React.useState(false)
  const [bulkSuspendReason, setBulkSuspendReason] = React.useState('')
  const [bulkTierOpen, setBulkTierOpen] = React.useState(false)
  const [bulkTierValue, setBulkTierValue] = React.useState<number>(1)

  const selectedIds = [...selected]

  async function handleBulkSuspend() {
    setBulkPending(true)
    let ok = 0, fail = 0
    await Promise.allSettled(
      selectedIds.map((id) => apiClient.suspendProtocol(id, bulkSuspendReason)
        .then(() => ok++)
        .catch(() => fail++)
      )
    )
    setBulkPending(false)
    setBulkSuspendOpen(false)
    setBulkSuspendReason('')
    setSelected(new Set())
    qc.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
    if (ok > 0) toast.success(`${ok} protocol${ok !== 1 ? 's' : ''} suspended`)
    if (fail > 0) toast.error(`${fail} failed`)
  }

  async function handleBulkTier() {
    setBulkPending(true)
    let ok = 0, fail = 0
    await Promise.allSettled(
      selectedIds.map((id) => apiClient.changeProtocolTier(id, bulkTierValue as Tier)
        .then(() => ok++)
        .catch(() => fail++)
      )
    )
    setBulkPending(false)
    setBulkTierOpen(false)
    setSelected(new Set())
    qc.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
    if (ok > 0) toast.success(`${ok} protocol${ok !== 1 ? 's' : ''} moved to ${TIER_LABELS[bulkTierValue]}`)
    if (fail > 0) toast.error(`${fail} failed`)
  }

  async function handleBulkVerify() {
    setBulkPending(true)
    let ok = 0, fail = 0
    await Promise.allSettled(
      selectedIds.map((id) => apiClient.verifyProtocol(id)
        .then(() => ok++)
        .catch(() => fail++)
      )
    )
    setBulkPending(false)
    setSelected(new Set())
    qc.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
    if (ok > 0) toast.success(`${ok} protocol${ok !== 1 ? 's' : ''} verified`)
    if (fail > 0) toast.error(`${fail} failed`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Protocol Registry"
        description="Manage all connected protocols, their subscription tiers, and operational status."
        actions={
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Protocol
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-syne font-bold text-text-primary">Add New Protocol</Dialog.Title>
                  <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                    <X size={20} />
                  </Dialog.Close>
                </div>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Protocol Name</label>
                    <input type="text" placeholder="e.g. Jupiter Exchange" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Wallet Public Key</label>
                    <input type="text" placeholder="Base58 Solana Address" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal font-mono placeholder:font-sans" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close>
                  <Dialog.Close asChild>
                    <Button onClick={() => toast.success('Protocol registration sequence initiated.')}>Register Protocol</Button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        }
      />

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search name or pubkey…"
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {/* Tier filter */}
        <select
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
          value={tierFilter ?? ''}
          onChange={(e) => { setTierFilter(e.target.value === '' ? undefined : Number(e.target.value)); setPage(1) }}
        >
          <option value="">All Tiers</option>
          {[0, 1, 2, 3].map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
        </select>

        {/* Status filter */}
        <select
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
          value={statusFilter === undefined ? '' : statusFilter ? 'active' : 'suspended'}
          onChange={(e) => {
            setStatusFilter(e.target.value === '' ? undefined : e.target.value === 'active')
            setPage(1)
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        {(tierFilter !== undefined || statusFilter !== undefined) && (
          <button
            onClick={() => { setTierFilter(undefined); setStatusFilter(undefined); setPage(1) }}
            className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal/5 border border-teal/20 animate-in slide-in-from-top-2 duration-200">
          <button onClick={() => setSelected(new Set())} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
          <span className="text-sm font-bold text-teal">{selected.size} selected</span>
          <div className="flex-1" />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBulkTierOpen(true)}
            disabled={bulkPending}
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Change Tier
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleBulkVerify}
            disabled={bulkPending}
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Verify All
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setBulkSuspendOpen(true)}
            disabled={bulkPending}
          >
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            Suspend All
          </Button>
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-card-2 border-b border-border text-xs text-text-muted uppercase">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <button onClick={toggleAll} className="text-text-muted hover:text-teal transition-colors">
                    {allSelected
                      ? <CheckSquare size={16} className="text-teal" />
                      : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3.5 font-bold">Protocol</th>
                <th className="px-4 py-3.5 font-bold">Wallet Pubkey</th>
                <th className="px-4 py-3.5 font-bold">Tier</th>
                <th className="px-4 py-3.5 font-bold">Volume (MTD)</th>
                <th className="px-4 py-3.5 font-bold">Status</th>
                <th className="px-4 py-3.5 font-bold">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : protocols.length === 0
                  ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-text-muted text-sm">
                          No protocols match your filters.
                        </td>
                      </tr>
                    )
                  : protocols.map((p) => {
                      const isChecked = selected.has(p.id)
                      const usagePct = Math.min((p.sends_this_period / p.sends_limit) * 100, 100)
                      const nearLimit = usagePct > 90

                      return (
                        <tr
                          key={p.id}
                          className={cn(
                            'hover:bg-card-2 transition-colors',
                            isChecked && 'bg-teal/5',
                          )}
                        >
                          <td className="w-10 px-4 py-3">
                            <button
                              onClick={() => toggleOne(p.id)}
                              className="text-text-muted hover:text-teal transition-colors"
                            >
                              {isChecked
                                ? <CheckSquare size={16} className="text-teal" />
                                : <Square size={16} />}
                            </button>
                          </td>
                          <td
                            className="px-4 py-3 cursor-pointer"
                            onClick={() => router.push(`/protocols/${p.id}`)}
                          >
                            <div className="font-bold text-text-primary">{p.name}</div>
                            {p.design_partner && (
                              <span className="text-[10px] text-teal font-bold">Design Partner</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-[10px] bg-card-2 px-1.5 py-0.5 rounded border border-border">
                              {truncateAddress(p.protocol_pubkey, 8)}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={TIER_VARIANTS[p.tier] as any}>
                              {TIER_LABELS[p.tier].toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={cn('font-mono text-xs', nearLimit && 'text-red font-bold')}>
                                {p.sends_this_period.toLocaleString()} / {p.sends_limit.toLocaleString()}
                              </span>
                              <div className="w-24 h-1 bg-card-2 rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full', nearLimit ? 'bg-red' : 'bg-teal')}
                                  style={{ width: `${usagePct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={p.is_active ? 'active' : 'suspended'}>
                              {p.is_active ? 'ACTIVE' : 'SUSPENDED'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'text-[11px] font-bold',
                              p.verification_status === 'VERIFIED' ? 'text-teal' :
                              p.verification_status === 'PENDING' ? 'text-amber-400' :
                              p.verification_status === 'REJECTED' ? 'text-red' :
                              'text-text-muted',
                            )}>
                              {p.verification_status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Showing {protocols.length} of {data?.total ?? 0} protocols</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={!data?.has_more} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>

      {/* Bulk suspend dialog */}
      <Dialog.Root open={bulkSuspendOpen} onOpenChange={setBulkSuspendOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-syne font-bold text-red">
                Suspend {selected.size} Protocol{selected.size !== 1 ? 's' : ''}?
              </Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              All selected protocols will be immediately blocked. This action is logged.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Suspension Reason <span className="text-red">*</span>
              </label>
              <textarea
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red min-h-[80px] resize-none"
                placeholder="Reason applied to all selected protocols…"
                value={bulkSuspendReason}
                onChange={(e) => setBulkSuspendReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close>
              <Button
                variant="danger"
                disabled={bulkSuspendReason.trim().length < 10 || bulkPending}
                onClick={handleBulkSuspend}
              >
                {bulkPending ? 'Suspending…' : `Suspend ${selected.size}`}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Bulk tier dialog */}
      <Dialog.Root open={bulkTierOpen} onOpenChange={setBulkTierOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-syne font-bold">
                Change Tier for {selected.size} Protocol{selected.size !== 1 ? 's' : ''}
              </Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">New Tier</label>
              <select
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                value={bulkTierValue}
                onChange={(e) => setBulkTierValue(Number(e.target.value))}
              >
                {[0, 1, 2, 3].map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close>
              <Button disabled={bulkPending} onClick={handleBulkTier}>
                {bulkPending ? 'Updating…' : `Apply to ${selected.size}`}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
