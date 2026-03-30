'use client'

import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { UserPlus, Shield, User, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { QUERY_KEYS } from '@/lib/query-keys'
import { formatRelativeTime } from '@/lib/format'

export default function TeamPage() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.team(),
    queryFn: () => fetch('/api/admin/team').then(res => res.json()),
  })

  const columns = [
    {
      accessorKey: 'display_name',
      header: 'Member',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">
            <User size={16} />
          </div>
          <span className="font-bold">{row.original.display_name}</span>
        </div>
      )
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }: any) => (
        <Badge variant={row.original.role === 'super_admin' ? 'enterprise' : 'growth'}>
          {row.original.role.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      accessorKey: 'auth_method',
      header: 'Auth Method',
      cell: ({ row }: any) => (
        <Badge variant="developer">
          {row.original.auth_method.toUpperCase()}
        </Badge>
      )
    },
    {
      accessorKey: 'last_active_at',
      header: 'Last Active',
      cell: ({ row }: any) => (
        <span className="text-xs text-text-secondary">
          {row.original.last_active_at ? formatRelativeTime(row.original.last_active_at) : 'Never'}
        </span>
      )
    },
    {
      id: 'actions',
      cell: () => (
        <Button variant="ghost" size="sm" onClick={() => toast.info('Role modification opening...')}>Edit</Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Team Management" 
        description="Manage administrative users and their access roles."
        actions={
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-syne font-bold text-text-primary">Invite Administrator</Dialog.Title>
                  <Dialog.Close className="text-text-muted hover:text-text-primary text-2xl h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                    <X size={20} />
                  </Dialog.Close>
                </div>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</label>
                    <input type="email" placeholder="colleague@herald.xyz" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Role Assignment</label>
                    <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal">
                      <option value="operator">Operator (Standard)</option>
                      <option value="viewer">Viewer (Read-only)</option>
                      <option value="super_admin">Super Admin (Destructive)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Dialog.Close asChild>
                    <Button variant="ghost">Cancel</Button>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Button onClick={() => toast.success('Administrator invitation sent via SES.')}>Send Invitation</Button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable 
            columns={columns as any} 
            data={data?.data || []} 
            isLoading={isLoading}
          />
        </div>

        <div className="space-y-6">
          <Card padding="lg" className="space-y-4">
            <h3 className="font-syne text-base font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal" />
              Role Permissions
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-teal flex items-center gap-1">
                  Super Admin
                </p>
                <p className="text-[11px] text-text-secondary">
                  Full control including protocol suspension, team management, and billing. Required wallet signature.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-text-primary flex items-center gap-1">
                  Operator
                </p>
                <p className="text-[11px] text-text-secondary">
                  Can view all data and manage incident responses. Cannot suspend protocols.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-text-muted flex items-center gap-1">
                  Viewer
                </p>
                <p className="text-[11px] text-text-secondary">
                  Read-only access to monitoring dashboards and audit logs.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}