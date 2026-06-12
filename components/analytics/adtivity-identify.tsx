'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { identify } from '@adtivity/adtivity-sdk'

/**
 * Identifies the logged-in admin in Adtivity once the session is available.
 * Mount this inside any authenticated layout.
 */
export function AdtivityIdentify() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user || !process.env.NEXT_PUBLIC_ADTIVITY_API_KEY) return

    try {
      identify(session.user.id, {
        name: session.user.display_name ?? undefined,
        email: session.user.email ?? undefined,
      })
    } catch (err) {
      console.warn("Adtivity identify failed", err)
    }
  }, [session?.user?.id])

  return null
}
