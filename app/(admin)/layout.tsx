import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/layout/admin-shell'
import { RouteErrorBoundary } from '@/components/layout/error-boundary'

/* eslint-disable import/no-default-export */
// Required: Next.js App Router layout must use default export

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  // No session or stale/malformed session — redirect to sign-out which clears
  // the cookie before sending to login. Redirecting directly to /login leaves
  // the bad cookie intact and can cause an infinite reload loop.
  if (!session || session.error === 'RefreshTokenError') {
    redirect('/api/auth/signout?callbackUrl=/login')
  }

  return (
    <AdminShell>
      <RouteErrorBoundary>{children}</RouteErrorBoundary>
    </AdminShell>
  )
}