import { Link } from 'react-router-dom'
import { BadgeCheck, ShieldCheck } from 'lucide-react'
import ModeStamp from './art/ModeStamp'
import { audienceBadge, modeInfo } from '../lib/modes'
import { initials, prettyName, splitPlace } from '../lib/names'
import type { Trip } from '../lib/types'

export const fmtWhen = (t: Trip) =>
  t.departAt.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const fmtShort = (t: Trip) => {
  const d = t.departAt.toDate()
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day} · ${time}`
}

/** A trip drawn as a paper ticket with a postage stamp for its mode, a perforation, then the host. */
export default function TripCard({ trip }: { trip: Trip }) {
  const m = modeInfo(trip.mode)
  const label = trip.mode === 'other' && trip.modeLabel ? trip.modeLabel : m.label
  const left = Math.max(0, trip.spotsOpen - (trip.memberIds.length - 1))
  const badge = audienceBadge(trip.audience)
  return (
    <Link to={`/app/trip/${trip.id}`} className={`card trip-card mode-${trip.mode}`}>
      <div className="tc-main">
        <ModeStamp mode={trip.mode} className="tc-stamp" />
        <div className="tc-body">
          <div className="tc-tags">
            <span className="tc-tag">{label}{trip.number ? ` · ${trip.number}` : ''}</span>
            {badge && <span className="tc-safe"><ShieldCheck size={13} aria-hidden="true" /> {badge}</span>}
          </div>
          <p className="tc-route">
            <strong>{splitPlace(trip.origin.name).main}</strong>
            <span aria-hidden="true">→</span>
            <strong>{splitPlace(trip.destination.name).main}</strong>
          </p>
          <dl className="tc-meta mono">
            <div><dt>Departs</dt><dd>{fmtShort(trip)}</dd></div>
            <div><dt>Seats</dt><dd>{left || 'Full'}</dd></div>
            <div><dt>Cost</dt><dd>{trip.costNote || '—'}</dd></div>
          </dl>
        </div>
      </div>
      <div className="tc-perf" aria-hidden="true" />
      <div className="tc-foot">
        <span className="host"><span className="avatar" aria-hidden="true">{initials(trip.hostName)}</span>{prettyName(trip.hostName)}</span>
        <span className="verified"><BadgeCheck size={14} aria-hidden="true" /> Verified</span>
      </div>
    </Link>
  )
}
