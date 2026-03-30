'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, AlertCircle, ExternalLink, Activity } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { formatRelativeTime, truncateHash } from '@/lib/format'

export default function NotificationDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: notification, isLoading, isError } = useQuery({
    queryKey: ['notification', id],
    queryFn: () => apiClient.getNotification(id),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-8"><Skeleton variant="rect" /></div>
  if (isError || !notification) return <div className="p-8 text-center text-red">Failed to load notification or not found. <Button className="mt-4" onClick={() => router.back()}>Go Back</Button></div>

  const isFailed = notification.status === 'failed'

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Notifications
      </Button>

      <PageHeader 
        title={`Notification ${truncateHash(notification.id)}`} 
        description={`Details for notification sent via ${notification.protocol_name}`}
        actions={
          <Badge variant={(notification.status === 'processing' ? 'developer' : notification.status) as any}>
            {notification.status.toUpperCase()}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal" />
            Metadata
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Category</p>
              <Badge variant="developer" className="mt-1">{notification.category}</Badge>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Recipient Wallet</p>
              <code className="text-sm font-mono">{notification.wallet_hash}</code>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Protocol</p>
              <Link href={`/protocols/${notification.protocol_id}`} className="text-sm font-medium text-teal hover:underline flex items-center gap-1">
                {notification.protocol_name}
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal" />
            Delivery Timeline
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-sm text-text-secondary">Queued</span>
              <span className="text-sm font-mono">{formatRelativeTime(notification.queued_at)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-sm text-text-secondary">Delivered</span>
              <span className="text-sm font-mono">
                {notification.delivered_at ? formatRelativeTime(notification.delivered_at) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Latency</span>
              <span className="text-sm font-mono text-teal">
                {notification.latency_ms ? `${notification.latency_ms} ms` : '—'}
              </span>
            </div>
          </div>
        </Card>

        {isFailed && (
          <Card padding="lg" className="space-y-4 border-red/20 bg-red/5 lg:col-span-2">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2 text-red">
              <AlertCircle className="h-5 w-5" />
              Failure Details
            </h3>
            <div>
              <p className="text-[10px] text-red uppercase font-bold">Error Code</p>
              <code className="text-sm font-mono text-text-primary">{notification.error_code || 'UNKNOWN_ERROR'}</code>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}