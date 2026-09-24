export type Locale = 'pt' | 'en' | 'de'

export const locales: { id: Locale; label: string }[] = [
  { id: 'pt', label: 'PT' },
  { id: 'en', label: 'EN' },
  { id: 'de', label: 'DE' },
]

export function detectLocale(): Locale {
  const stored = window.localStorage.getItem('tabatabeat-locale')
  if (stored === 'pt' || stored === 'en' || stored === 'de') return stored
  const browser = navigator.language.slice(0, 2).toLowerCase()
  if (browser === 'de') return 'de'
  if (browser === 'pt') return 'pt'
  return 'en'
}

export const speechLang: Record<Locale, string> = {
  pt: 'pt-PT',
  en: 'en-US',
  de: 'de-DE',
}

export type MotivationCategory = 'work' | 'workLastRound' | 'rest' | 'restBetween' | 'done'

export const motivationalPhrases: Record<Locale, Record<MotivationCategory, string[]>> = {
  pt: {
    work: ['Vamos!', 'Força, força!', 'Consegues!', 'Continua assim!', 'Aguenta firme!'],
    workLastRound: ['Última ronda — vamos, força!', 'É a última, dá tudo!', 'Mais uma — faz valer!'],
    rest: ['Hora de descansar.', 'Respira fundo.', 'Bom trabalho, respira.', 'Descansa, mereceste.'],
    restBetween: ['Descanso maior — recupera bem.', 'Calma um pouco agora.', 'Respira fundo, estás a ir bem.'],
    done: ['Treino concluído, bom trabalho!', 'Terminaste — parabéns!', 'Tudo feito — ótimo trabalho hoje!'],
  },
  en: {
    work: ["Let's go!", 'Push, push!', "You've got this!", 'Keep pushing!', 'Stay strong!'],
    workLastRound: ["Last set — let's go, push!", 'Final round, give it everything!', 'One more — make it count!'],
    rest: ['Time to rest.', 'Catch your breath.', 'Nice work, breathe.', "Rest up, you earned it."],
    restBetween: ["Bigger break — recover well.", "Take it easy for a bit.", "Breathe deep, you're doing great."],
    done: ['Workout complete, great job!', "That's a wrap — well done!", 'All done — awesome work today!'],
  },
  de: {
    work: ["Los geht's!", 'Kraft, Kraft!', 'Du schaffst das!', 'Weiter so!', 'Bleib stark!'],
    workLastRound: ['Letzte Runde — los, gib alles!', 'Die letzte — mach sie zählen!', 'Noch eine — vollgas!'],
    rest: ['Zeit für eine Pause.', 'Atme durch.', 'Gut gemacht, atme.', 'Erhol dich, verdient.'],
    restBetween: ['Längere Pause — gut erholen.', 'Jetzt kurz entspannen.', 'Tief durchatmen, du machst das super.'],
    done: ['Training beendet, gut gemacht!', 'Fertig — bravo!', 'Alles geschafft — starke Leistung heute!'],
  },
}

type UiStrings = {
  title: string
  tagline: string
  intro: string
  numTabatasLabel: string
  restBetweenLabel: string
  summary: (tabatas: number, totalClock: string) => string
  startButton: string
  pauseButton: string
  resumeButton: string
  resetButton: string
  phasePrepare: string
  phaseWork: string
  phaseRest: string
  phaseRestBetween: string
  phaseDone: string
  tabataProgress: (current: number, total: number) => string
  roundProgress: (current: number, total: number) => string
  doneTitle: string
  doneBody: string
  wakeLockNote: string
  installTitle: string
  installBody: string
  installButton: string
  installDismiss: string
  installIosHint: string
  footerTagline: string
  cookieBody: string
  cookieAccept: string
  cookieReject: string
  adLabel: string
}

