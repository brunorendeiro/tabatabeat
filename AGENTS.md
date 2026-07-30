# AGENTS.md

## Objetivo

Este projeto contém exclusivamente a app TabataBeat, um temporizador Tabata
simples e offline, pensado primeiro para telemóvel.

## Regras

- Manter a app 100% client-side: sem backend, sem login.
- `public/tabata-sound.m4a` é uma gravação do próprio Bruno (direitos dele,
  confirmado explicitamente) — os 240s (0:15–4:15) do ficheiro original que
  correspondem exatamente às 8 rondas de 20s/10s, cortados com ffmpeg. Nunca
  substituir por, nem adicionar, áudio de terceiros sem confirmação explícita
  da origem/direitos — ver conversa que originou este ficheiro.
- O offset de corte (0:15) é o momento exato em que a "Ronda 1" trabalho
  começa no áudio original, depois da contagem decrescente do próprio
  ficheiro (5s a contar a partir de 0:12) — por isso o playback começa a
  tocar exatamente na entrada da fase `work` da ronda 1 de cada tabata
  (ver `handlePhaseEnter` em `App.tsx`), sem introdução, para ficar em
  sincronia com o timer do início ao fim.
- Qualquer novo texto de interface tem de ser traduzido nas três línguas
  suportadas (`src/i18n.ts`) — nunca deixar uma língua incompleta.
- O protocolo Tabata (20s trabalho / 10s descanso / 8 rondas) é fixo por
  omissão — só o número de tabatas e o descanso entre eles são configuráveis.
- Não colocar aqui código do portfólio ou de outras aplicações.

## Validação

```bash
npm run check
npm run build
```
