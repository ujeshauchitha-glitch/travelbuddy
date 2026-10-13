import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import ThemeToggle from './ThemeToggle'
import CustomizeButton from './CustomizeButton'

const LINKS = [
  { to: '/#how', label: 'How it works' },
  { to: '/#safety', label: 'Safety' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
]

/** Top navigation shared by the public pages (landing and About). */
export function SiteNav() {
  const { user, signIn } = useAuth()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const { pathname, hash } = useLocation()

  // Any navigation closes the menu.
  useEffect(() => { setOpen(false) }, [pathname, hash])

  // Escape, or a tap outside the menu, closes it.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); button.current?.focus() }
    }
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div className="site-nav-wrap">
      <header className="site-nav" ref={root}>
        <Link to="/" className="brand">Travel Tinder</Link>
        <nav aria-label="Page sections" className="site-links">
          {LINKS.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
        </nav>
        <div className="site-nav-actions auth-cta">
          <CustomizeButton />
          <ThemeToggle />
          {user
            ? <Link to="/app" className="btn primary sm">Open app</Link>
            : <button className="btn primary sm" onClick={signIn}>Sign in</button>}
          <button
            type="button"
            ref={button}
            className="theme-btn menu-btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <nav id="site-menu" className="site-menu" aria-label="Menu">
            {LINKS.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
          </nav>
        )}
      </header>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <span>Travel Tinder is a student project. Not affiliated with or endorsed by VIT.</span>
      <span className="foot-links">
        <Link to="/about">About</Link>
        <span>In an emergency in India, call <a href="tel:112">112</a>.</span>
      </span>
    </footer>
  )
}
