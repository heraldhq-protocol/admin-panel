/* eslint-disable import/no-default-export */
'use client'

import * as React from 'react'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignOutPage() {
  const { status } = useSession()
  const [signing, setSigning] = React.useState(false)

  // If there's no active session, go straight to login
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.replace('/login')
    }
  }, [status])

  const handleSignOut = async () => {
    setSigning(true)
    await signOut({ redirectTo: '/login' })
  }

  const handleCancel = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo / icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-8 w-8 text-teal" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="font-syne text-2xl font-bold text-text-primary">
            Sign out?
          </h1>
          <p className="text-sm text-text-secondary">
            You&apos;ll need to sign in again to access the Herald admin panel.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() => void handleSignOut()}
            disabled={signing || status === 'loading'}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {signing ? 'Signing out…' : 'Yes, sign me out'}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCancel}
            disabled={signing}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
