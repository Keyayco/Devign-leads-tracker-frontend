import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: Get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Helper: Get current user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper: Sign out
export async function signOut() {
  return await supabase.auth.signOut()
}

// Helper: Sign in with email/password
export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password })
}

// Helper: Listen to auth changes
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
