'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Settings, 
  ShieldAlert, 
  ShieldCheck, 
  History, 
  CreditCard,
  Mail,
  ExternalLink
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEYS } from '@/lib/query-keys'
import { formatRelativeTime, formatTier } from '@/lib/format'
import { toast } from 'sonner'
import { adminLiveApi } from '@/lib/admin-live-api'

export default function ProtocolDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: protocol, isLoading } = useQuery({
    queryKey: QUERY_KEYS.protocol(id),
    queryFn: () => adminLiveApi.getProtocol(id),
  })

  const suspendMutation = useMutation({
    mutationFn: (reason: string) => 
      adminLiveApi.suspendProtocol(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocol(id) })
      toast.error('Protocol suspended')
    }
  })

  const unsuspendMutation = useMutation({
    mutationFn: () => 
      adminLiveApi.reactivateProtocol(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocol(id) })
      toast.success('Protocol reactivated')
    }
  })

  if (isLoading) return <div className="p-8"><Skeleton variant="rect" /></div>
  if (!protocol) return <div>Protocol not found</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Registry
        </Button>
      </div>

      <PageHeader 
        title={protocol.name} 
        description={protocol.protocol_pubkey}
        actions={
          <div className="flex gap-2">
            <Badge variant={protocol.is_active ? 'active' : 'suspended'}>
              {protocol.is_active ? 'ACTIVE' : 'SUSPENDED'}
            </Badge>
            <Badge variant={protocol.tier === 3 ? 'enterprise' : 'growth'}>
              {formatTier(protocol.tier).toUpperCase()}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription & Volume */}
          <Card padding="lg" className="space-y-6">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal" />
              Subscription & Volume
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Current Usage</p>
                <p className="text-2xl font-bold">{protocol.sends_this_period.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Monthly Limit</p>
                <p className="text-2xl font-bold">{protocol.sends_limit.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Reset Date</p>
                <p className="text-base font-bold">{new Date(protocol.period_reset_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="w-full h-2 bg-card-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal" 
                style={{ width: `${(protocol.sends_this_period / protocol.sends_limit) * 100}%` }}
              />
            </div>
          </Card>

          {/* Activity Log Simulation */}
          <Card padding="lg" className="space-y-6">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-teal" />
              Administrative History
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start border-l-2 border-border pl-4 relative">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-card border-2 border-border" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Tier upgraded to Enterprise</p>
                  <p className="text-xs text-text-muted">Changed by Alex Rivera • 14 days ago</p>
                </div>
              </div>
              <div className="flex gap-4 items-start border-l-2 border-border pl-4 relative">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-card border-2 border-border" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Protocol Registered</p>
                  <p className="text-xs text-text-muted">Created via self-serve portal • {formatRelativeTime(protocol.created_at)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card padding="lg" className="space-y-4">
            <h3 className="font-syne text-base font-bold">Operations</h3>
            {protocol.is_active ? (
              <Button 
                variant="danger" 
                className="w-full"
                onClick={() => {
                  const reason = window.prompt('Enter suspension reason:')
                  if (reason) suspendMutation.mutate(reason)
                }}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Suspend Protocol
              </Button>
            ) : (
              <Button 
                className="w-full"
                onClick={() => unsuspendMutation.mutate()}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Reactivate Protocol
              </Button>
            )}
            <Button variant="secondary" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Contact Partner
            </Button>
            <Button variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Adjust Limits
            </Button>
          </Card>

          {/* Metadata */}
          <Card padding="lg" className="space-y-4">
            <h3 className="font-syne text-base font-bold">Metadata</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Protocol ID</p>
                <code className="text-[11px] font-mono select-all">{protocol.id}</code>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Stripe Customer</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  {protocol.stripe_customer_id || 'N/A'}
                  <ExternalLink size={12} className="text-text-muted" />
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Contact Hash</p>
                <code className="text-[11px] font-mono break-all">{protocol.contact_email_hash}</code>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}