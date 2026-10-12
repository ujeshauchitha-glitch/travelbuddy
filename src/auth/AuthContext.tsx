import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isCampusEmail } from '../lib/firebase'
import type { Gender, Profile } from '../lib/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  gender: Gender | null // own gender; null until set
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  logOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null)
      setGender(null)
      return
    }
    const [p, g] = await Promise.all([
      getDoc(doc(db, 'profiles', u.uid)),
      getDoc(doc(db, 'profiles', u.uid, 'private', 'gender')).catch(() => null),
    ])
    setProfile(p.exists() ? (p.data() as Profile) : null)
    setGender(g && g.exists() ? (g.data().value as Gender) : null)
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u && !isCampusEmail(u.email)) {
        // UI guard only; Firestore rules enforce the same thing server side.
        await signOut(auth)
        setError('Please sign in with your @vitstudent.ac.in Google account.')
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setUser(u)
      try {
        await loadProfile(u)
      } catch {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [loadProfile])

  const signIn = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Sign-in failed. Please try again.')
      }
    }
  }

  const value: AuthState = {
    user,
    profile,
    gender,
    loading,
    error,
    signIn,
    logOut: () => signOut(auth),
    refreshProfile: () => loadProfile(auth.currentUser),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
