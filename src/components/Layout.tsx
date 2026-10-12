import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { profile, user } = useAuth()
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">🧭 TravelBuddy</span>
        <span className="muted">{profile?.displayName ?? user?.displayName}</span>
      </header>
      <main className="content"><Outlet /></main>
      <nav className="tabbar" aria-label="Main">
        <NavLink to="/" end>Trips</NavLink>
        <NavLink to="/post">Post</NavLink>
        <NavLink to="/mine">My trips</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>
    </div>
  )
}
