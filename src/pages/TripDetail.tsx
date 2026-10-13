import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import {
  arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import { audienceBadge, canJoinAudience, convId, modeInfo } from '../lib/modes'
import type { ContactField, JoinRequest, Trip } from '../lib/types'
import { fmtWhen } from '../components/TripCard'
import ModeIcon from '../components/ModeIcon'
import RouteVisual from '../components/RouteVisual'
import ConfirmDialog from '../components/ConfirmDialog'
import { initials, prettyName } from '../lib/names'

// Reads one field. The server decides whether we are allowed.
function ContactRow({ uid, field, label }: { uid: string; field: ContactField; label: string }) {
  const [value, setValue] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    getDoc(doc(db, 'profiles', uid, 'private', field))
      .then((s) => setValue(s.exists() ? s.data().value : null))
      .catch(() => setValue(null)) // permission denied = hidden by owner
  }, [uid, field])
  if (value === undefined) return <li>{label}: …</li>
  if (value === null) return <li className="muted">{label}: hidden or not shared</li>
  const href = field === 'instagram' ? `https://instagram.com/${value}`
    : field === 'email' ? `mailto:${value}` : field === 'phone' ? `tel:${value.replace(/\s/g, '')}` : undefined
  const text = field === 'instagram' ? '@' + value : value
  return <li>{label}: {href ? <a href={href} target="_blank" rel="noreferrer">{text}</a> : text}</li>
}

function Contacts({ uid, name }: { uid: string; name: string }) {
  return (
    <div className="card">
      <strong>{name}'s details</strong>
      <ul className="plain">
        <ContactRow uid={uid} field="phone" label="Phone" />
        <ContactRow uid={uid} field="email" label="Email" />
        <ContactRow uid={uid} field="instagram" label="Instagram" />
      </ul>
    </div>
  )
}

