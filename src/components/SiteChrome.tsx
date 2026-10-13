import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ThemeToggle from './ThemeToggle'

/** Top navigation shared by the public pages (landing and About). */
export function SiteNav() {
  const { user, signIn } = useAuth()
  return (
    <div className="site-nav-wrap">
      <header className="site-nav">
        <Link to="/" className="brand">TravelBuddy</Link>
        <nav aria-label="Page sections" className="site-links">
          <Link to="/#how">How it works</Link>
          <Link to="/#safety">Safety</Link>
          <Link to="/#faq">FAQ</Link>
          <Link to="/about">About</Link>
        </nav>
        <div className="site-nav-actions auth-cta">
          <ThemeToggle />
          {user
            ? <Link to="/app" className="btn primary sm">Open app</Link>
            : <button className="btn primary sm" onClick={signIn}>Sign in</button>}
        </div>
      </header>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <span>TravelBuddy is a student project. Not affiliated with or endorsed by VIT.</span>
      <span className="foot-links">
        <Link to="/about">About</Link>
        <span>In an emergency in India, call <a href="tel:112">112</a>.</span>
      </span>
    </footer>
  )
}
