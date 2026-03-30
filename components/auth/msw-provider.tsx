'use client'

import { useEffect, useState } from 'react'

export function MswProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false)

  useEffect(() => {
    const shouldMock =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true'

    const initMsw = async () => {
      if (typeof window !== 'undefined' && shouldMock) {
        const { worker } = await import('../../mocks/browser')
        await worker.start({
          onUnhandledRequest: 'bypass',
        })
        setMswReady(true)
      } else {
        setMswReady(true)
      }
    }

    initMsw()
  }, [])

  if (!mswReady) {
    return null
  }

  return <>{children}</>
}
