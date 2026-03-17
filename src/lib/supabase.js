import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('[YESITSPONZI] Missing Supabase env vars. Check .env')
}

export const sb = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 10 } }
})

// ── Pyramides ───────────────────────────────────────────────
export const Pyramids = {
  getAll: () => sb.from('pyramids').select('*').order('created_at', { ascending: true }),
  create: (data) => sb.from('pyramids').insert(data).select().single(),
  getById: (id) => sb.from('pyramids').select('*').eq('id', id).single(),
}

// ── Members ─────────────────────────────────────────────────
export const Members = {
  getAll: () => sb.from('members').select('*').order('joined_at', { ascending: true }),
  getByPyramid: (pid) => sb.from('members').select('*').eq('pyramid_id', pid).order('joined_at', { ascending: true }),
  create: (data) => sb.from('members').insert(data).select().single(),
}

// ── Messages ─────────────────────────────────────────────────
export const Messages = {
  getByPyramid: (pid) => sb.from('messages').select('*').eq('pyramid_id', pid).order('created_at', { ascending: true }),
  create: (data) => sb.from('messages').insert(data).select().single(),
}

// ── Waitlist ─────────────────────────────────────────────────
export const Waitlist = {
  add: (email) => sb.from('waitlist').insert({ email }),
  count: () => sb.from('waitlist').select('*', { count: 'exact', head: true }),
}

// ── Realtime subscriptions ───────────────────────────────────
export function subscribeAll({ onPyramid, onMember, onMessage }) {
  return sb.channel('yip-global')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pyramids' }, ({ new: n }) => onPyramid?.(n))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'members' },  ({ new: n }) => onMember?.(n))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: n }) => onMessage?.(n))
    .subscribe()
}
