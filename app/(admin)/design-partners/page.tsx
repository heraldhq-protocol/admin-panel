'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  Gem,
  Calendar,
  X
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { DesignPartner, PaginatedResponse } from '@/types/api'

export default function DesignPartnersPage() {
  const router = useRouter()
  const { data, isLoading } = useQuery<PaginatedResponse<DesignPartner>>({
    queryKey: ['design-partners'],
    queryFn: () => fetch('/api/admin/design-partners').then(res => res.json()),
  })

  const partners = data?.data

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <PageHeader 
          title="Design Partners" 
          description="Manage high-priority protocol teams and exclusive access tiers."
        />
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="default" className="gap-2 shadow-lg shadow-teal/20">
              <Plus className="h-4 w-4" />
              Add Partner
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-syne font-bold text-text-primary">New VIP Partner</Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-primary text-2xl h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                  <X size={20} />
                </Dialog.Close>
              </div>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Protocol ID</label>
                  <input type="text" placeholder="prot_1234abcd" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Monthly Retainer ($)</label>
                  <input type="number" placeholder="5000" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Dialog.Close asChild>
                  <Button variant="ghost">Cancel</Button>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Button onClick={() => toast.success('Dispatching partner onboarding invite.')}>Save Configuration</Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatSummary label="Total Partners" value={data?.total ?? 0} icon={<Users size={16} />} />
        <StatSummary label="Active Teams" value={partners?.filter(p => p.status === 'active').length ?? 0} icon={<ShieldCheck size={16} />} color="teal" />
        <StatSummary label="Equity Warrants" value={partners?.filter(p => p.equity_warrant_issued).length ?? 0} icon={<Gem size={16} />} color="gold" />
      </div>

      {/* Filters/Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search partners by name..."
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-card-2 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Partner / Entity</th>
                <th className="px-6 py-4 font-bold text-center">Monthly Retainer</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Feedback Sessions</th>
                <th className="px-6 py-4 font-bold text-right pr-10">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                partners?.map((partner) => (
                  <tr key={partner.id} onClick={() => router.push(`/design-partners/${partner.id}`)} className="hover:bg-card-2 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary">{partner.protocol_name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Calendar className="h-3 w-3" />
                          <span>Started {new Date(partner.retainer_start).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-teal">
                      ${(partner.retainer_amount_cents / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${partner.status === 'active' ? 'bg-green animate-pulse' : 'bg-text-muted'}`} />
                        <span className={partner.status === 'active' ? 'text-green font-medium' : 'text-text-muted text-[10px]'}>
                          {partner.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="developer">
                        {partner.feedback_sessions} SESSIONS
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4 text-text-muted" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-text-muted" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function StatSummary({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color?: 'teal' | 'gold' }) {
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