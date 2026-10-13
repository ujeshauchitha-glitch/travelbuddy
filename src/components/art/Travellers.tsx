import { useMemo } from 'react'
import { blob, box, poly, sample, smooth, wobble, type P } from '../../lib/sketch'

/** Two students with backpacks walking toward a lake, drawn from behind. */
export default function Travellers() {
  const A = useMemo(() => {
    const far = poly(wobble([[0, 120], [60, 84], [110, 112], [170, 70], [240, 108], [300, 86], [360, 118], [400, 100], [400, 200], [0, 200]], 3, 4), true)
    const hill = smooth(wobble(sample((x) => 150 + 10 * Math.sin(x / 40), 0, 400, 20), 2, 6))
    return { far, hill }
  }, [])
  return (
    <svg className="travellers-art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="200" className="tr-sky" />
      <circle cx="320" cy="42" r="16" className="tr-sun ink-s" />
      <path d={A.far} className="tr-far ink-s" />
      <path d="M0 140 L400 140 L400 200 L0 200 Z" className="tr-water" />
      <path d="M40 152 L100 152 M180 160 L260 160 M300 150 L360 150" className="ink-s thin" />
      <path d={`${A.hill} L400 200 L0 200 Z`} className="tr-hill" />
      <path d={A.hill} className="ink-s" />

      {/* friend one */}
      <g>
        <path d={box(112, 100, 30, 56, 21, 1.4)} className="tr-coral ink-s" />
        <path d={box(104, 106, 14, 34, 22, 1)} className="tr-butter ink-s" />
        <path d={blob(127, 88, 11, 23)} className="tr-skin ink-s" />
        <path d={box(112, 154, 10, 28, 24, 1)} className="tr-denim ink-s" /><path d={box(128, 154, 10, 28, 25, 1)} className="tr-denim ink-s" />
      </g>
      {/* friend two */}
      <g>
        <path d={box(168, 104, 28, 52, 31, 1.4)} className="tr-plum ink-s" />
        <path d={box(190, 108, 14, 32, 32, 1)} className="tr-coral ink-s" />
        <path d={blob(182, 92, 10.5, 33)} className="tr-skin ink-s" />
        <path d={box(168, 154, 9, 28, 34, 1)} className="tr-denim ink-s" /><path d={box(183, 154, 9, 28, 35, 1)} className="tr-denim ink-s" />
      </g>
    </svg>
  )
}

export type { P }
