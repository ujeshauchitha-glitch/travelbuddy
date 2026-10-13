import { SlidersHorizontal } from 'lucide-react'
import { usePrefs } from '../lib/PrefsContext'

/** Opens the Customise panel. */
export default function CustomizeButton() {
  const { setPanelOpen } = usePrefs()
  return (
    <button type="button" className="theme-btn" onClick={() => setPanelOpen(true)}
      aria-label="Customise the look" title="Customise">
      <SlidersHorizontal size={18} aria-hidden="true" />
    </button>
  )
}
