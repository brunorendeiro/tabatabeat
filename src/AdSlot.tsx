import { useEffect, useState } from 'react'
import { getStoredConsent } from './analytics'
import { ui, type Locale } from './i18n'

const AD_CLIENT = 'ca-pub-4561414438757131'
const AD_SLOT = '7209633452'

/**
 * Manual, responsive ad unit. Auto ads are disabled in analytics.ts, so this is the
 * only place ads render. It should only be used on screens with substantial real
 * textual content (e.g. the setup screen) — never on the live/running timer screen,
 * which is thin and interactive and would violate AdSense's low-value-content policy.
 */
export default function AdSlot({ locale }: { locale: Locale }) {
  const [granted, setGranted] = useState(false)
  const t = ui[locale]

  useEffect(() => {
    setGranted(getStoredConsent() === 'granted')
  }, [])

  useEffect(() => {
    if (!granted) return
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {
      /* script not loaded yet, or blocked by an ad blocker */
    }
  }, [granted])

  if (!granted) return null

  return (
    <div className="ad-slot">
      <span className="ad-label">{t.adLabel}</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
