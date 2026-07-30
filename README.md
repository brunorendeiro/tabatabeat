# TabataBeat

Um temporizador Tabata simples e 100% offline, pensado para treinar com o
telemóvel sem gastar dados móveis.

## Ideia

- Define quantos tabatas queres (cada tabata = 8 rondas de 20s trabalho / 10s
  descanso, 4 min) e o descanso entre eles. Só isso — sem contas, sem planos
  de treino, sem anúncios.
- Beeps sintetizados (Web Audio API) marcam início/fim de cada fase, com
  contagem decrescente nos últimos 3 segundos.
- Falas motivacionais aleatórias (Web Speech API, síntese de voz local — não
  são ficheiros de áudio gravados) em PT/EN/DE, sincronizadas com as
  transições de fase: "última ronda" é sempre anunciado, o resto é
  aleatório para não ficar repetitivo.
- Toca automaticamente um som de treino de fundo (`public/tabata-sound.m4a`,
  gravação própria do Bruno, cortada a 240s para corresponder exatamente às 8
  rondas) sincronizado com o início de cada tabata — não há nada para
  escolher ou configurar, toca sempre.
- Mantém o ecrã ligado durante o treino (Wake Lock API).
- Instalável como app (PWA), funciona offline depois da primeira visita.
- Interface em português (PT-PT), inglês e alemão.
- 100% client-side, sem backend, sem login.

## Executar

```bash
npm install
npm run dev
```

Abrir <http://127.0.0.1:5194>.

## Validar

```bash
npm run check
npm run build
```

## Gerar ícones PWA

```bash
npm run gen-icons
```

## Ideias para evoluir

- Permitir ajustar o tempo de trabalho/descanso dentro de cada tabata (hoje
  fixo em 20s/10s, protocolo clássico).
- Histórico de treinos feitos, guardado localmente.
- Vibração (Vibration API) como reforço tátil nas transições, além do som.

O README deve ser atualizado quando o conceito, as funcionalidades ou as
prioridades mudarem.
