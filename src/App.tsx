import { useEffect, useRef, useState } from 'react'
import { detectLocale, locales, motivationalPhrases, speechLang, ui, type Locale } from './i18n'
import { getStoredConsent, loadAnalytics } from './analytics'
import CookieConsent from './CookieConsent'
import {
  buildSchedule,
  formatClock,
  totalDurationSeconds,
  MIN_TABATAS,
  MAX_TABATAS,
  MIN_REST_BETWEEN,
  MAX_REST_BETWEEN,
  ROUNDS_PER_TABATA,
  type Phase,
} from './lib/tabata'
import { useTabataEngine } from './lib/useTabataEngine'
import { TabataAudio, decodeAudioFromUrl } from './lib/audio'
import { WakeLockManager } from './lib/wakeLock'
import { TabataVoice } from './lib/voice'

const MUSIC_URL = '/tabata-sound.m4a'

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem('tabatabeat-install-dismissed') === '1')

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  const dismiss = () => {
    setDismissed(true)
    window.localStorage.setItem('tabatabeat-install-dismissed', '1')
  }

  const showIosHint = isIos() && !isStandalone() && !dismissed
  const showAndroidPrompt = deferred !== null && !dismissed
  const visible = !isStandalone() && (showIosHint || showAndroidPrompt)

  return { visible, showIosHint, install, dismiss }
}

