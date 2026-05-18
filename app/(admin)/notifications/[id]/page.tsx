/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, AlertCircle, ExternalLink, Clock, Send, Lock, CheckCircle2, Shield } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { WalletAddress } from '@/components/ui/wallet-address'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { formatRelativeTime, truncateHash } from '@/lib/format'
import { cn } from '@/lib/cn'

// ─── Delivery timeline ────────────────────────────────────────────────────────

interface TimelineStep {
  key: string
  label: string
  icon: React.ElementType
  description: string
}

const DELIVERY_STEPS: TimelineStep[] = [
  { key: 'queued',       label: 'Queued',                  icon: Clock,        description: 'Notification accepted into the delivery queue' },
  { key: 'dispatched',   label: 'Dispatched to Gateway',   icon: Send,         description: 'Picked up by the Notification Gateway for processing' },
  { key: 'tee_decrypt',  label: 'TEE Decryption',          icon: Lock,         description: 'Contact data decrypted inside the Nitro Enclave' },
  { key: 'channel_sent', label: 'Channel Delivered',       icon: CheckCircle2, description: 'Sent via the target channel (email / Telegram / SMS)' },
  { key: 'zk_receipt',   label: 'ZK Receipt Written',      icon: Shield,       description: 'On-chain delivery proof written to Light Protocol' },
]

function DeliveryTimeline({ notification }: { notification: { status: string; queued_at: string; delivered_at: string | null; latency_ms: number | null; error_code: string | null } }) {
  const isFailed = notification.status === 'failed'
  const isDelivered = notification.status === 'delivered'

  // Derive which steps are complete from available API data
  const completedKeys = new Set<string>()
  if (notification.queued_at) completedKeys.add('queued')
  if (notification.delivered_at || isDelivered) {
    completedKeys.add('queued')
    completedKeys.add('dispatched')
    completedKeys.add('tee_decrypt')
    completedKeys.add('channel_sent')
    completedKeys.add('zk_receipt')
  } else if (!isFailed && notification.queued_at) {
    completedKeys.add('queued')
    completedKeys.add('dispatched')
  }

  const failedAt = isFailed ? 'channel_sent' : null

  return (
    <ol className="relative ml-3 border-l border-border space-y-6">
      {DELIVERY_STEPS.map((step) => {
        const done = completedKeys.has(step.key)
        const failed = failedAt === step.key

        return (
          <li key={step.key} className="ml-6">
            <span
              className={cn(
                'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-bg',
                done && !failed && 'bg-teal',
                failed && 'bg-red',
                !done && !failed && 'bg-card-2 border border-border',
              )}
            >
              <step.icon
                className={cn(
                  'h-3 w-3',
                  (done || failed) ? 'text-white' : 'text-text-muted',
                )}
              />
            </span>

            <div className="space-y-0.5">
              <p className={cn('text-sm font-medium', done && !failed && 'text-text-primary', failed && 'text-red', !done && !failed && 'text-text-muted')}>
                {step.label}
              </p>
              <p className="text-xs text-text-muted">{step.description}</p>
              {step.key === 'queued' && notification.queued_at && (
                <p className="text-xs font-mono text-text-muted">{formatRelativeTime(notification.queued_at)}</p>
              )}
              {step.key === 'channel_sent' && notification.delivered_at && (
                <p className="text-xs font-mono text-text-muted">{formatRelativeTime(notification.delivered_at)}</p>
              )}
              {step.key === 'channel_sent' && notification.latency_ms && (
                <p className="text-xs font-mono text-teal">{notification.latency_ms} ms latency</p>
              )}
              {failed && notification.error_code && (
                <p className="text-xs font-mono text-red mt-1">{notification.error_code}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: notification, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.notification(id),
    queryFn: () => apiClient.getNotification(id),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-8"><Skeleton variant="rect" /></div>
  if (isError || !notification) {
    return (
      <div className="p-8 text-center">
        <p className="text-red mb-4">Failed to load notification or not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const isFailed = notification.status === 'failed'

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Notifications
      </Button>

      <PageHeader
        title={`Notification ${truncateHash(notification.id)}`}
        description={`Sent via ${notification.protocol_name}`}
        actions={
          <Badge variant={(notification.status === 'processing' ? 'developer' : notification.status) as Parameters<typeof Badge>[0]['variant']}>
            {notification.status.toUpperCase()}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadata */}
        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne text-lg font-bold">Metadata</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Category</p>
              <Badge variant="developer" className="mt-1">{notification.category}</Badge>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Recipient Wallet (hashed)</p>
              <WalletAddress address={notification.wallet_hash} truncate={false} className="mt-0.5 text-xs" />
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Protocol</p>
              <Link
                href={`/protocols/${notification.protocol_id}`}
                className="text-sm font-medium text-teal hover:underline flex items-center gap-1 mt-0.5"
              >
                {notification.protocol_name}
                <ExternalLink size={12} />
              </Link>
            </div>
            {notification.receipt_tx && (
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">ZK Receipt TX</p>
                <code className="text-xs font-mono break-all mt-0.5 block">{notification.receipt_tx}</code>
              </div>
            )}
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Bounce</p>
              <p className={cn('text-sm font-medium mt-0.5', notification.bounce ? 'text-red' : 'text-teal')}>
                {notification.bounce ? 'Yes — bounced' : 'No'}
              </p>
            </div>
          </div>
        </Card>

        {/* Delivery Timeline */}
        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne text-lg font-bold">Delivery Pipeline</h3>
          <DeliveryTimeline notification={notification} />
        </Card>

        {/* Failure Details */}
        {isFailed && (
          <Card padding="lg" className="space-y-4 border-red/20 bg-red/5 lg:col-span-2">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2 text-red">
              <AlertCircle className="h-5 w-5" />
              Failure Details
            </h3>
            <div>
              <p className="text-[10px] text-red uppercase font-bold">Error Code</p>
              <code className="text-sm font-mono text-text-primary mt-0.5 block">
                {notification.error_code ?? 'UNKNOWN_ERROR'}
              </code>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
