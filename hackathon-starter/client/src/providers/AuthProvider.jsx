import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { friendlyError, supabase } from '@/lib/supabase'
import { STAFF_ROLES } from '@/lib/constants'
import { setAuthToken } from '@/services/apiClient'
import { profilesService } from '@/services/profilesService'

const AuthCtx = createContext(null)

/**
 * Supabase Auth session + the user's `profiles` row (name and role).
 *
 *   const { user, profile, isStaff, isAdmin, signIn, signUp, signOut } = useAuth()
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileError, setProfileError] = useState(null)

  const loadProfile = useCallback(async (userId) => {
    try {
      setProfileError(null)
      setProfile(await profilesService.get(userId))
    } catch (err) {
      setProfileError(err.message)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return
        setSession(data.session)
        setAuthToken(data.session?.access_token ?? null)
        if (data.session) await loadProfile(data.session.user.id)
      })
      .catch((err) => setProfileError(friendlyError(err)))
      .finally(() => active && setIsLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setAuthToken(next?.access_token ?? null)
      if (!next) setProfile(null)
      // Defer DB calls out of the auth callback (supabase-js recommendation).
      else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') setTimeout(() => loadProfile(next.user.id), 0)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(friendlyError(error))
    await loadProfile(data.user.id)
    return data
  }, [loadProfile])

  /** role: 'student' | 'teacher' (staff roles are granted by an admin) */
  const signUp = useCallback(async ({ email, password, fullName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), role } },
    })
    if (error) throw new Error(friendlyError(error))
    if (data.session) await loadProfile(data.user.id)
    return { needsConfirmation: !data.session }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(friendlyError(error))
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      isLoading,
      isStaff: STAFF_ROLES.includes(profile?.role),
      isAdmin: profile?.role === 'admin',
      signIn,
      signUp,
      signOut,
      refreshProfile: () => session && loadProfile(session.user.id),
      setProfile,
    }),
    [session, profile, profileError, isLoading, signIn, signUp, signOut, loadProfile],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
