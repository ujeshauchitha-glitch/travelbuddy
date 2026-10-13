import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import { AUDIENCES, MODES, modeInfo } from '../lib/modes'
import { samePlace } from '../lib/places'
import type { Audience, Place, TravelMode } from '../lib/types'
import PlaceInput from '../components/PlaceInput'
import ModeIcon from '../components/ModeIcon'
import Select from '../components/Select'
import Stepper from '../components/Stepper'
import StatusButton from '../components/StatusButton'
import { useToast } from '../components/Toast'

const localNow = () => {
  const d = new Date(Date.now() + 3600_000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function PostTrip() {
  const { user, profile, gender } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
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
  const allowed = (a: Audience) => a === 'anyone' || (a === 'women_only' && gender === 'woman') || (a === 'men_only' && gender === 'man')
  const [audience, setAudience] = useState<Audience>(profile?.travelPref && allowed(profile.travelPref) ? profile.travelPref : 'anyone')
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
        audience,
        memberIds: [user!.uid],
        createdAt: serverTimestamp(),
      }).filter(([, v]) => v !== undefined))
      const ref = await addDoc(collection(db, 'trips'), data)
      toast('Trip posted')
      nav(`/app/trip/${ref.id}`)
    } catch {
      setError('Could not post the trip. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="form post-form">
      <header className="page-head">
        <div>
          <p className="eyebrow">New trip</p>
          <h2>Post a trip</h2>
          <p className="muted">Tell people where you are going and when. You choose who comes along.</p>
        </div>
      </header>

      <section className="panel">
        <h3>How are you travelling?</h3>
        <div className="chips wrap">
          {MODES.map((m) => (
            <button type="button" key={m.id} className={mode === m.id ? 'chip active' : 'chip'} onClick={() => setMode(m.id)}>
              <ModeIcon id={m.id} /> {m.label}
            </button>
          ))}
        </div>
        {mode === 'other' && (
          <label className="field"><span>How are you travelling? *</span>
            <input value={modeLabel} onChange={(e) => setModeLabel(e.target.value)} maxLength={40} placeholder="e.g. Tempo traveller, rental car" />
          </label>
        )}
        {(info.carrierLabel || info.numberLabel) && (
          <div className="grid2">
            {info.carrierLabel && <label className="field"><span>{info.carrierLabel}</span>
              <input value={carrier} onChange={(e) => setCarrier(e.target.value)} maxLength={60} /></label>}
            {info.numberLabel && <label className="field"><span>{info.numberLabel}</span>
              <input value={number} onChange={(e) => setNumber(e.target.value)} maxLength={30} /></label>}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Where and when</h3>
        <PlaceInput label="From" value={origin} onChange={setOrigin} required />
        <PlaceInput label="To" value={destination} onChange={setDestination} required />
        <label className="field"><span>Meeting / pick-up spot</span>
          <input value={pickupNote} onChange={(e) => setPickupNote(e.target.value)} maxLength={120} placeholder="e.g. Main gate, Katpadi station exit" />
        </label>
        <label className="field"><span>Departure *</span>
          <input type="datetime-local" required value={when} min={localNow()} onChange={(e) => setWhen(e.target.value)} />
        </label>
      </section>

      <section className="panel">
        <h3>Who and how much</h3>
        <div className="grid2">
          <div className="field"><span id="spots-label">People you are looking for *</span>
            <Stepper value={spots} min={1} max={20} onChange={setSpots} label="people" /></div>
          <label className="field"><span>Cost split</span>
            <input value={costNote} onChange={(e) => setCostNote(e.target.value)} maxLength={80} placeholder="e.g. Split equally, ~₹400 each" /></label>
        </div>
        <div className="field"><span id="audience-label">Who can join *</span>
          <Select<Audience>
            value={audience}
            onChange={setAudience}
            labelledBy="audience-label"
            options={AUDIENCES.map((a) => ({ value: a.id, label: a.label, disabled: !allowed(a.id) }))}
          />
          <small className="muted">Women-only and men-only trips are enforced by the server: nobody else can send a join request.</small>
        </div>
        <label className="field"><span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={400} rows={3} /></label>
        <label className="switch">
          <input type="checkbox" checked={luggage} onChange={(e) => setLuggage(e.target.checked)} />
          <span className="track" aria-hidden="true" />
          <span>Space for luggage</span>
        </label>
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      <StatusButton className="btn primary lg" busy={busy} busyLabel="Posting…">Post trip</StatusButton>
    </form>
  )
}
