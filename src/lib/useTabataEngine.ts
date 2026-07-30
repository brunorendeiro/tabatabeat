import { useCallback, useEffect, useRef, useState } from 'react'
import type { Phase } from './tabata'

export type EngineStatus = 'idle' | 'running' | 'paused' | 'finished'

export function useTabataEngine(
  onPhaseEnter: (phase: Phase, index: number) => void,
  onSecondTick: (remainingWhole: number, phase: Phase) => void,
) {
  const [status, setStatus] = useState<EngineStatus>('idle')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [schedule, setSchedule] = useState<Phase[]>([])

  const scheduleRef = useRef<Phase[]>([])
  const phaseIndexRef = useRef(0)
  const phaseStartRef = useRef(0)
  const remainingRef = useRef(0)
  // A plain interval (not requestAnimationFrame) on purpose: rAF is fully suspended
  // by the browser while the tab/screen isn't visible, which would silently freeze
  // the whole workout if the phone locks or the user briefly switches apps. Timers
  // only get throttled (down to ~1/s) in that case, so beeps/voice cues still fire,
  // just possibly a little late — the elapsed-time math below stays correct either way.
  const intervalRef = useRef<number | null>(null)
  const lastWholeRef = useRef<number | null>(null)
  const statusRef = useRef<EngineStatus>('idle')

  const onPhaseEnterRef = useRef(onPhaseEnter)
  const onSecondTickRef = useRef(onSecondTick)
  onPhaseEnterRef.current = onPhaseEnter
  onSecondTickRef.current = onSecondTick

  const setStatusBoth = (next: EngineStatus) => {
    statusRef.current = next
    setStatus(next)
  }

  const stopLoop = () => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const enterPhase = useCallback((index: number, overshootSeconds = 0) => {
    const currentSchedule = scheduleRef.current
    const clamped = Math.min(index, currentSchedule.length - 1)
    const phase = currentSchedule[clamped]
    phaseIndexRef.current = clamped
    setPhaseIndex(clamped)
    // Carry over any overshoot from the previous phase so a slow/throttled frame
    // (e.g. tab briefly backgrounded) doesn't push the whole schedule out of sync.
    phaseStartRef.current = performance.now() - overshootSeconds * 1000
    lastWholeRef.current = null
    remainingRef.current = phase.seconds - overshootSeconds
    setRemainingSeconds(remainingRef.current)
    onPhaseEnterRef.current(phase, clamped)
    if (phase.kind === 'done') {
      stopLoop()
      setStatusBoth('finished')
    }
  }, [])

  const loop = useCallback(() => {
    if (statusRef.current !== 'running') return
    const currentSchedule = scheduleRef.current
    const phase = currentSchedule[phaseIndexRef.current]
    if (!phase || phase.kind === 'done') return
    const elapsed = (performance.now() - phaseStartRef.current) / 1000
    const remaining = phase.seconds - elapsed
    if (remaining <= 0) {
      enterPhase(phaseIndexRef.current + 1, Math.min(-remaining, currentSchedule[phaseIndexRef.current + 1]?.seconds ?? 0))
      return
    }
    remainingRef.current = remaining
    setRemainingSeconds(remaining)
    const whole = Math.ceil(remaining)
    if (whole !== lastWholeRef.current) {
      lastWholeRef.current = whole
      onSecondTickRef.current(whole, phase)
    }
  }, [enterPhase])

  const start = useCallback((newSchedule: Phase[]) => {
    scheduleRef.current = newSchedule
    setSchedule(newSchedule)
    setStatusBoth('running')
    enterPhase(0)
    stopLoop()
    intervalRef.current = window.setInterval(loop, 100)
  }, [enterPhase, loop])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return
    stopLoop()
    setStatusBoth('paused')
  }, [])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return
    const phase = scheduleRef.current[phaseIndexRef.current]
    const elapsedSoFar = phase.seconds - remainingRef.current
    phaseStartRef.current = performance.now() - elapsedSoFar * 1000
    lastWholeRef.current = Math.ceil(remainingRef.current)
    setStatusBoth('running')
    stopLoop()
    intervalRef.current = window.setInterval(loop, 100)
  }, [loop])

  const reset = useCallback(() => {
    stopLoop()
    scheduleRef.current = []
    setSchedule([])
    phaseIndexRef.current = 0
    remainingRef.current = 0
    setPhaseIndex(0)
    setRemainingSeconds(0)
    setStatusBoth('idle')
  }, [])

  useEffect(() => stopLoop, [])

  useEffect(() => {
    // Timers throttle heavily while hidden; snap to the correct state the instant
    // the tab is visible again instead of waiting for the next (possibly delayed) tick.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [loop])

  return {
    status,
    phase: schedule[phaseIndex] ?? null,
    phaseIndex,
    remainingSeconds,
    schedule,
    start,
    pause,
    resume,
    reset,
  }
}
