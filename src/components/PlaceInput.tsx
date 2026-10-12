import { useEffect, useRef, useState } from 'react'
import { searchPlaces } from '../lib/places'
import type { Place } from '../lib/types'

interface Props {
  label: string
  value: Place
  onChange: (p: Place) => void
  placeholder?: string
  required?: boolean
}

// Free-text place field with worldwide suggestions. Typing alone is enough.
export default function PlaceInput({ label, value, onChange, placeholder, required }: Props) {
  const [options, setOptions] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const ctl = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      ctl.current?.abort()
      ctl.current = new AbortController()
      searchPlaces(value.name, ctl.current.signal)
        .then(setOptions)
        .catch(() => setOptions([]))
    }, 400)
    return () => clearTimeout(t)
  }, [value.name, open])

  return (
    <label className="field place">
      <span>{label}{required && ' *'}</span>
      <input
        value={value.name}
        required={required}
        placeholder={placeholder ?? 'Any city, station, airport, campus…'}
        onChange={(e) => { onChange({ name: e.target.value }); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        maxLength={120}
      />
      {open && options.length > 0 && (
        <ul className="suggest">
          {options.map((o) => (
            <li key={o.name}>
              <button type="button" onMouseDown={() => { onChange(o); setOpen(false) }}>{o.name}</button>
            </li>
          ))}
        </ul>
      )}
    </label>
  )
}
