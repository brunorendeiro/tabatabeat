import { useEffect, useState } from 'react'
import { getStoredConsent, setConsent } from './analytics'
import { ui, type Locale } from './i18n'

export default function CookieConsent({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false)
  const t = ui[locale]

  useEffect(() => {
    setVisible(getStoredConsent() === null)
  }, [])

  if (!visible) return null

  const decide = (value: 'granted' | 'denied') => {
    setConsent(value)
    setVisible(false)
  }

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookies">
      <p>{t.cookieBody}</p>
      <div className="cookie-actions">
        <button className="cookie-reject" onClick={() => decide('denied')}>{t.cookieReject}</button>
        <button className="cookie-accept" onClick={() => decide('granted')}>{t.cookieAccept}</button>
      </div>
    </div>
  )
}
