// ── Dates du round ──────────────────────────────────────────
export const ROUND_LAUNCH = new Date(import.meta.env.VITE_ROUND_LAUNCH || '2026-03-14T20:00:00+01:00')
export const ROUND_END    = new Date(import.meta.env.VITE_ROUND_END    || '2026-03-17T20:00:00+01:00')

// ── URL de base pour les liens de parrainage ────────────────
export const BASE_URL = window.location.origin + window.location.pathname.replace(/\/$/, '')

// ── Clés localStorage ───────────────────────────────────────
export const LS_PID = 'yip_pid'   // ID de la pyramide créée par l'user

// ── Emojis disponibles pour les profils ─────────────────────
export const EMOJIS = ['🔺','👑','🦁','🐍','🔥','💀','⚡','🎯','🧠','🌑','🎪','🏆','⚔️','🦅']
