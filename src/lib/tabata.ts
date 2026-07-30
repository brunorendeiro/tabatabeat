export const WORK_SECONDS = 20
export const REST_SECONDS = 10
export const ROUNDS_PER_TABATA = 8
export const PREPARE_SECONDS = 5
export const TABATA_SECONDS = ROUNDS_PER_TABATA * (WORK_SECONDS + REST_SECONDS)

export const MIN_TABATAS = 1
export const MAX_TABATAS = 12
export const MIN_REST_BETWEEN = 0
export const MAX_REST_BETWEEN = 300

export type TabataConfig = {
  numTabatas: number
  restBetweenSeconds: number
}

export type PhaseKind = 'prepare' | 'work' | 'rest' | 'restBetween' | 'done'

export type Phase = {
  kind: PhaseKind
  seconds: number
  tabataIndex: number
  roundIndex: number
}

export function clampConfig(config: TabataConfig): TabataConfig {
  return {
    numTabatas: Math.min(MAX_TABATAS, Math.max(MIN_TABATAS, Math.round(config.numTabatas))),
    restBetweenSeconds: Math.min(MAX_REST_BETWEEN, Math.max(MIN_REST_BETWEEN, Math.round(config.restBetweenSeconds))),
  }
}

export function buildSchedule(rawConfig: TabataConfig): Phase[] {
  const config = clampConfig(rawConfig)
  const schedule: Phase[] = [
    { kind: 'prepare', seconds: PREPARE_SECONDS, tabataIndex: 0, roundIndex: -1 },
  ]

  for (let t = 0; t < config.numTabatas; t++) {
    for (let r = 0; r < ROUNDS_PER_TABATA; r++) {
      schedule.push({ kind: 'work', seconds: WORK_SECONDS, tabataIndex: t, roundIndex: r })
      schedule.push({ kind: 'rest', seconds: REST_SECONDS, tabataIndex: t, roundIndex: r })
    }
    const isLast = t === config.numTabatas - 1
    if (!isLast && config.restBetweenSeconds > 0) {
      schedule.push({ kind: 'restBetween', seconds: config.restBetweenSeconds, tabataIndex: t, roundIndex: -1 })
    }
  }

  schedule.push({ kind: 'done', seconds: 0, tabataIndex: config.numTabatas - 1, roundIndex: -1 })
  return schedule
}

export function totalDurationSeconds(schedule: Phase[]): number {
  return schedule.reduce((sum, phase) => sum + phase.seconds, 0)
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}