export const ui: Record<Locale, UiStrings> = {
  pt: {
    title: 'TabataBeat',
    tagline: 'O teu temporizador Tabata, offline.',
    intro: 'Define quantos tabatas queres e o descanso entre eles. Cada tabata são 8 rondas de 20s trabalho / 10s descanso (4 min). Carrega em play e treina — sem gastar dados.',
    numTabatasLabel: 'Número de tabatas',
    restBetweenLabel: 'Descanso entre tabatas',
    summary: (tabatas, totalClock) => `${tabatas} ${tabatas === 1 ? 'tabata' : 'tabatas'} · duração total ${totalClock}`,
    startButton: 'Play',
    pauseButton: 'Pausa',
    resumeButton: 'Continuar',
    resetButton: 'Reiniciar',
    phasePrepare: 'Preparar',
    phaseWork: 'Trabalho',
    phaseRest: 'Descanso',
    phaseRestBetween: 'Descanso entre tabatas',
    phaseDone: 'Concluído!',
    tabataProgress: (current, total) => `Tabata ${current} de ${total}`,
    roundProgress: (current, total) => `Ronda ${current} de ${total}`,
    doneTitle: 'Treino concluído!',
    doneBody: 'Bom trabalho. Já podes descansar de verdade.',
    wakeLockNote: 'O ecrã mantém-se ligado enquanto o treino corre.',
    installTitle: 'Adicionar ao ecrã principal',
    installBody: 'Instala o TabataBeat como app para abrir em 1 toque, mesmo sem internet.',
    installButton: 'Instalar',
    installDismiss: 'Agora não',
    installIosHint: 'Toca em Partilhar e depois em "Adicionar ao Ecrã Principal".',
    footerTagline: 'Imaginado por um humano. Construído com IA.',
    cookieBody: 'Uso o Google Analytics e o Google AdSense para perceber quantas pessoas usam o TabataBeat. Aceitas cookies de análise e publicidade?',
    cookieAccept: 'Aceitar',
    cookieReject: 'Recusar',
    adLabel: 'Publicidade',
  },
  en: {
    title: 'TabataBeat',
    tagline: 'Your Tabata timer, offline.',
    intro: 'Set how many tabatas you want and the rest between them. Each tabata is 8 rounds of 20s work / 10s rest (4 min). Hit play and train — no data used.',
    numTabatasLabel: 'Number of tabatas',
    restBetweenLabel: 'Rest between tabatas',
    summary: (tabatas, totalClock) => `${tabatas} ${tabatas === 1 ? 'tabata' : 'tabatas'} · total duration ${totalClock}`,
    startButton: 'Play',
    pauseButton: 'Pause',
    resumeButton: 'Resume',
    resetButton: 'Reset',
    phasePrepare: 'Get ready',
    phaseWork: 'Work',
    phaseRest: 'Rest',
    phaseRestBetween: 'Rest between tabatas',
    phaseDone: 'Done!',
    tabataProgress: (current, total) => `Tabata ${current} of ${total}`,
    roundProgress: (current, total) => `Round ${current} of ${total}`,
    doneTitle: 'Workout complete!',
    doneBody: 'Great work. Now you can really rest.',
    wakeLockNote: 'The screen stays on while the workout runs.',
    installTitle: 'Add to home screen',
    installBody: 'Install TabataBeat as an app to open it in one tap, even without internet.',
    installButton: 'Install',
    installDismiss: 'Not now',
    installIosHint: 'Tap Share, then "Add to Home Screen".',
    footerTagline: 'Imagined by a human. Built with AI.',
    cookieBody: 'I use Google Analytics and Google AdSense to understand how many people use TabataBeat. Do you accept analytics and advertising cookies?',
    cookieAccept: 'Accept',
    cookieReject: 'Reject',
    adLabel: 'Advertisement',
  },
  de: {
    title: 'TabataBeat',
    tagline: 'Dein Tabata-Timer, offline.',
    intro: 'Lege fest, wie viele Tabatas du willst und wie lange die Pause dazwischen ist. Ein Tabata sind 8 Runden à 20s Arbeit / 10s Pause (4 Min). Play drücken und trainieren — ganz ohne Datenverbrauch.',
    numTabatasLabel: 'Anzahl Tabatas',
    restBetweenLabel: 'Pause zwischen Tabatas',
    summary: (tabatas, totalClock) => `${tabatas} ${tabatas === 1 ? 'Tabata' : 'Tabatas'} · Gesamtdauer ${totalClock}`,
    startButton: 'Play',
    pauseButton: 'Pause',
    resumeButton: 'Weiter',
    resetButton: 'Zurücksetzen',
    phasePrepare: 'Bereit machen',
    phaseWork: 'Arbeit',
    phaseRest: 'Pause',
    phaseRestBetween: 'Pause zwischen Tabatas',
    phaseDone: 'Fertig!',
    tabataProgress: (current, total) => `Tabata ${current} von ${total}`,
    roundProgress: (current, total) => `Runde ${current} von ${total}`,
    doneTitle: 'Training abgeschlossen!',
    doneBody: 'Gut gemacht. Jetzt darfst du dich wirklich ausruhen.',
    wakeLockNote: 'Der Bildschirm bleibt an, solange das Training läuft.',
    installTitle: 'Zum Startbildschirm hinzufügen',
    installBody: 'Installiere TabataBeat als App, um sie mit einem Tipp zu öffnen — auch ohne Internet.',
    installButton: 'Installieren',
    installDismiss: 'Nicht jetzt',
    installIosHint: 'Tippe auf "Teilen" und dann auf "Zum Home-Bildschirm".',
    footerTagline: 'Von einem Menschen erdacht. Mit KI gebaut.',
    cookieBody: 'Ich verwende Google Analytics und Google AdSense, um zu verstehen, wie viele Menschen TabataBeat nutzen. Akzeptierst du Analyse- und Werbe-Cookies?',
    cookieAccept: 'Akzeptieren',
    cookieReject: 'Ablehnen',
    adLabel: 'Werbung',
  },
}
