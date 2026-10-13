import { splitPlace } from '../lib/names'
import type { Place, TravelMode } from '../lib/types'
import ModeIcon from './ModeIcon'

/** From → To drawn as two ends joined by a line with the travel mode in the middle. */
export default function RouteVisual({ origin, destination, mode }: { origin: Place; destination: Place; mode: TravelMode }) {
  const o = splitPlace(origin.name)
  const d = splitPlace(destination.name)
  return (
    <div className="route-v">
      <div className="rv-end">
        <span className="rv-label">From</span>
        <strong>{o.main}</strong>
        {o.rest && <span className="rv-sub">{o.rest}</span>}
      </div>
      <div className="rv-line" aria-hidden="true">
        <span className="rv-dot" />
        <span className="rv-track" />
        <span className="rv-icon"><ModeIcon id={mode} size={16} /></span>
        <span className="rv-track" />
        <span className="rv-dot" />
      </div>
      <div className="rv-end right">
        <span className="rv-label">To</span>
        <strong>{d.main}</strong>
        {d.rest && <span className="rv-sub">{d.rest}</span>}
      </div>
    </div>
  )
}
