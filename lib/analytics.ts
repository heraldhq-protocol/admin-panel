'use client'

import posthog from 'posthog-js'

type Props = Record<string, unknown>

/**
 * Fire a PostHog event. Safe to call before init — posthog-js queues internally.
 * Swallows errors so analytics never breaks the UI.
 */
export function track(event: string, props?: Props): void {
  try {
    posthog.capture(event, props)
  } catch {
    // silent — analytics must never throw
  }
}

/** Drop-in React hook for components/hooks that need to fire events */
export function useAnalytics() {
  return { track }
}
