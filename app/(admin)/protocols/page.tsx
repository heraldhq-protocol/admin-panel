'use client'
import * as React from 'react'
import { cn } from '@/lib/cn'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QUERY_KEYS } from '@/lib/query-keys'
import { truncateAddress } from '@/lib/format'

export default function ProtocolsPage() {
  const router = useRouter()
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(1)

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.protocols({ search, page }),
    queryFn: () => 
      fetch(`/api/admin/protocols?search=${search}&page=${page}`).then(res => res.json()),
  })

  const columns = [
    {
      accessorKey: 'name',
      header: 'Protocol Name',
      cell: ({ row }: any) => (
        <div className="font-bold text-text-primary">{row.original.name}</div>
      )
    },
    {
      accessorKey: 'protocol_pubkey',
      header: 'Wallet Pubkey',
      cell: ({ row }: any) => (
        <code className="text-[10px] bg-card-2 px-1.5 py-0.5 rounded border border-border">
          {truncateAddress(row.original.protocol_pubkey, 8)}
        </code>
      )
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ row }: any) => {
        const tiers: any = { 0: 'developer', 1: 'growth', 2: 'scale', 3: 'enterprise' }
        return <Badge variant={tiers[row.original.tier]}>{tiers[row.original.tier].toUpperCase()}</Badge>
      }
    },
    {
      accessorKey: 'sends_this_period',
      header: 'Volume (MTD)',
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs">
            {row.original.sends_this_period.toLocaleString()} / {row.original.sends_limit.toLocaleString()}
          </span>
          <div className="w-24 h-1 bg-card-2 rounded-full mt-1 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                (row.original.sends_this_period / row.original.sends_limit) > 0.9 ? "bg-admin" : "bg-teal"
              )}
              style={{ width: `${Math.min((row.original.sends_this_period / row.original.sends_limit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.is_active ? 'active' : 'suspended'}>
          {row.original.is_active ? 'ACTIVE' : 'SUSPENDED'}
        </Badge>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Protocol Registry" 
        description="Manage all connected protocols, their subscription tiers, and operational status."
        actions={
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Protocol
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-syne font-bold text-text-primary">Add New Protocol</Dialog.Title>
                  <Dialog.Close className="text-text-muted hover:text-text-primary text-2xl h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2" aria-label="Close">
                    <X size={20} />
                  </Dialog.Close>
                </div>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Protocol Name</label>
                    <input type="text" placeholder="e.g. Jupiter Exchange" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Wallet Public Key</label>
                    <input type="text" placeholder="Base58 Solana Address" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal font-mono placeholder:font-sans" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Dialog.Close asChild>
                    <Button variant="ghost">Cancel</Button>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Button onClick={() => toast.success('Protocol registration sequence initiated.')}>Register Protocol</Button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search name or pubkey..."
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="md" onClick={() => toast.info('Advanced filtering parameters opened.')}>
          <Filter className="mr-2 h-4 w-4" />
          Advanced Filters
        </Button>
      </div>

      <DataTable 
        columns={columns as any} 
        data={data?.data || []} 
        isLoading={isLoading}
        onRowClick={(row: any) => router.push(`/protocols/${row.id}`)}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          Showing {data?.data?.length ?? 0} of {data?.total ?? 0} protocols
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!data?.has_more}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}