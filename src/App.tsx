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

function Gate() {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="center"><p className="muted">Loading…</p></div>
  if (!user) return <Login />
  // New users must finish their profile (phone is required) before anything else.
  if (!profile) {
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
