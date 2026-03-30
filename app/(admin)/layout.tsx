import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/layout/admin-shell'

/* eslint-disable import/no-default-export */
// Required: Next.js App Router layout must use default export

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return <AdminShell>{children}</AdminShell>
}