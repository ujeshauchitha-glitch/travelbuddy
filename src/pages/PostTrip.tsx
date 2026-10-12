import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import { MODES, modeInfo } from '../lib/modes'
import { samePlace } from '../lib/places'
import type { Place, TravelMode } from '../lib/types'
import PlaceInput from '../components/PlaceInput'

const localNow = () => {
  const d = new Date(Date.now() + 3600_000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function PostTrip() {
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<TravelMode>('cab')
  const [modeLabel, setModeLabel] = useState('')
  const [origin, setOrigin] = useState<Place>({ name: '' })
  const [destination, setDestination] = useState<Place>({ name: '' })
  const [pickupNote, setPickupNote] = useState('')
  const [when, setWhen] = useState(localNow())
  const [spots, setSpots] = useState(2)
  const [carrier, setCarrier] = useState('')
  const [number, setNumber] = useState('')
  const [costNote, setCostNote] = useState('')
  const [notes, setNotes] = useState('')
  const [luggage, setLuggage] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const info = modeInfo(mode)

  if (!profile) return <p>Please complete your profile first.</p>

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const departAt = new Date(when)
    if (isNaN(+departAt) || departAt.getTime() <= Date.now()) return setError('Pick a departure time in the future.')
    if (samePlace(origin, destination)) return setError('Origin and destination are the same.')
    if (mode === 'other' && !modeLabel.trim()) return setError('Say how you are travelling.')
    setBusy(true)
    try {
      const clean = (s: string) => s.trim() || undefined
      const data = Object.fromEntries(Object.entries({
        hostId: user!.uid,
        hostName: profile.displayName,
        mode,
        modeLabel: mode === 'other' ? modeLabel.trim() : undefined,
        origin: { ...origin, name: origin.name.trim() },
        destination: { ...destination, name: destination.name.trim() },
        pickupNote: clean(pickupNote),
        departAt: Timestamp.fromDate(departAt),
        spotsOpen: spots,
        carrier: clean(carrier),
        number: clean(number)?.toUpperCase(),
        costNote: clean(costNote),
        notes: clean(notes),
        luggageFriendly: luggage,
        memberIds: [user!.uid],
        createdAt: serverTimestamp(),
      }).filter(([, v]) => v !== undefined))
      const ref = await addDoc(collection(db, 'trips'), data)
      nav(`/trip/${ref.id}`)
    } catch {
      setError('Could not post the trip. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="form">
      <h2>Post a trip</h2>
      <div className="chips">
        {MODES.map((m) => (
          <button type="button" key={m.id} className={mode === m.id ? 'chip active' : 'chip'} onClick={() => setMode(m.id)}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      {mode === 'other' && (
        <label className="field"><span>How are you travelling? *</span>
          <input value={modeLabel} onChange={(e) => setModeLabel(e.target.value)} maxLength={40} placeholder="e.g. Tempo traveller, rental car" />
        </label>
      )}
      <PlaceInput label="From" value={origin} onChange={setOrigin} required />
      <PlaceInput label="To" value={destination} onChange={setDestination} required />
      <label className="field"><span>Meeting / pick-up spot</span>
        <input value={pickupNote} onChange={(e) => setPickupNote(e.target.value)} maxLength={120} placeholder="e.g. Main gate, Katpadi station exit" />
      </label>
      <label className="field"><span>Departure *</span>
        <input type="datetime-local" required value={when} min={localNow()} onChange={(e) => setWhen(e.target.value)} />
      </label>
      {(info.carrierLabel || info.numberLabel) && (
        <div className="grid2">
          {info.carrierLabel && <label className="field"><span>{info.carrierLabel}</span>
            <input value={carrier} onChange={(e) => setCarrier(e.target.value)} maxLength={60} /></label>}
          {info.numberLabel && <label className="field"><span>{info.numberLabel}</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} maxLength={30} /></label>}
        </div>
      )}
      <div className="grid2">
        <label className="field"><span>People you are looking for *</span>
          <input type="number" min={1} max={20} required value={spots} onChange={(e) => setSpots(Number(e.target.value))} /></label>
        <label className="field"><span>Cost split</span>
          <input value={costNote} onChange={(e) => setCostNote(e.target.value)} maxLength={80} placeholder="e.g. Split equally, ~₹400 each" /></label>
      </div>
      <label className="field"><span>Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={400} rows={3} /></label>
      <label className="check"><input type="checkbox" checked={luggage} onChange={(e) => setLuggage(e.target.checked)} /> Space for luggage</label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Posting…' : 'Post trip'}</button>
    </form>
  )
}
