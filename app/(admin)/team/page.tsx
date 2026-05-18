/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { UserPlus, Shield, User, X, Trash2 } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useTeam } from '@/hooks/use-team'
import { useInviteTeamMember } from '@/hooks/use-invite-team-member'
import { useUpdateTeamRole } from '@/hooks/use-update-team-role'
import { useRemoveTeamMember } from '@/hooks/use-remove-team-member'
import { formatRelativeTime } from '@/lib/format'
import type { TeamMember } from '@/types/api'
import type { AdminRole, AuthMethod } from '@/types/auth'

const ROLE_OPTIONS: Array<{ value: Exclude<AdminRole, 'super_admin'>; label: string }> = [
  { value: 'admin', label: 'Admin (can suspend protocols)' },
  { value: 'viewer', label: 'Viewer (read-only)' },
]

export default function TeamPage() {
  const { data: members, isLoading } = useTeam()
  const inviteMember = useInviteTeamMember()
  const updateRole = useUpdateTeamRole()
  const removeMember = useRemoveTeamMember()

  const PAGE_SIZE = 10
  const [page, setPage] = React.useState(1)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [editMember, setEditMember] = React.useState<TeamMember | null>(null)
  const [invite, setInvite] = React.useState({
    display_name: '',
    role: 'viewer' as Exclude<AdminRole, 'super_admin'>,
    auth_method: 'email-totp' as AuthMethod,
    email: '',
    wallet_address: '',
  })

  const handleInvite = () => {
    inviteMember.mutate(
      {
        display_name: invite.display_name,
        role: invite.role,
        auth_method: invite.auth_method,
        ...(invite.auth_method === 'email-totp' && invite.email ? { email: invite.email } : {}),
        ...(invite.auth_method === 'wallet' && invite.wallet_address ? { wallet_address: invite.wallet_address } : {}),
      },
      {
        onSuccess: () => {
          setInviteOpen(false)
          setInvite({ display_name: '', role: 'viewer', auth_method: 'email-totp', email: '', wallet_address: '' })
        },
      },
    )
  }

  const isInviteValid =
    invite.display_name.trim().length >= 2 &&
    (invite.auth_method === 'email-totp' ? invite.email.includes('@') : invite.wallet_address.length >= 32)

  const columns = [
    {
      accessorKey: 'display_name',
      header: 'Member',
      cell: ({ row }: { row: { original: TeamMember } }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">
            <User size={16} />
          </div>
          <span className="font-bold">{row.original.display_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }: { row: { original: TeamMember } }) => (
        <Badge variant={row.original.role === 'super_admin' ? 'enterprise' : row.original.role === 'admin' ? 'growth' : 'developer'}>
          {row.original.role.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'auth_method',
      header: 'Auth',
      cell: ({ row }: { row: { original: TeamMember } }) => (
        <Badge variant="developer">{row.original.auth_method.toUpperCase()}</Badge>
      ),
    },
    {
      accessorKey: 'last_active_at',
      header: 'Last Active',
      cell: ({ row }: { row: { original: TeamMember } }) => (
        <span className="text-xs text-text-secondary">
          {row.original.last_active_at ? formatRelativeTime(row.original.last_active_at) : 'Never'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: TeamMember } }) => {
        const member = row.original
        if (member.role === 'super_admin') {
          return <span className="text-xs text-text-muted">—</span>
        }
        return (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditMember(member)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red hover:text-red hover:bg-admin-bg"
              disabled={removeMember.isPending}
              onClick={() => removeMember.mutate(member.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        description="Manage Herald administrative users and their access roles."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DataTable
            columns={columns as never[]}
            data={(members ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
            isLoading={isLoading}
          />
          {!isLoading && (members?.length ?? 0) > PAGE_SIZE && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-text-muted">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, members!.length)} of {members!.length} members
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= (members?.length ?? 0)} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>

        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne text-base font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal" />
            Role Permissions
          </h3>
          <div className="space-y-4 text-[11px]">
            <div className="space-y-1">
              <p className="font-bold text-teal">Super Admin</p>
              <p className="text-text-secondary">Full control: protocol suspension, team management, billing, tier changes. Wallet signature required. Cannot be granted via API.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-text-primary">Admin</p>
              <p className="text-text-secondary">Can suspend protocols, change tiers, manage design partners, and resolve incidents.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-text-muted">Viewer</p>
              <p className="text-text-secondary">Read-only access to all dashboards and audit logs. Cannot take any mutating actions.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-syne font-bold text-text-primary">Invite Administrator</Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                  value={invite.display_name}
                  onChange={(e) => setInvite((f) => ({ ...f, display_name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Auth Method</label>
                <div className="flex gap-2">
                  {(['email-totp', 'wallet'] as AuthMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setInvite((f) => ({ ...f, auth_method: method }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        invite.auth_method === method
                          ? 'bg-teal/10 text-teal border-teal'
                          : 'bg-card border-border text-text-muted hover:border-border-2'
                      }`}
                    >
                      {method === 'email-totp' ? 'Email + TOTP' : 'Wallet'}
                    </button>
                  ))}
                </div>
              </div>

              {invite.auth_method === 'email-totp' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    placeholder="colleague@herald.xyz"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                    value={invite.email}
                    onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Base58 Solana address"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-teal"
                    value={invite.wallet_address}
                    onChange={(e) => setInvite((f) => ({ ...f, wallet_address: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Role</label>
                <select
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                  value={invite.role}
                  onChange={(e) => setInvite((f) => ({ ...f, role: e.target.value as Exclude<AdminRole, 'super_admin'> }))}
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <p className="text-[10px] text-text-muted">Invite token expires in 7 days. Email delivery is not yet configured — check server logs for the token.</p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.Close>
              <Button disabled={!isInviteValid || inviteMember.isPending} onClick={handleInvite}>
                Send Invitation
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Role Dialog */}
      <Dialog.Root open={editMember !== null} onOpenChange={(open) => { if (!open) setEditMember(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-syne font-bold text-text-primary">
                Edit Role — {editMember?.display_name}
              </Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {ROLE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${
                    editMember?.role === o.value
                      ? 'bg-teal/10 border-teal text-teal font-bold'
                      : 'bg-card border-border text-text-primary hover:border-border-2'
                  }`}
                  onClick={() => {
                    if (editMember) {
                      updateRole.mutate(
                        { id: editMember.id, role: o.value },
                        { onSuccess: () => setEditMember(null) },
                      )
                    }
                  }}
                  disabled={updateRole.isPending}
                >
                  {o.label}
                </button>
              ))}
              <p className="text-[10px] text-text-muted">This action will be logged with your admin ID.</p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
