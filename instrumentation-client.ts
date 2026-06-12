import { init, initClickTracking, initPageTracking, initLocationTracking } from '@adtivity/adtivity-sdk'

if (typeof window !== 'undefined') {
  const API_KEY = process.env.NEXT_PUBLIC_ADTIVITY_API_KEY
  if (API_KEY) {
    try {
      init({
        apiKey: API_KEY,
        debug: false,
      })
      initPageTracking()
      initClickTracking()
      initLocationTracking()
    } catch (err) {
      console.warn('Adtivity SDK failed to initialize:', err)
    }
  }
}
