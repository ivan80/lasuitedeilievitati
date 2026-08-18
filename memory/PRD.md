# PRD — Impasto (App gestione ricette panificati)

## Problem statement (originale)
"crea una app per gestire ricette per panificati: pizza tonda, pizza in teglia, focaccia, pane, grandi lievitati"
Richieste utente: calcolo automatico dosi per pezzi/peso, timer/pianificazione lievitazione, gestione TA/frigo, preimpasti (biga/poolish/water roux), calcolo forza mix farine (W), suggerimenti AI, stampa ricette, multi-utente, upload foto. Login: Google. AI: GPT 5.4 Mini. Design: a scelta dell'agente.

## Architettura
- Frontend: React 19 + Tailwind + Framer Motion + shadcn/ui + @phosphor-icons/react. Font: Cormorant Garamond (headings) + Manrope (body). Palette "Organic & Earthy".
- Backend: FastAPI + MongoDB (motor). Tutte le route con prefisso /api.
- Auth: Emergent-managed Google OAuth (cookie httpOnly `session_token`, 7 giorni).
- AI: emergentintegrations LlmChat, modello openai `gpt-5.4-mini`, chiave EMERGENT_LLM_KEY.
- Storage: Emergent Object Storage per le foto ricetta.

## Personas
- Pizzaiolo/panificatore (hobbista o pro) che gestisce ricette e calcola dosi in % del panificatore.

## Core requirements (statici)
- Multi-utente con login Google, dati isolati per utente.
- Calcolatore impasto in baker's %, scaling per pezzi/peso.
- Preimpasti: diretto, biga, poolish, water roux.
- Calcolo W medio del mix di farine + suggerimento tempi.
- Pianificazione lievitazione TA/Frigo con timeline oraria.
- Consulente AI in italiano.
- CRUD ricette + upload foto + stampa.

## Implementato (2026-06)
- Auth Google completa (session/me/logout) + rotte protette.
- CRUD ricette con filtro categoria; upload/download foto.
- Calcolatore impasto (idratazione/sale/lievito/olio/zucchero/malto) + breakdown live.
- Preimpasti con breakdown preimpasto/impasto finale.
- FlourBlend (W medio) + suggerimento fermentazione.
- LeaveningPlanner (timeline TA/Frigo con orari calcolati).
- AISuggest (GPT 5.4 Mini) su parametri correnti.
- Pagine: Login, Dashboard, Ricettario, Dettaglio (con stampa), Form nuova/modifica, Calcolatore.
- Testing: backend 6/6 pytest, flussi frontend critici validati.

## Backlog / prossimi passi
- P1: Timer live con notifiche per ogni fase di lievitazione.
- P1: data-testid tab su pagina Calcolatore (allineamento spec, non bloccante).
- P2: Duplicazione ricetta / versioni.
- P2: Export PDF stampa dedicato.
- P2: Ricerca testuale nel ricettario.
