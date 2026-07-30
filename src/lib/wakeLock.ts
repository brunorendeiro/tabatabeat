export class WakeLockManager {
  private sentinel: WakeLockSentinel | null = null
  private wanted = false

  async request(): Promise<void> {
    this.wanted = true
    if (!('wakeLock' in navigator)) return
    try {
      this.sentinel = await navigator.wakeLock.request('screen')
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null
      })
    } catch {
      // Wake Lock can reject if the tab isn't visible or isn't allowed — safe to ignore.
    }
  }

  async release(): Promise<void> {
    this.wanted = false
    const current = this.sentinel
    this.sentinel = null
    if (current) {
      try {
        await current.release()
      } catch {
        // already released
      }
    }
  }

  async handleVisibilityChange(): Promise<void> {
    if (this.wanted && document.visibilityState === 'visible' && !this.sentinel) {
      await this.request()
    }
  }
}
