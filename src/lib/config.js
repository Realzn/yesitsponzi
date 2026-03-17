// ── Dates du round ─────────────────────────────────────────
export const ROUND_LAUNCH = new Date(import.meta.env.VITE_ROUND_LAUNCH || '2026-03-21T20:00:00+01:00')
export const ROUND_END    = new Date(import.meta.env.VITE_ROUND_END    || '2026-03-24T20:00:00+01:00')

// ── URL de base ─────────────────────────────────────────────
export const BASE_URL = window.location.origin + window.location.pathname.replace(/\/$/, '')

// ── LocalStorage keys ───────────────────────────────────────
export const LS_PID = 'yip_pid'

// ── Emojis ──────────────────────────────────────────────────
export const EMOJIS = ['🔺','👑','🦁','🐍','🔥','💀','⚡','🎯','🧠','🌑','🎪','🏆','⚔️','🦅']
