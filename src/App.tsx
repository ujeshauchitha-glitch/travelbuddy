import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { firebaseConfigured } from './lib/firebase'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import About from './pages/About'
import SetupNeeded from './pages/SetupNeeded'
import Trips from './pages/Trips'
import PostTrip from './pages/PostTrip'
import MyTrips from './pages/MyTrips'
import TripDetail from './pages/TripDetail'
import Profile from './pages/Profile'
import Chats from './pages/Chats'
import Chat from './pages/Chat'
import Help from './pages/Help'

/** Scrolls to the top on page changes, or to the #section when the link has one. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // Wait a frame so the target section has rendered after navigation.
      const id = decodeURIComponent(hash.slice(1))
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView(), 30)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

/** Everything under /app: needs a signed-in student with a finished profile. */
function AppArea() {
  const { user, profile, gender, loading } = useAuth()
  if (loading) return <div className="center"><p className="muted">Loading…</p></div>
  if (!user) return <Navigate to="/" replace />
  // Phone and gender are required before anything else, so safety filters work.
  if (!profile || !gender) {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="*" element={<Profile />} />
        </Route>
      </Routes>
    )
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Trips />} />
        <Route path="post" element={<PostTrip />} />
        <Route path="mine" element={<MyTrips />} />
        <Route path="trip/:id" element={<TripDetail />} />
        <Route path="chats" element={<Chats />} />
        <Route path="chat/:cid" element={<Chat />} />
        <Route path="help" element={<Help />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  if (!firebaseConfigured) return <SetupNeeded />
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollManager />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/app/*" element={<AppArea />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