const phaseAccentClass: Record<Phase['kind'], string> = {
  prepare: 'phase-prepare',
  work: 'phase-work',
  rest: 'phase-rest',
  restBetween: 'phase-rest-between',
  done: 'phase-done',
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => detectLocale())
  const [numTabatas, setNumTabatas] = useState(4)
  const [restBetween, setRestBetween] = useState(60)

  const audioRef = useRef<TabataAudio>(new TabataAudio())
  const voiceRef = useRef(new TabataVoice())
  const wakeLockRef = useRef(new WakeLockManager())
  const install = useInstallPrompt()
  const t = ui[locale]

  useEffect(() => {
    window.localStorage.setItem('tabatabeat-locale', locale)
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  useEffect(() => {
    if (getStoredConsent() === 'granted') loadAnalytics()
  }, [])

  useEffect(() => {
    // The workout audio is bundled with the app (one tabata's worth, trimmed ahead of
    // time) and always plays automatically — there is nothing for the user to pick.
    decodeAudioFromUrl(MUSIC_URL)
      .then(buffer => audioRef.current.setMusicBuffer(buffer))
      .catch(() => {
        // offline on first visit before the asset was cached, or unsupported format — beeps still work
      })
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      void wakeLockRef.current.handleVisibilityChange()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    const voice = voiceRef.current
    const wakeLock = wakeLockRef.current
    return () => {
      audio.close()
      voice.stop()
      void wakeLock.release()
    }
  }, [])

  function maybeSpeakMotivation(phase: Phase) {
    const lang = speechLang[locale]
    const bank = motivationalPhrases[locale]
    const isLastRound = phase.roundIndex === ROUNDS_PER_TABATA - 1
    let phrase: string | null = null
    if (phase.kind === 'work') {
      if (isLastRound) phrase = pickRandom(bank.workLastRound)
      else if (Math.random() < 0.4) phrase = pickRandom(bank.work)
    } else if (phase.kind === 'rest' && Math.random() < 0.4) {
      phrase = pickRandom(bank.rest)
    } else if (phase.kind === 'restBetween') {
      phrase = pickRandom(bank.restBetween)
    } else if (phase.kind === 'done') {
      phrase = pickRandom(bank.done)
    }
    if (phrase) {
      const text = phrase
      window.setTimeout(() => voiceRef.current.speak(text, lang), 250)
    }
  }

  function handlePhaseEnter(phase: Phase) {
    audioRef.current.playCue(phase.kind)
    if (phase.kind === 'work' && phase.roundIndex === 0 && audioRef.current.hasMusic()) {
      audioRef.current.playMusicSegment(0, audioRef.current.musicDuration())
    }
    if (phase.kind === 'restBetween' || phase.kind === 'done') {
      audioRef.current.stopMusic()
    }
    if (phase.kind !== 'prepare') maybeSpeakMotivation(phase)
  }

  function handleSecondTick(remainingWhole: number, phase: Phase) {
    if (phase.kind !== 'done' && remainingWhole >= 1 && remainingWhole <= 3) {
      audioRef.current.tick()
    }
  }

  const engine = useTabataEngine(handlePhaseEnter, handleSecondTick)

  function handleStart() {
    audioRef.current.ensureContext()
    voiceRef.current.unlock()
    void wakeLockRef.current.request()
    const schedule = buildSchedule({ numTabatas, restBetweenSeconds: restBetween })
    engine.start(schedule)
  }

  function handleReset() {
    audioRef.current.stopMusic()
    voiceRef.current.stop()
    void wakeLockRef.current.release()
    engine.reset()
  }

  function handlePause() {
    audioRef.current.pauseAll()
    voiceRef.current.stop()
    engine.pause()
  }

  function handleResume() {
    audioRef.current.resumeAll()
    engine.resume()
  }

  const isConfiguring = engine.status === 'idle'
  const previewSchedule = buildSchedule({ numTabatas, restBetweenSeconds: restBetween })
  const previewTotal = formatClock(totalDurationSeconds(previewSchedule))

  const phase = engine.phase
  const accentClass = phase ? phaseAccentClass[phase.kind] : 'phase-prepare'

  const phaseLabel = (kind: Phase['kind']) => {
    switch (kind) {
      case 'prepare': return t.phasePrepare
      case 'work': return t.phaseWork
      case 'rest': return t.phaseRest
      case 'restBetween': return t.phaseRestBetween
      case 'done': return t.phaseDone
    }
  }

  return <div className="app">
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">⏱️</span>
        <div>
          <strong>{t.title}</strong>
          <small>{t.tagline}</small>
        </div>
      </div>
      <div className="locale-switch" role="group" aria-label="Language">
        {locales.map(item => (
          <button key={item.id} className={locale === item.id ? 'active' : ''} onClick={() => setLocale(item.id)}>{item.label}</button>
        ))}
      </div>
    </header>

    {isConfiguring && (
      <>
        <p className="intro">{t.intro}</p>

        <section className="config-card">
          <div className="config-row">
            <label htmlFor="numTabatas">{t.numTabatasLabel}</label>
            <div className="stepper">
              <button type="button" onClick={() => setNumTabatas(n => Math.max(MIN_TABATAS, n - 1))} aria-label="-">−</button>
              <span id="numTabatas">{numTabatas}</span>
              <button type="button" onClick={() => setNumTabatas(n => Math.min(MAX_TABATAS, n + 1))} aria-label="+">+</button>
            </div>
          </div>

          <div className="config-row">
            <label htmlFor="restBetween">{t.restBetweenLabel}</label>
            <div className="stepper">
              <button type="button" onClick={() => setRestBetween(n => Math.max(MIN_REST_BETWEEN, n - 5))} aria-label="-">−</button>
              <span id="restBetween">{restBetween}s</span>
              <button type="button" onClick={() => setRestBetween(n => Math.min(MAX_REST_BETWEEN, n + 5))} aria-label="+">+</button>
            </div>
          </div>

          <p className="config-summary">{t.summary(numTabatas, previewTotal)}</p>
        </section>

        <button type="button" className="play-button" onClick={handleStart}>▶ {t.startButton}</button>
      </>
    )}

    {!isConfiguring && phase && (
      <section className={`runner ${accentClass}`}>
        <p className="runner-progress">
          {phase.kind !== 'done' && t.tabataProgress(phase.tabataIndex + 1, numTabatas)}
          {(phase.kind === 'work' || phase.kind === 'rest') && ` · ${t.roundProgress(phase.roundIndex + 1, ROUNDS_PER_TABATA)}`}
        </p>
        <p className="runner-phase">{phaseLabel(phase.kind)}</p>
        <p className="runner-clock">{phase.kind === 'done' ? '✓' : formatClock(engine.remainingSeconds)}</p>

        {phase.kind === 'done' ? (
          <>
            <p className="runner-done-title">{t.doneTitle}</p>
            <p className="runner-done-body">{t.doneBody}</p>
          </>
        ) : (
          <p className="runner-wakelock-note">{t.wakeLockNote}</p>
        )}

        <div className="runner-controls">
          {phase.kind !== 'done' && engine.status === 'running' && (
            <button type="button" onClick={handlePause}>{t.pauseButton}</button>
          )}
          {phase.kind !== 'done' && engine.status === 'paused' && (
            <button type="button" onClick={handleResume}>{t.resumeButton}</button>
          )}
          <button type="button" onClick={handleReset}>{t.resetButton}</button>
        </div>
      </section>
    )}

    {isConfiguring && install.visible && (
      <section className="install-banner">
        <div>
          <strong>{t.installTitle}</strong>
          <p>{install.showIosHint ? t.installIosHint : t.installBody}</p>
        </div>
        <div className="install-actions">
          {!install.showIosHint && <button type="button" className="install-accept" onClick={install.install}>{t.installButton}</button>}
          <button type="button" className="install-dismiss" onClick={install.dismiss}>{t.installDismiss}</button>
        </div>
      </section>
    )}

    <footer>
      <a href="https://vibe-portfolio-one.vercel.app/" target="_blank" rel="noreferrer">Created by Bruno Rendeiro</a>
      <span>{t.footerTagline}</span>
      <span className="powered-badge">⚡ Powered by AI</span>
    </footer>
    <CookieConsent locale={locale} />
  </div>
}
