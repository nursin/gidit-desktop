# Gidit — Desktop Blueprint

This document captures the product and implementation blueprint for Gidit as a desktop-only Electron application (Vite + React + TypeScript). It replaces any cloud-first or Next.js-specific design with an offline-first, local-first architecture.

## High-level stack (desktop-focused)
- Electron (app shell)
- Vite (bundles renderer)
- React + TypeScript (UI)
- Tailwind CSS (styling)
- Zustand (app state)
- SQLite / SQLCipher (local storage / encrypted DB)
- Drizzle ORM (typed DB layer)
- Ollama CLI / local model runtime (AI) invoked from Electron main via child_process
- Python scripts for heavy data-science/ML spawned from Electron main
- electron-builder (packaging)
- electron-updater (auto-updates)

Important constraints:
- No cloud services or Firebase. All data and auth live locally.
- Authentication is local username/password only (see Auth section).
- Server-like logic runs in Electron main (via IPC) — renderer calls main for DB, AI, and filesystem operations.

## Core Features
- Design Your Own Workspace
  - Modular workspace with drag-and-drop cards (quadrants, calendar, notes, timeboxing, etc.).
  - Components are card-first for easy repositioning and stacking.
  - Persist layout and user profiles locally in the encrypted DB.

- AI-Powered Note Assistance
  - Local AI assistants (Ollama or other local model) for brain-dump triage, summarization, extraction, and structure suggestion.
  - Renderer calls an Authenticated AIService that proxies requests via IPC to Electron main, which invokes Ollama CLI or Python pipelines.

- Gamified Progress Tracking
  - Local streaks, rewards, variable reinforcement implemented client-side.
  - All game state persisted locally (no analytics/telemetry unless explicitly opt-in and locally stored).

- App Personalization
  - Themes, fonts, soundscapes, and context profiles stored per-user.
  - Allow quick switching of context profiles that change UI theme, fonts, and noise/sound settings.

- Tasks and Prioritization
  - Task quadrant view, prioritization, and nested/accordion views.
  - Support for multi-granular views (compact vs expanded per component).

## Security & Auth (MANDATORY)
- Single sign-on model is NOT allowed. ONLY local username/password.
- Credentials stored in the encrypted SQLite/SQLCipher database.
- Use a strong password hashing algorithm (bcrypt or Argon2) for credential hashes.
- Auth responsibilities:
  - Electron main: manage users, register, login, logout, session token, and DB access.
  - Renderer: call AuthService via IPC methods: register, login, logout, getSession.
  - Auth state in renderer provided via React Context (context/AuthContext.tsx) and consumed by protected routes (react-router-dom).
- DB encryption:
  - Use SQLCipher with a key derived from user's password or an app-specific securely stored key.
  - Consider deriving the DB key from the user's password (argon2id) or store an app-secret in OS-protected keystore where available.

## Local AI & Python integration
- All AI and Python processes must be launched from Electron main (child_process.spawn or exec).
- Main exposes a minimal IPC surface to renderer:
  - ai.runPrompt(prompt, options)
  - ai.streamResponse(prompt, onChunk)
  - py.runScript(scriptPath, args)
- Avoid calling external network AI services by default — use local models via Ollama. If a network fallback is required, make it opt-in and clearly surfaced in UI.

## DB & ORM
- Use Drizzle ORM for typed schema + migrations in /app/electron/db/.
- Store all app data (users, sessions, notes, workspaces, personalization, gamification state) locally.
- Migrations and schema management live in the electron process sources.

## UI / Routing
- Replace Next.js routing with react-router-dom.
- Replace next/link → <Link> and next/image → <img> components.
- Renderer entry: Vite + React. Use the suggested file structure to organize components, services, routes, and contexts.

## Styling & Design Tokens
Primary palette (Tailwind-ready):
- primary: #3391F3 (HSL(210,75%,50%))
- background: #F0F5FA (HSL(210,20%,95%))
- accent: #33F3CD (HSL(180,75%,50%))
- text: #0F172A (dark slate)
- surface: #FFFFFF
Tailwind theme example (to include in tailwind.config.ts):
- colors:
  - gidit-primary: '#3391F3'
  - gidit-bg: '#F0F5FA'
  - gidit-accent: '#33F3CD'
  - gidit-text: '#0F172A'

Typography:
- Primary font: Inter (preferred). In Electron you can bundle Inter as local assets or load via Google Fonts if acceptable; prefer bundling to reduce network reliance.
- Provide accessible font-size scale and heading hierarchy.

Motion & Interactions:
- Subtle transitions for state changes (task completion, card add/remove).
- Use transform + opacity combos for card drag-drop enter/exit.
- Consider reduced-motion preference support.

Layout & Components
- Card-first components: each module (note, calendar, quadrant) is a draggable card with header, content, and handle for drag.
- Workspace grid that allows free placement and snap grid; support column/row stacking for narrow windows.
- Provide compact/expanded states for each card and persist them per-user.

Persistence & Settings
- Persist all workspace layouts, personalization, and gamification state in local DB.
- Export/import workspace JSON for backup.
- Optional encrypted backups, requiring password to decrypt.

Telemetry & Privacy
- No remote telemetry by default. If analytics are added, they must be opt-in, local-first, and respect privacy.

Developer Notes / File Mapping
- Suggested file structure (root of repo):
  /app
    /electron
      main.ts                (Electron main process; IPC handlers + child_process)
      preload.ts             (expose safe IPC surface)
      authStore.ts           (DB access + auth helpers)
      /db
        schema.ts
        migrations/
    /renderer
      index.html
      src/
        main.tsx
        App.tsx
        routes/
        components/
        context/AuthContext.tsx
        services/
          auth.ts            (calls IPC auth methods)
          ai.ts              (calls IPC ai methods)
      vite.config.ts
  /styles/tailwind.css
  postcss.config.js
  tailwind.config.ts

Migration notes from Next.js:
- DELETE next-env.d.ts and any Next.js-specific configs.
- Replace next/image/next/link usage.
- Move any server-side (API routes, server actions) logic into /app/electron (main) or into shared services called via IPC.

Accessibility
- Keyboard-first drag/drop (operate cards without mouse).
- Proper ARIA roles for dialogs, draggable cards, and lists.
- Color contrast checks for primary palettes; provide high-contrast theme.

Product priorities (MVP)
1. Local auth + encrypted DB + simple note-taking cards
2. Drag-drop workspace + persist layout
3. Local AI assistant integration (Ollama) for summaries
4. Task quadrant view + basic gamification (streaks)
5. Personalization (themes, font choices)
6. Packaging + auto-update via electron-updater

This blueprint is designed to ensure Gidit remains offline-first, secure, and tailored for a desktop Electron environment. Keep logic that requires system-level operations (DB, spawning models, filesystem) inside the Electron main process and expose minimal, well-documented IPC endpoints to the renderer.
