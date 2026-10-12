import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

// When env vars are missing we still export objects so imports don't crash;
// App.tsx shows a setup screen instead of using them.
const app = initializeApp(firebaseConfigured ? config : { apiKey: 'unset', projectId: 'unset', appId: 'unset' })
export const auth = getAuth(app)
export const db = getFirestore(app)

export const CAMPUS_DOMAIN = 'vitstudent.ac.in'
export const isCampusEmail = (email?: string | null) =>
  !!email && email.toLowerCase().endsWith('@' + CAMPUS_DOMAIN)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ hd: CAMPUS_DOMAIN, prompt: 'select_account' })
