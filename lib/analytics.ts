'use client'

import { trackEvent } from '@adtivity/adtivity-sdk'

type Props = Record<string, unknown>

/**
 * Fire an Adtivity event. Safe to call before init — SDK queues internally.
 * Swallows errors so analytics never breaks the UI.
 */
export function track(event: string, props?: Props): void {
  try {
    trackEvent(event, props)
  } catch {
    // silent — analytics must never throw
  }
}

/** Drop-in React hook for components/hooks that need to fire events */
export function useAnalytics() {
  return { track }
}
