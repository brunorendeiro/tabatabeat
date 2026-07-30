export class TabataVoice {
  private unlocked = false

  /** Must be called synchronously inside a user-gesture handler (e.g. onClick of Play). */
  unlock() {
    if (this.unlocked || !('speechSynthesis' in window)) return
    this.unlocked = true
    const utter = new SpeechSynthesisUtterance('')
    utter.volume = 0
    window.speechSynthesis.speak(utter)
  }

  speak(text: string, lang: string) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = 1.05
    window.speechSynthesis.speak(utter)
  }

  stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }
}
