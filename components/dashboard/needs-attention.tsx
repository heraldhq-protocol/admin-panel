'use client'

import Link from 'next/link'
import { AlertCircle, ShieldAlert, Shield, CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useOverview } from '@/hooks/use-overview'
import { useReceiptQueue } from '@/hooks/use-receipt-queue'
import { useModerationQueue } from '@/hooks/use-moderation'

interface AttentionItem {
  label: string
  count: number
  href: string
  severity: 'critical' | 'warning' | 'info'
  icon: React.ElementType
}

const SEVERITY_STYLES = {
  critical: {
    container: 'border-admin/30 bg-admin-bg',
    icon:      'text-admin',
    label:     'text-text-primary',
    badge:     'bg-admin text-white',
  },
  warning: {
    container: 'border-gold/30 bg-gold/5',
    icon:      'text-gold',
    label:     'text-text-primary',
    badge:     'bg-gold text-white',
  },
  info: {
    container: 'border-teal/20 bg-teal/5',
    icon:      'text-teal',
    label:     'text-text-primary',
    badge:     'bg-teal text-white',
  },
} as const

export function NeedsAttention() {
  const { data: overview } = useOverview()
  const { data: receipts } = useReceiptQueue()
  const { data: moderation } = useModerationQueue()

  const failedReceiptsCount = receipts?.data?.length ?? 0
  const pendingModerationCount = moderation?.total ?? 0
  const openIncidentsCount = overview?.open_incidents ?? 0

  const items: AttentionItem[] = [
    openIncidentsCount > 0 && {
      label:    `${openIncidentsCount} open incident${openIncidentsCount > 1 ? 's' : ''} require attention`,
      count:    openIncidentsCount,
      href:     '/incidents',
      severity: 'critical' as const,
      icon:     ShieldAlert,
    },
    failedReceiptsCount > 0 && {
      label:    `${failedReceiptsCount} failed receipt${failedReceiptsCount > 1 ? 's' : ''} pending retry`,
      count:    failedReceiptsCount,
      href:     '/receipts',
      severity: 'warning' as const,
      icon:     AlertCircle,
    },
    pendingModerationCount > 0 && {
      label:    `${pendingModerationCount} moderation item${pendingModerationCount > 1 ? 's' : ''} awaiting review`,
      count:    pendingModerationCount,
      href:     '/moderation',
      severity: 'warning' as const,
      icon:     Shield,
    },
  ].filter(Boolean) as AttentionItem[]

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-2 text-sm text-text-muted">
        <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
        All clear — no items need immediate attention.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
        Needs Attention
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const styles = SEVERITY_STYLES[item.severity]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg border px-4 py-3 transition-opacity hover:opacity-90',
                styles.container,
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', styles.icon)} />
              <p className={cn('flex-1 text-sm font-medium leading-tight', styles.label)}>
                {item.label}
              </p>
              <ArrowRight className="h-4 w-4 text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
