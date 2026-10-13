import { Link } from 'react-router-dom'
import { CalendarClock, ShieldCheck, Users } from 'lucide-react'
import ModeIcon from './ModeIcon'
import RouteVisual from './RouteVisual'
import { audienceBadge, modeInfo } from '../lib/modes'
import { initials, prettyName } from '../lib/names'
import type { Trip } from '../lib/types'

export const fmtWhen = (t: Trip) =>
  t.departAt.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const fmtShort = (t: Trip) => {
  const d = t.departAt.toDate()
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `${day} · ${time}`
}

export default function TripCard({ trip }: { trip: Trip }) {
  const m = modeInfo(trip.mode)
  const label = trip.mode === 'other' && trip.modeLabel ? trip.modeLabel : m.label
  const left = Math.max(0, trip.spotsOpen - (trip.memberIds.length - 1))
  const badge = audienceBadge(trip.audience)
  return (
    <Link to={`/app/trip/${trip.id}`} className="card trip-card">
      <div className="tc-top">
        <span className="chip"><ModeIcon id={m.id} /> {label}{trip.number ? ` · ${trip.number}` : ''}</span>
        <span className="tc-badges">
          {badge && <span className="chip safe"><ShieldCheck size={14} aria-hidden="true" /> {badge}</span>}
          <span className={left ? 'chip ok' : 'chip'}><Users size={14} aria-hidden="true" /> {left ? `${left} open` : 'Full'}</span>
        </span>
      </div>
      <RouteVisual origin={trip.origin} destination={trip.destination} mode={trip.mode} />
      <div className="tc-foot">
        <span className="when"><CalendarClock size={16} aria-hidden="true" /> {fmtShort(trip)}</span>
        <span className="host"><span className="avatar" aria-hidden="true">{initials(trip.hostName)}</span>{prettyName(trip.hostName)}</span>
      </div>
    </Link>
  )
}
