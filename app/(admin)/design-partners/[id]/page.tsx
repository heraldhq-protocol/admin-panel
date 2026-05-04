/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Handshake, Save, ExternalLink } from 'lucide-react'
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
  const [notes, setNotes] = React.useState('')
  const debouncedNotes = useDebounce(notes, 1000)

  React.useEffect(() => {
    if (partner?.notes != null) setNotes(partner.notes)
  }, [partner?.notes])

  React.useEffect(() => {
    if (partner && debouncedNotes !== (partner.notes ?? '')) {
      updateNotes.mutate(debouncedNotes)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes])

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
          <Badge variant={partner.status === 'active' ? 'active' : 'suspended'}>
            {partner.status.toUpperCase()}
          </Badge>
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
    </div>
  )
}
