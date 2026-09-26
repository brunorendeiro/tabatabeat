import type { PhaseKind } from './tabata'

type ToneSpec = { freq: number; delay: number; duration: number; type?: OscillatorType; gain?: number }

/** Decodes a same-origin audio asset without touching the real playback AudioContext (no user gesture needed). */
export async function decodeAudioFromUrl(url: string): Promise<AudioBuffer> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const offline = new OfflineAudioContext(2, 1, 44100)
  return offline.decodeAudioData(arrayBuffer)
}

export class TabataAudio {
  private ctx: AudioContext | null = null
  private musicBuffer: AudioBuffer | null = null
  private musicSource: AudioBufferSourceNode | null = null
  private musicGain: GainNode | null = null
  // ctx time at which the current tabata started while the music was still decoding —
  // lets setMusicBuffer() join in at the right offset instead of skipping the whole tabata.
  private pendingMusicStart: number | null = null
  private paused = false

  /** Must be called synchronously inside a user-gesture handler (e.g. onClick of Play). */
  ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = 1
      this.musicGain.connect(this.ctx.destination)
    }
    this.paused = false
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private tone({ freq, delay, duration, type = 'sine', gain = 0.3 }: ToneSpec) {
    const ctx = this.ctx
    if (!ctx) return
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    const start = ctx.currentTime + delay
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(gain, start + 0.01)
    env.gain.linearRampToValueAtTime(0, start + duration)
    osc.connect(env)
    env.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  /** iOS can interrupt the context (e.g. when speech synthesis grabs the audio
   * session); bring it back unless the user paused on purpose. */
  private recover() {
    if (this.ctx && !this.paused && this.ctx.state !== 'running' && this.ctx.state !== 'closed') {
      void this.ctx.resume()
    }
  }

  playCue(kind: PhaseKind) {
    if (!this.ctx) return
    this.recover()
    switch (kind) {
      case 'work':
        this.tone({ freq: 1046, delay: 0, duration: 0.22, type: 'square', gain: 0.28 })
        break
      case 'rest':
        this.tone({ freq: 440, delay: 0, duration: 0.28, type: 'sine', gain: 0.24 })
        break
      case 'restBetween':
        this.tone({ freq: 392, delay: 0, duration: 0.2, type: 'sine', gain: 0.24 })
        this.tone({ freq: 392, delay: 0.28, duration: 0.2, type: 'sine', gain: 0.24 })
        break
      case 'prepare':
        this.tone({ freq: 660, delay: 0, duration: 0.18, type: 'triangle', gain: 0.22 })
        break
      case 'done':
        this.tone({ freq: 523, delay: 0, duration: 0.18, type: 'square', gain: 0.28 })
        this.tone({ freq: 659, delay: 0.16, duration: 0.18, type: 'square', gain: 0.28 })
        this.tone({ freq: 784, delay: 0.32, duration: 0.4, type: 'square', gain: 0.3 })
        break
    }
  }

  tick() {
    if (!this.ctx) return
    this.recover()
    this.tone({ freq: 880, delay: 0, duration: 0.06, type: 'square', gain: 0.16 })
  }

  setMusicBuffer(buffer: AudioBuffer | null) {
    this.musicBuffer = buffer
    if (buffer && this.ctx && this.pendingMusicStart !== null) {
      const elapsed = this.ctx.currentTime - this.pendingMusicStart
      this.pendingMusicStart = null
      this.playMusicSegment(elapsed, buffer.duration)
    }
  }

  /** Starts the tabata's music from the top; if it hasn't finished decoding yet, it
   * starts (in sync) as soon as it does. */
  startMusic() {
    if (!this.ctx) return
    if (this.musicBuffer) {
      this.playMusicSegment(0, this.musicBuffer.duration)
    } else {
      this.pendingMusicStart = this.ctx.currentTime
    }
  }

  /** Plays [trimStart, trimEnd] of the loaded music buffer starting now, layered under the beep cues. */
  playMusicSegment(trimStart: number, trimEnd: number) {
    if (!this.ctx || !this.musicBuffer || !this.musicGain) return
    this.stopMusic()
    const source = this.ctx.createBufferSource()
    source.buffer = this.musicBuffer
    source.connect(this.musicGain)
    const offset = Math.max(0, Math.min(trimStart, this.musicBuffer.duration))
    const end = Math.max(offset, Math.min(trimEnd, this.musicBuffer.duration))
    const duration = Math.max(0, end - offset)
    if (duration <= 0) return
    source.start(this.ctx.currentTime, offset, duration)
    this.musicSource = source
  }

  stopMusic() {
    this.pendingMusicStart = null
    if (this.musicSource) {
      try {
        this.musicSource.stop()
      } catch {
        // already stopped
      }
      this.musicSource.disconnect()
      this.musicSource = null
    }
  }

  /** Freezes everything currently playing (beeps scheduled, and — importantly — the
   * background music) in place. AudioBufferSourceNode has no pause() of its own, so
   * suspending the whole context is the standard way to pause Web Audio playback. */
  pauseAll() {
    this.paused = true
    void this.ctx?.suspend()
  }

  resumeAll() {
    this.paused = false
    void this.ctx?.resume()
  }

  close() {
    this.stopMusic()
    void this.ctx?.close()
    this.ctx = null
  }
}
