import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { MODES, canJoinAudience } from '../lib/modes'
import { useAuth } from '../auth/AuthContext'
import type { Trip, TravelMode } from '../lib/types'
import TripCard from '../components/TripCard'
import ModeIcon from '../components/ModeIcon'

export default function Trips() {
  const { gender } = useAuth()
  const [eligibleOnly, setEligibleOnly] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<TravelMode | ''>('')
  const [text, setText] = useState('')

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
      <h2>Upcoming trips</h2>
      <input className="search" placeholder="Search place, flight/train no., name…" value={text}
        onChange={(e) => setText(e.target.value)} />
      <div className="chips">
        <button className={!mode ? 'chip active' : 'chip'} onClick={() => setMode('')}>All</button>
        {MODES.map((m) => (
          <button key={m.id} className={mode === m.id ? 'chip active' : 'chip'} onClick={() => setMode(m.id)}>
            <ModeIcon id={m.id} /> {m.label}
          </button>
        ))}
      </div>
      <label className="check small"><input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} /> Only show trips I can join</label>
      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : shown.length === 0 ? (
        <div className="empty card">
          <p>No trips here yet. Be the first to post one.</p>
        </div>
      ) : <div className="trip-grid">{shown.map((t) => <TripCard key={t.id} trip={t} />)}</div>}
    </>
  )
}
