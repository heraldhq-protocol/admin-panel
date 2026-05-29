/* eslint-disable import/no-default-export */
'use client'

import * as React from 'react'
import {
  Megaphone,
  Send,
  RefreshCw,
  AlertTriangle,
  Wrench,
  BookOpen,
  Info,
  Bell,
  Users,
  CheckCircle2,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import type {
  BroadcastMessage,
  BroadcastType,
  BroadcastTargetMode,
  SendBroadcastPayload,
} from '@/lib/api-client'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: BroadcastType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'maintenance', label: 'Maintenance',  icon: Wrench,       color: 'text-amber-400' },
  { value: 'incident',    label: 'Incident',     icon: AlertTriangle, color: 'text-red' },
  { value: 'changelog',  label: 'Changelog',    icon: BookOpen,     color: 'text-teal' },
  { value: 'general',    label: 'General',      icon: Info,          color: 'text-blue-400' },
  { value: 'announcement', label: 'Announcement', icon: Bell,        color: 'text-violet-400' },
]

const TARGET_OPTIONS: { value: BroadcastTargetMode; label: string; desc: string }[] = [
  { value: 'all',      label: 'All protocols',    desc: 'Every protocol in the database' },
  { value: 'active',   label: 'Active only',      desc: 'Active, non-suspended protocols' },
  { value: 'tier',     label: 'By tier',          desc: 'Only protocols on a specific tier' },
]

const TYPE_BADGE: Record<BroadcastType, { label: string; cls: string }> = {
  maintenance:  { label: 'Maintenance',  cls: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  incident:     { label: 'Incident',     cls: 'bg-red/10 text-red border-red/20' },
  changelog:    { label: 'Changelog',    cls: 'bg-teal/10 text-teal border-teal/20' },
  general:      { label: 'General',      cls: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  announcement: { label: 'Announcement', cls: 'bg-violet-400/10 text-violet-400 border-violet-400/20' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: BroadcastType }) {
  const cfg = TYPE_BADGE[type]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Compose Modal ────────────────────────────────────────────────────────────

interface ComposeModalProps {
  onClose: () => void
  onSent: () => void
}

function ComposeModal({ onClose, onSent }: ComposeModalProps) {
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [type, setType] = React.useState<BroadcastType>('general')
  const [targetMode, setTargetMode] = React.useState<BroadcastTargetMode>('active')
  const [targetTier, setTargetTier] = React.useState<number>(0)
  const [sending, setSending] = React.useState(false)
  const [result, setResult] = React.useState<{ protocolsTargeted: number; emailsSent: number } | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setError(null)
    try {
      const payload: SendBroadcastPayload = {
        title: title.trim(),
        body: body.trim(),
        type,
        targetMode,
        ...(targetMode === 'tier' ? { targetTier } : {}),
      }
      const res = await apiClient.sendBroadcast(payload)
      setResult(res)
      onSent()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-teal" />
            <h2 className="font-syne font-bold text-text-primary">New Broadcast</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          /* Success screen */
          <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-teal" />
            <h3 className="font-syne font-bold text-xl text-text-primary">Broadcast sent!</h3>
            <p className="text-text-muted text-sm">
              Reached <span className="font-semibold text-text-primary">{result.protocolsTargeted} protocols</span>
              {' '}·{' '}
              <span className="font-semibold text-text-primary">{result.emailsSent} emails</span> dispatched
            </p>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="overflow-y-auto flex flex-col gap-5 p-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-sm text-red">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Type selector */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Type</label>
              <div className="grid grid-cols-5 gap-1.5">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const active = type === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[10px] font-semibold transition-all ${
                        active
                          ? `border-current ${opt.color} bg-current/10`
                          : 'border-border text-text-muted hover:border-border/80 hover:text-text-secondary'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? opt.color : ''}`} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Title</label>
              <input
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-teal/50"
                placeholder="e.g. Scheduled maintenance — API gateway, May 30 02:00 UTC"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <p className="mt-1 text-right text-[10px] text-text-muted">{title.length}/200</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Message</label>
              <textarea
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-teal/50 resize-none"
                placeholder="Write your message here. Plain text. Formatting will render in email."
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Recipients</label>
              <div className="flex flex-col gap-1.5">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTargetMode(opt.value)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                      targetMode === opt.value
                        ? 'border-teal/40 bg-teal/5 text-text-primary'
                        : 'border-border text-text-muted hover:border-border/80'
                    }`}
                  >
                    <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      targetMode === opt.value ? 'border-teal bg-teal' : 'border-text-muted'
                    }`}>
                      {targetMode === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-bg" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-[11px] text-text-muted">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {targetMode === 'tier' && (
                <div className="mt-2">
                  <label className="block text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">Tier</label>
                  <select
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-teal/50"
                    value={targetTier}
                    onChange={(e) => setTargetTier(Number(e.target.value))}
                  >
                    <option value={0}>Tier 0 (Free)</option>
                    <option value={1}>Tier 1</option>
                    <option value={2}>Tier 2</option>
                    <option value={3}>Tier 3</option>
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={onClose} disabled={sending}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending || !title.trim() || !body.trim()}
                className="gap-2"
              >
                {sending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {sending ? 'Sending…' : 'Send broadcast'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Broadcast row ────────────────────────────────────────────────────────────

function BroadcastRow({ b }: { b: BroadcastMessage }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:bg-card/80 transition-colors">
      <div className="mt-0.5">
        <TypeBadge type={b.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-text-primary truncate">{b.title}</p>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{b.body}</p>
      </div>
      <div className="shrink-0 text-right space-y-1">
        <div className="flex items-center gap-1 text-xs text-text-muted justify-end">
          <Users className="h-3 w-3" />
          {b.sentCount} protocols
        </div>
        <p className="text-[10px] text-text-muted">{timeAgo(b.createdAt)}</p>
        {b.sentBy && <p className="text-[10px] text-text-muted">by {b.sentBy}</p>}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = React.useState<BroadcastMessage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [composing, setComposing] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getBroadcasts({ per_page: 50 })
      setBroadcasts(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  return (
    <>
      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onSent={() => { void load() }}
        />
      )}

      <div className="flex flex-col gap-6 pb-10">
        <PageHeader
          title="Broadcasts"
          description="Send announcements directly to protocol owners via email and in-app inbox."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setComposing(true)} className="gap-2">
                <Megaphone className="h-3.5 w-3.5" />
                New broadcast
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Megaphone className="h-10 w-10 text-text-muted opacity-40" />
            <p className="text-text-muted text-sm">No broadcasts yet</p>
            <Button size="sm" onClick={() => setComposing(true)}>Send your first broadcast</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {broadcasts.map((b) => (
              <BroadcastRow key={b.id} b={b} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
