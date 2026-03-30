'use client'

import { useQuery } from '@tanstack/react-query'
import { UserPlus, Shield, User } from 'lucide-react'
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
        <Button variant="ghost" size="sm">Edit</Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Team Management" 
        description="Manage administrative users and their access roles."
        actions={
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
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