import { sb } from './supabase.js'

// ── Auth helpers ───────────────────────────────────────────
export const Auth = {
  signUp:  (email, password) => sb.auth.signUp({ email, password }),
  signIn:  (email, password) => sb.auth.signInWithPassword({ email, password }),
  signOut: ()                => sb.auth.signOut(),
  getUser: ()                => sb.auth.getUser(),
  onAuthChange: (cb)         => sb.auth.onAuthStateChange(cb),
}

export async function getCurrentUser() {
  const { data: { user } } = await sb.auth.getUser()
  return user
}

export function isAdmin(user) {
  return user?.email === (import.meta.env.VITE_ADMIN_EMAIL || '')
}
