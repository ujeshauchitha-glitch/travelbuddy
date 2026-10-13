import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, limit, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { Compass, Plus, Search } from 'lucide-react'
import { db } from '../lib/firebase'
import { MODES, canJoinAudience } from '../lib/modes'
import { prettyName } from '../lib/names'
import { useAuth } from '../auth/AuthContext'
import type { Trip, TravelMode } from '../lib/types'
import TripCard from '../components/TripCard'
import ModeIcon from '../components/ModeIcon'

export default function Trips() {
  const { gender, profile } = useAuth()
  const [eligibleOnly, setEligibleOnly] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<TravelMode | ''>('')
  const [params] = useSearchParams()
  const [text, setText] = useState(params.get('q') ?? '')
  const first = prettyName(profile?.displayName).split(' ')[0]
  const searchRef = useRef<HTMLInputElement>(null)

  // Press "/" anywhere on the page to jump to the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); searchRef.current?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setLoading(true)
    // Upcoming only: past plans never show, so there is no stale clutter.
    const base = [where('departAt', '>=', Timestamp.now()), orderBy('departAt'), limit(100)]
    const q = mode
      ? query(collection(db, 'trips'), where('mode', '==', mode), ...base)
      : query(collection(db, 'trips'), ...base)
    return onSnapshot(
      q,
      (snap) => {
        setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Trip))
        setLoading(false)
      },
      () => { setError('Could not load trips.'); setLoading(false) },
    )
  }, [mode])

  const shown = useMemo(() => {
    const t = text.trim().toLowerCase()
    return trips.filter((x) =>
      (!eligibleOnly || canJoinAudience(x.audience, gender)) &&
      (!t || [x.origin.name, x.destination.name, x.number, x.carrier, x.hostName]
        .some((s) => s?.toLowerCase().includes(t))))
  }, [trips, text, eligibleOnly, gender])

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{first ? `Hi ${first}` : 'Welcome'}</p>
          <h2>Where are you headed?</h2>
          <p className="muted">Join a trip that is already planned, or post your own.</p>
        </div>
        <Link to="/app/post" className="btn primary"><Plus size={18} aria-hidden="true" /> Post a trip</Link>
      </header>

      <div className="search-wrap">
        <Search size={18} aria-hidden="true" />
        <input ref={searchRef} className="search" aria-label="Search trips" placeholder="Search a place, flight or train number, or a name"
          value={text} onChange={(e) => setText(e.target.value)} />
        <kbd className="kbd" aria-hidden="true">/</kbd>
      </div>

      <div className="chips">
        <button className={!mode ? 'chip active' : 'chip'} onClick={() => setMode('')}><Compass size={16} aria-hidden="true" /> All</button>
        {MODES.map((m) => (
          <button key={m.id} className={mode === m.id ? 'chip active' : 'chip'} onClick={() => setMode(m.id)}>
            <ModeIcon id={m.id} /> {m.label}
          </button>
        ))}
      </div>

      <label className="switch">
        <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} />
        <span className="track" aria-hidden="true" />
        <span>Only show trips I can join</span>
      </label>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <div className="trip-grid" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="card skeleton" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><Compass size={26} aria-hidden="true" /></span>
          <h3>No trips here yet</h3>
          <p className="muted">{text || mode ? 'Nothing matches that search.' : 'Be the first to post one, and others heading your way can join.'}</p>
          <Link to="/app/post" className="btn primary">Post a trip</Link>
        </div>
      ) : (
        <div className="trip-grid">{shown.map((t) => <TripCard key={t.id} trip={t} />)}</div>
      )}
    </>
  )
}
