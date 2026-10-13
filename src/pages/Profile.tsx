import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import { AUDIENCES, DEFAULT_VISIBILITY, GENDERS, VISIBILITY_OPTIONS } from '../lib/modes'
import type { Audience, ContactField, Gender, Visibility } from '../lib/types'
import Select from '../components/Select'
import StatusButton from '../components/StatusButton'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { deleteAccount } from '../lib/deleteAccount'
import { prettyName } from '../lib/names'

const PHONE_RE = /^[+]?[0-9 ()-]{7,20}$/
const IG_RE = /^[A-Za-z0-9._]{1,30}$/

export default function Profile() {
  const { user, profile, gender: savedGender, refreshProfile, logOut } = useAuth()
  const nav = useNavigate()
  const firstTime = !profile
  const [name, setName] = useState(prettyName(profile?.displayName ?? user?.displayName ?? ''))
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
  const toast = useToast()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteStep, setDeleteStep] = useState('')
  const [deleteError, setDeleteError] = useState('')

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
    setError('')
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
      toast('Profile saved')
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
      if (firstTime) nav('/app')
    } catch {
      setError('Could not save your profile. Try again.')
    }
    setBusy(false)
  }

  const doDeleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount(user, setDeleteStep)
      nav('/', { replace: true })
    } catch (e) {
      console.error(e)
      const code = (e as { code?: string }).code ?? ''
      setDeleteError(
        code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
          ? 'You closed the Google window, so nothing was deleted.'
          : code === 'auth/popup-blocked'
            ? 'Your browser blocked the Google window. Allow pop-ups for this site and try again.'
            : code === 'auth/user-mismatch'
              ? 'Please confirm with the same Google account you are signed in with.'
              : `Something went wrong${code ? ` (${code})` : ''}. Some data may already be removed. Please try again.`,
      )
    } finally {
      setDeleting(false)
    }
  }

  const visSelect = (f: ContactField, what: string) => (
    <Select<Visibility>
      value={vis[f]}
      onChange={(v) => setVis({ ...vis, [f]: v })}
      ariaLabel={`Who can see your ${what}`}
      options={VISIBILITY_OPTIONS.map((o) => ({ value: o.id, label: o.label, hint: o.hint }))}
    />
  )

  return (
    <>
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
        <div className="field"><span id="gender-label">Gender *</span>
          <Select<Gender>
            value={gender}
            onChange={setGender}
            labelledBy="gender-label"
            placeholder="Select…"
            options={GENDERS.map((g) => ({ value: g.id, label: g.label }))}
          /></div>
        {visSelect('gender', 'gender')}
      </div>
      <div className="field"><span id="pref-label">I prefer to travel with</span>
        <Select<Audience>
          value={pref}
          onChange={setPref}
          labelledBy="pref-label"
          options={AUDIENCES.map((a) => ({
            value: a.id,
            label: a.label,
            disabled: (a.id === 'women_only' && gender !== 'woman') || (a.id === 'men_only' && gender !== 'man'),
          }))}
        />
        <small className="muted">This is the default when you post a trip. You can change it for each trip.</small>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      <StatusButton busy={busy} done={saved} busyLabel="Saving…" doneLabel="Saved">Save</StatusButton>
      <button type="button" className="btn" onClick={logOut}>Log out</button>
    </form>

    {!firstTime && (
      <section className="danger-zone" aria-labelledby="danger-title">
        <h3 id="danger-title">Delete account</h3>
        <p className="muted">
          Permanently erase your profile, trips and chats, and close your sign-in. This cannot be undone.
        </p>
        <button type="button" className="btn danger" onClick={() => { setDeleteError(''); setConfirmDelete(true) }}>Delete my account</button>
      </section>
    )}

    <ConfirmDialog
      open={confirmDelete}
      danger
      busy={deleting}
      busyText={deleteStep}
      error={deleteError}
      requireText="DELETE"
      title="Delete your account?"
      message="This is permanent. You will be asked to confirm with Google first."
      confirmLabel="Delete everything"
      onConfirm={doDeleteAccount}
      onCancel={() => setConfirmDelete(false)}
    >
      <ul className="modal-list">
        <li>Your profile, phone, email, Instagram and gender are erased.</li>
        <li>Trips you posted are deleted, with their join requests.</li>
        <li>Your requests to other people's trips are withdrawn.</li>
        <li>Your chats are deleted for you <strong>and the other person</strong>.</li>
        <li>Reports you sent through Help are kept, so safety reports are not lost.</li>
      </ul>
    </ConfirmDialog>
    </>
  )
}
