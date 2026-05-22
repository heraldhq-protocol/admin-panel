import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  defaults: '2026-01-30',
  capture_pageview: true,
  capture_pageleave: true,
  // Mask all inputs in session recordings — this panel handles sensitive protocol data
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-sensitive]',
  },
  // Disable autocapture of clicks/forms — we fire explicit events only
  autocapture: false,
})
