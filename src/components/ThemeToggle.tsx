import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { usePrefs } from '../lib/PrefsContext'

// What the page is showing right now: an explicit choice wins, otherwise the system setting.
const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export default function ThemeToggle() {
  const { prefs, set } = usePrefs()
  const [sysDark, setSysDark] = useState(systemDark)

  // Follow the system if the person has not made an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSysDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && sysDark)
  const toggle = () => set({ theme: dark ? 'light' : 'dark' })

  return (
    <button type="button" className="theme-btn" onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}>
      <span key={String(dark)} className="spin-in">
        {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </span>
    </button>
  )
}
