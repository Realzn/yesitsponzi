import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const sb = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 10 } }
})

// ── Pyramids ─────────────────────────────────────────────────
export const Pyramids = {
  // Simple select — no FK join to profiles (creator_id may not exist yet)
  getAll: () => sb.from('pyramids').select('*').order('created_at', { ascending: true }),
  create: (d)  => sb.from('pyramids').insert(d).select().single(),
  getById:(id) => sb.from('pyramids').select('*').eq('id', id).single(),
}

// ── Members ──────────────────────────────────────────────────
export const Members = {
  getAll:       ()    => sb.from('members').select('*').eq('status', 'active').order('joined_at', { ascending: true }),
  getByPyramid: (pid) => sb.from('members').select('*').eq('pyramid_id', pid).eq('status', 'active').order('joined_at', { ascending: true }),
  create:       (d)   => sb.from('members').insert(d).select().single(),
  getTree:      (pid) => sb.rpc('get_pyramid_tree', { p_pyramid_id: pid }),
  joinRpc:      (d)   => sb.rpc('join_pyramid', d),
  leaveRpc: (userId, pyramidId) => sb.rpc('leave_pyramid', { p_user_id: userId, p_pyramid_id: pyramidId }),
  getUserMembership: (uid) => sb.from('members').select('*, pyramids(id,name,emoji)').eq('user_id', uid).eq('status', 'active').maybeSingle(),
}

// ── Messages ─────────────────────────────────────────────────
// No join to profiles — messages table only has pyramid_id, pseudo, body
export const Messages = {
  getByPyramid: (pid) => sb.from('messages').select('*').eq('pyramid_id', pid).order('created_at', { ascending: true }),
  create: (d) => sb.from('messages').insert(d).select().single(),
}

// ── Applications ─────────────────────────────────────────────
// No FK joins — fetch applicant info separately if needed
export const Applications = {
  create: (d) => sb.from('applications').insert(d).select().single(),
  getForPyramid:  (pid) => sb.from('applications').select('*').eq('target_pyramid', pid).eq('status', 'pending').order('created_at', { ascending: false }),
  getByApplicant: (uid) => sb.from('applications').select('*, pyramids!target_pyramid(id,name,emoji)').eq('applicant_id', uid).order('created_at', { ascending: false }),
  accept: async (appId, app) => {
    await sb.from('applications').update({ status: 'accepted' }).eq('id', appId)
    if (app.from_pyramid) {
      await sb.rpc('leave_pyramid', { p_user_id: app.applicant_id, p_pyramid_id: app.from_pyramid })
    }
    return sb.rpc('join_pyramid', {
      p_user_id:    app.applicant_id,
      p_pyramid_id: app.target_pyramid,
      p_pseudo:     app.pseudo || 'Initié',
      p_emoji:      '👤',
    })
  },
  refuse: (appId) => sb.from('applications').update({ status: 'refused' }).eq('id', appId),
}

// ── Profiles ─────────────────────────────────────────────────
export const Profiles = {
  get:    (uid) => sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
  upsert: (d)   => sb.from('profiles').upsert(d),
}

// ── Waitlist ──────────────────────────────────────────────────
export const Waitlist = {
  add:   (email) => sb.from('waitlist').insert({ email }),
  count: ()      => sb.from('waitlist').select('*', { count: 'exact', head: true }),
}

// ── Realtime ──────────────────────────────────────────────────
export function subscribeAll({ onPyramid, onMember, onMessage, onApplication }) {
  return sb.channel('yip-global')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pyramids' },     ({ new: n }) => onPyramid?.(n))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'members' },      ({ new: n }) => onMember?.(n))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'members' },      ({ new: n }) => onMember?.(n, 'update'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },     ({ new: n }) => onMessage?.(n))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, ({ new: n }) => onApplication?.(n))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, ({ new: n }) => onApplication?.(n, 'update'))
    .subscribe()
}
