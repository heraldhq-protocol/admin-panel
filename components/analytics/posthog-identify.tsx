'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import posthog from 'posthog-js'

/**
 * Identifies the logged-in admin in PostHog once the session is available.
 * Mount this inside any authenticated layout.
 */
export function PostHogIdentify() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    posthog.identify(session.user.id, {
      role: session.user.role,
      auth_method: session.user.auth_method,
      display_name: session.user.display_name,
    })
  }, [session?.user?.id])

  return null
}
