import { Minus, Plus } from 'lucide-react'

interface Props { value: number; min?: number; max?: number; onChange: (n: number) => void; label: string; unit?: string }

/** − 2 + : a friendlier way to pick a small number than a typed box. */
export default function Stepper({ value, min = 1, max = 20, onChange, label, unit = '' }: Props) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="step-btn" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label={`Fewer ${label}`}>
        <Minus size={18} aria-hidden="true" />
      </button>
      <output key={value} className="step-val mono" aria-live="polite">{value}{unit && <small>{unit}</small>}</output>
      <button type="button" className="step-btn" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label={`More ${label}`}>
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
