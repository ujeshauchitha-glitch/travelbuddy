import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import ModeIcon from './ModeIcon'
import { audienceBadge, modeInfo } from '../lib/modes'
import type { Trip } from '../lib/types'

export const fmtWhen = (t: Trip) =>
  t.departAt.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function TripCard({ trip }: { trip: Trip }) {
  const m = modeInfo(trip.mode)
  const label = trip.mode === 'other' && trip.modeLabel ? trip.modeLabel : m.label
  const left = Math.max(0, trip.spotsOpen - (trip.memberIds.length - 1))
  return (
    <Link to={`/app/trip/${trip.id}`} className="card trip">
      <div className="row between">
        <span className="chip"><ModeIcon id={m.id} /> {label}{trip.number ? ` · ${trip.number}` : ''}</span>
        {audienceBadge(trip.audience) && <span className="chip safe"><ShieldCheck size={14} aria-hidden="true" /> {audienceBadge(trip.audience)}</span>}
        <span className={left ? 'chip ok' : 'chip'}>{left ? `${left} spot${left > 1 ? 's' : ''} open` : 'Full'}</span>
      </div>
      <div className="route">
        <strong>{trip.origin.name}</strong>
        <span aria-hidden>→</span>
        <strong>{trip.destination.name}</strong>
      </div>
      <div className="row between muted small">
        <span>{fmtWhen(trip)}</span>
        <span>by {trip.hostName}</span>
      </div>
    </Link>
  )
}
