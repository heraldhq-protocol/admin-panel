/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Activity, MessageSquare } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { formatRelativeTime } from '@/lib/format'
import { useAddTimelineEntry } from '@/hooks/use-add-timeline-entry'
import { useUpdateIncidentStatus } from '@/hooks/use-update-incident-status'

export default function IncidentDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: incident, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.incident(id),
    queryFn: () => apiClient.getIncident(id),
    enabled: !!id,
  })

  const addTimeline = useAddTimelineEntry(id)
  const updateStatus = useUpdateIncidentStatus(id)

  const [updateMsg, setUpdateMsg] = React.useState('')
  const [resolutionMsg, setResolutionMsg] = React.useState('')
  const [showResolveForm, setShowResolveForm] = React.useState(false)

  const handleAddUpdate = () => {
    addTimeline.mutate(updateMsg, {
      onSuccess: () => setUpdateMsg(''),
    })
  }

  const handleResolve = () => {
    updateStatus.mutate({ status: 'resolved', resolution: resolutionMsg }, {
      onSuccess: () => {
        setShowResolveForm(false)
        setResolutionMsg('')
      },
    })
  }

  if (isLoading) return <div className="p-8"><Skeleton variant="rect" className="h-64" /></div>
  if (isError || !incident) {
    return (
      <div className="p-8 text-center">
        <p className="text-red mb-4">Failed to load incident or not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const isResolved = incident.status === 'resolved'

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Incidents
      </Button>

      <PageHeader
        title={incident.title}
        description={`Detected ${formatRelativeTime(incident.detected_at)} • ${incident.affected_component}`}
        actions={
          <div className="flex gap-2">
            <Badge variant={incident.severity === 'P0' ? 'p0' : incident.severity === 'P1' ? 'p1' : incident.severity === 'P2' ? 'p2' : 'p3'}>
              {incident.severity}
            </Badge>
            <Badge variant={isResolved ? 'active' : 'suspended'}>
              {incident.status.toUpperCase()}
            </Badge>
          </div>
        }
      />

      <Card padding="lg" className="space-y-6">
        <h3 className="font-syne text-lg font-bold flex items-center gap-2 border-b border-border pb-3">
          <Activity className="h-5 w-5 text-teal" />
          Timeline
        </h3>

        <div className="space-y-4 pl-2">
          {/* Initial detection entry */}
          <div className="flex gap-4 items-start relative">
            <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-red/20 border border-red" />
            <div className="border border-border rounded-lg p-3 text-sm flex-1 bg-bg-elevated">
              <p className="font-medium text-red mb-1">Incident Declared</p>
              <p className="text-text-secondary">{incident.description}</p>
              <p className="text-[10px] text-text-muted mt-2">
                {formatRelativeTime(incident.detected_at)} • {incident.created_by}
              </p>
            </div>
          </div>

          {incident.timeline.map((entry) => (
            <div key={entry.id} className="flex gap-4 items-start relative">
              <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-card-2 border border-border" />
              <div className="border border-border rounded-lg p-3 text-sm flex-1">
                <p className="text-text-primary">{entry.message}</p>
                <p className="text-[10px] text-text-muted mt-2">
                  {formatRelativeTime(entry.created_at)} • {entry.author}
                </p>
              </div>
            </div>
          ))}

          {isResolved && incident.resolved_at && (
            <div className="flex gap-4 items-start relative">
              <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-teal/20 border border-teal" />
              <div className="border border-teal/30 bg-teal/5 rounded-lg p-3 text-sm flex-1">
                <p className="font-bold text-teal flex items-center gap-1">
                  <CheckCircle size={14} /> Incident Resolved
                </p>
                {incident.resolved_by && (
                  <p className="text-[10px] text-teal/80 mt-1">Resolved by {incident.resolved_by}</p>
                )}
                <p className="text-[10px] text-teal/60 mt-1">{formatRelativeTime(incident.resolved_at)}</p>
              </div>
            </div>
          )}
        </div>

        {!isResolved && (
          <div className="pt-6 border-t border-border space-y-4">
            <textarea
              className="w-full bg-bg rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal border border-border min-h-[80px] resize-none"
              placeholder="Add a timeline update — what's the current status? What was found? What's being done?"
              value={updateMsg}
              onChange={(e) => setUpdateMsg(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <Button
                variant="secondary"
                disabled={updateMsg.trim().length < 5 || addTimeline.isPending}
                onClick={handleAddUpdate}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Post Update
              </Button>

              <div className="flex gap-2">
                {incident.status === 'open' && (
                  <Button
                    variant="outline"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ status: 'investigating' })}
                  >
                    Mark Investigating
                  </Button>
                )}
                <Button onClick={() => setShowResolveForm(true)} disabled={showResolveForm}>
                  Resolve Incident
                </Button>
              </div>
            </div>

            {showResolveForm && (
              <div className="bg-card-2 p-4 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-sm font-bold">Resolution Details</h4>
                <textarea
                  className="w-full bg-bg rounded-lg p-3 text-sm border border-border min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-teal"
                  placeholder="Describe root cause and how the incident was resolved…"
                  value={resolutionMsg}
                  onChange={(e) => setResolutionMsg(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowResolveForm(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    disabled={resolutionMsg.trim().length < 5 || updateStatus.isPending}
                    onClick={handleResolve}
                  >
                    Confirm Resolution
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
