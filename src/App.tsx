import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { firebaseConfigured } from './lib/firebase'
import Layout from './components/Layout'
import Login from './pages/Login'
import SetupNeeded from './pages/SetupNeeded'
import Trips from './pages/Trips'
import PostTrip from './pages/PostTrip'
import MyTrips from './pages/MyTrips'
import TripDetail from './pages/TripDetail'
import Profile from './pages/Profile'
import Chats from './pages/Chats'
import Chat from './pages/Chat'
import Help from './pages/Help'

function Gate() {
  const { user, profile, gender, loading } = useAuth()
  if (loading) return <div className="center"><p className="muted">Loading…</p></div>
  if (!user) return <Login />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  if (!firebaseConfigured) return <SetupNeeded />
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}
