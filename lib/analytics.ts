'use client'

/**
 * Thin PostHog wrapper. Import useAnalytics() in client components/hooks.
 *
 * Setup:
 *   1. pnpm add posthog-js
 *   2. Add NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST to .env
 *   3. Call initPostHog() inside app/providers.tsx (client side)
 *
 * Until PostHog is installed, all calls are silent no-ops so nothing breaks.
 */

type Props = Record<string, unknown>

// posthog-js not yet installed — all calls are no-ops.
// To enable: pnpm add posthog-js, then replace this stub with a real import.
function getPostHog(): { capture: (e: string, p?: Props) => void; init: (k: string, o: object) => void } | null {
  return null
}

export function initPostHog(): void {
  const ph = getPostHog()
  if (!ph) return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) {
    console.warn('[analytics] NEXT_PUBLIC_POSTHOG_KEY not set — tracking disabled')
    return
  }

  ph.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    // Mask all inputs in session recordings for ops security
    session_recording: { maskAllInputs: true },
  })
}

export function track(event: string, props?: Props): void {
  const ph = getPostHog()
  ph?.capture(event, props)
}

/** Drop-in React hook for components/hooks that need to fire events */
export function useAnalytics() {
  return { track }
}
