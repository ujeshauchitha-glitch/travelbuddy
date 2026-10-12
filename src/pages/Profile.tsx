import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import { AUDIENCES, DEFAULT_VISIBILITY, GENDERS, VISIBILITY_OPTIONS } from '../lib/modes'
import type { Audience, ContactField, Gender, Visibility } from '../lib/types'

const PHONE_RE = /^[+]?[0-9 ()-]{7,20}$/
const IG_RE = /^[A-Za-z0-9._]{1,30}$/

export default function Profile() {
  const { user, profile, gender: savedGender, refreshProfile, logOut } = useAuth()
  const nav = useNavigate()
  const firstTime = !profile
  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? '')
  const [hometown, setHometown] = useState(profile?.hometown ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [gender, setGender] = useState<Gender | ''>(savedGender ?? '')
  const [pref, setPref] = useState<Audience>(profile?.travelPref ?? 'anyone')
  const [vis, setVis] = useState<Record<ContactField, Visibility>>({
    ...DEFAULT_VISIBILITY,
    ...(profile?.contactVisibility ?? {}),
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { setGender(savedGender ?? '') }, [savedGender])

  // Load my own saved contact values (rules always allow the owner).
  useEffect(() => {
    if (!user || firstTime) return
    const read = async (f: 'phone' | 'instagram', set: (v: string) => void) => {
      const s = await getDoc(doc(db, 'profiles', user.uid, 'private', f))
      if (s.exists()) set(s.data().value)
    }
    read('phone', setPhone).catch(() => {})
    read('instagram', setInstagram).catch(() => {})
  }, [user, firstTime])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setMsg('')
    const ig = instagram.trim().replace(/^@/, '')
    const ph = phone.trim()
    if (!name.trim()) return setError('Name is required.')
    if (!PHONE_RE.test(ph)) return setError('Enter a valid phone number (7–20 digits, + ( ) - allowed).')
    if (ig && !IG_RE.test(ig)) return setError('Instagram ID can only use letters, numbers, . and _ (max 30).')
    if (!gender) return setError('Please choose a gender option (you can pick "Prefer not to say").')
    // A saved preference the person cannot actually use would block their own trips.
    const safePref: Audience =
      (pref === 'women_only' && gender !== 'woman') || (pref === 'men_only' && gender !== 'man') ? 'anyone' : pref
    setBusy(true)
    try {
      const b = writeBatch(db)
      const uid = user!.uid
      b.set(doc(db, 'profiles', uid), {
        displayName: name.trim(),
        photoURL: user!.photoURL ?? null,
        hometown: hometown.trim(),
        bio: bio.trim(),
        contactVisibility: vis,
        travelPref: safePref,
        createdAt: profile?.createdAt ?? serverTimestamp(),
      })
      b.set(doc(db, 'profiles', uid, 'private', 'phone'), { value: ph })
      b.set(doc(db, 'profiles', uid, 'private', 'email'), { value: user!.email })
      b.set(doc(db, 'profiles', uid, 'private', 'gender'), { value: gender })
      if (ig) b.set(doc(db, 'profiles', uid, 'private', 'instagram'), { value: ig })
      await b.commit()
      if (!ig) await deleteDoc(doc(db, 'profiles', uid, 'private', 'instagram'))
      await refreshProfile()
      setMsg('Saved.')
      if (firstTime) nav('/')
    } catch {
      setError('Could not save your profile. Try again.')
    }
    setBusy(false)
  }

  const visSelect = (f: ContactField, what: string) => (
    <select value={vis[f]} onChange={(e) => setVis({ ...vis, [f]: e.target.value as Visibility })} aria-label={`Who can see your ${what}`}>
      {VISIBILITY_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  )

  return (
    <form onSubmit={save} className="form">
      <h2>{firstTime ? 'Set up your profile' : 'Your profile'}</h2>
      <label className="field"><span>Name *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></label>
      <label className="field"><span>Hometown</span>
        <input value={hometown} onChange={(e) => setHometown(e.target.value)} maxLength={80} /></label>
      <label className="field"><span>About you</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={2} /></label>

      <h3>Contact details</h3>
      <p className="muted small">
        Each one has its own privacy setting. “Travel mates” means people whose trip you
        hosted or joined. This is enforced on the server, not just hidden in the app.
      </p>
      <div className="contact">
        <label className="field"><span>Phone / WhatsApp *</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98765 43210" /></label>
        {visSelect('phone', 'phone number')}
      </div>
      <div className="contact">
        <label className="field"><span>Email</span>
          <input value={user?.email ?? ''} readOnly /></label>
        {visSelect('email', 'email')}
      </div>
      <div className="contact">
        <label className="field"><span>Instagram (optional)</span>
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username, without @" /></label>
        {visSelect('instagram', 'Instagram')}
      </div>

      <h3>Safety &amp; travel preferences</h3>
      <p className="muted small">
        Gender is used for women-only and men-only trips. It is self-declared and is never shown
        to anyone unless you allow it below. Trips with a restriction are enforced by the server.
      </p>
      <div className="contact">
        <label className="field"><span>Gender *</span>
          <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} required>
            <option value="" disabled>Select…</option>
            {GENDERS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select></label>
        {visSelect('gender', 'gender')}
      </div>
      <label className="field"><span>I prefer to travel with</span>
        <select value={pref} onChange={(e) => setPref(e.target.value as Audience)}>
          {AUDIENCES.map((a) => (
            <option key={a.id} value={a.id}
              disabled={(a.id === 'women_only' && gender !== 'woman') || (a.id === 'men_only' && gender !== 'man')}>
              {a.label}
            </option>
          ))}
        </select>
        <small className="muted">This is the default when you post a trip. You can change it for each trip.</small>
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {msg && <p className="ok" role="status">{msg}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      <button type="button" className="btn" onClick={logOut}>Log out</button>
    </form>
  )
}