export default function TripDetail() {
  const { id } = useParams()
  const { user, profile, gender } = useAuth()
  const nav = useNavigate()
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined)
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [mine, setMine] = useState<JoinRequest | null>(null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const hostId = trip?.hostId
  const isHost = !!hostId && hostId === user?.uid

  useEffect(() => {
    if (!id) return
    return onSnapshot(doc(db, 'trips', id), (s) => setTrip(s.exists() ? ({ id: s.id, ...s.data() } as Trip) : null), () => setTrip(null))
  }, [id])

  useEffect(() => {
    if (!id || !user || !hostId) return
    if (isHost) {
      return onSnapshot(collection(db, 'trips', id, 'requests'),
        (s) => setRequests(s.docs.map((d) => ({ uid: d.id, ...d.data() }) as JoinRequest)), () => {})
    }
    return onSnapshot(doc(db, 'trips', id, 'requests', user.uid),
      (s) => setMine(s.exists() ? ({ uid: s.id, ...s.data() } as JoinRequest) : null), () => {})
  }, [id, user, hostId, isHost])

  if (trip === undefined) return <p className="muted">Loading…</p>
  if (trip === null) return <p>This trip no longer exists.</p>

  const m = modeInfo(trip.mode)
  const label = trip.mode === 'other' && trip.modeLabel ? trip.modeLabel : m.label
  const spotsLeft = Math.max(0, trip.spotsOpen - (trip.memberIds.length - 1))
  const isMember = trip.memberIds.includes(user!.uid)
  const eligible = canJoinAudience(trip.audience, gender)
  const badge = audienceBadge(trip.audience)

  const run = async (fn: () => Promise<void>) => {
    setError('')
    try { await fn() } catch (e) {
      console.error(e)
      const code = (e as { code?: string }).code
      setError(`That did not work${code ? ` (${code.replace('permission-denied', 'not allowed')})` : ''}. Please try again.`)
    }
  }

  const requestJoin = () => run(() =>
    setDoc(doc(db, 'trips', trip.id, 'requests', user!.uid), {
      status: 'pending', displayName: profile?.displayName ?? 'Student', createdAt: serverTimestamp(),
    }))

  const cancelRequest = () => run(() => deleteDoc(doc(db, 'trips', trip.id, 'requests', user!.uid)))

  const decide = (r: JoinRequest, status: 'accepted' | 'declined') => run(async () => {
    const reqRef = doc(db, 'trips', trip.id, 'requests', r.uid)
    // Two steps: the connection rule checks the already-stored 'accepted' status.
    await updateDoc(reqRef, { status })
    if (status === 'accepted') {
      const b = writeBatch(db)
      b.set(doc(db, 'connections', `${user!.uid}_${r.uid}`), {
        uids: [user!.uid, r.uid], memberUid: r.uid, tripId: trip.id, createdAt: serverTimestamp(),
      })
      b.update(doc(db, 'trips', trip.id), { memberIds: arrayUnion(r.uid) })
      await b.commit()
    }
  })

  const doDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteDoc(doc(db, 'trips', trip.id))
      nav('/app')
    } catch (e) {
      console.error(e)
      const code = (e as { code?: string }).code
      setConfirmDelete(false)
      setError(`Could not delete this trip${code ? ` (${code})` : ''}. Please try again.`)
    } finally {
      setDeleting(false)
    }
  }

  const chatLink = (otherUid: string) => `/app/chat/${convId(user!.uid, otherUid)}?trip=${trip.id}`

  return (
    <>
      <div className="card">
        <div className="row">
          <span className="chip"><ModeIcon id={m.id} /> {label}{trip.number ? ` · ${trip.number}` : ''}</span>
          {badge && <span className="chip safe"><ShieldCheck size={14} aria-hidden="true" /> {badge}</span>}
        </div>
        <RouteVisual origin={trip.origin} destination={trip.destination} mode={trip.mode} />
        <p className="when-line">{fmtWhen(trip)}</p>
        <ul className="plain">
          {trip.pickupNote && <li>Meet at: {trip.pickupNote}</li>}
          {trip.carrier && <li>{trip.carrier}</li>}
          {trip.costNote && <li>Cost: {trip.costNote}</li>}
          <li>{trip.luggageFriendly ? 'Space for luggage' : 'Light bags only'}</li>
          <li>{spotsLeft} of {trip.spotsOpen} spots open</li>
        </ul>
        {trip.notes && <p className="muted">{trip.notes}</p>}
        <p className="host small"><span className="avatar" aria-hidden="true">{initials(trip.hostName)}</span> Hosted by {prettyName(trip.hostName)}</p>
        {!isHost && <Link className="small" to={`/app/help?category=safety&trip=${trip.id}`}>Report this trip</Link>}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {isHost ? (
        <>
          <h3>Join requests</h3>
          {requests.length === 0 && <p className="muted">No requests yet.</p>}
          {requests.map((r) => (
            <div key={r.uid} className="card">
              <div className="row between">
                <strong>{prettyName(r.displayName)}</strong>
                <span className="chip">{r.status}</span>
              </div>
              <div className="row">
                {r.status === 'pending' && (
                  <>
                    <button className="btn primary" disabled={spotsLeft === 0} onClick={() => decide(r, 'accepted')}>Accept</button>
                    <button className="btn" onClick={() => decide(r, 'declined')}>Decline</button>
                  </>
                )}
                <Link className="btn" to={chatLink(r.uid)}>Message</Link>
              </div>
              {r.status === 'accepted' && <Contacts uid={r.uid} name={prettyName(r.displayName)} />}
            </div>
          ))}
          <button className="btn danger" onClick={() => setConfirmDelete(true)}>Delete trip</button>
          <ConfirmDialog
            open={confirmDelete}
            danger
            busy={deleting}
            title="Delete this trip?"
            message="It will be removed for everyone, including anyone who asked to join. This cannot be undone."
            confirmLabel="Delete trip"
            onConfirm={doDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      ) : isMember ? (
        <>
          <p className="ok">You are in this trip.</p>
          <Link className="btn primary" to={chatLink(trip.hostId)}>Message {prettyName(trip.hostName)}</Link>
          <Contacts uid={trip.hostId} name={prettyName(trip.hostName)} />
        </>
      ) : (
        <>
          {!eligible ? (
            <p className="notice">
              This trip is {trip.audience === 'women_only' ? 'for women only' : 'for men only'}, based on the gender
              in your profile. {gender ? '' : 'Add your gender in your profile to see which trips you can join.'}
            </p>
          ) : mine?.status === 'pending' ? (
            <div className="row"><span className="chip">Request sent</span><button className="btn" onClick={cancelRequest}>Cancel</button></div>
          ) : mine?.status === 'declined' ? (
            <p className="muted">The host could not fit you in this time.</p>
          ) : (
            <button className="btn primary" disabled={spotsLeft === 0} onClick={requestJoin}>
              {spotsLeft === 0 ? 'Trip is full' : 'Request to join'}
            </button>
          )}
          {eligible && <Link className="btn" to={chatLink(trip.hostId)}>Ask {prettyName(trip.hostName)} a question</Link>}
        </>
      )}
    </>
  )
}
