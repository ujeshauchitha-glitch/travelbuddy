import { useMemo } from 'react'
import { blob, box, poly, rnd, ring, sample, smooth, wobble } from '../../lib/sketch'
import type { TravelMode } from '../../lib/types'

/**
 * Small illustrated vignette for a trip ticket. The sky colour comes from the
 * card (--mode-color), the vehicle and hills are drawn here with an ink outline.
 */
function build(mode: TravelMode) {
  const seed = mode.length * 31 + mode.charCodeAt(0)
  const hillY = (x: number) => 60 + 9 * Math.sin(x / 26 + seed) + 4 * Math.sin(x / 9)
  const hillA = smooth(wobble(sample(hillY, -300, 500, 10), 1.4, seed))
  const farY = (x: number) => 46 + 12 * Math.sin(x / 38 + 1 + seed)
  const far = poly(wobble(sample(farY, -300, 500, 14), 2, seed + 3))
  const r = rnd(seed + 9)
  const trees = Array.from({ length: 4 }, (_, i) => ({ x: 14 + i * 52 + r() * 14, s: 5 + r() * 3 }))
  return { hillA, far, trees, seed }
}

export default function ModeArt({ mode }: { mode: TravelMode }) {
  const A = useMemo(() => build(mode), [mode])
  const s = A.seed
  return (
    <svg className="mode-art" viewBox="0 0 200 100" preserveAspectRatio="xMidYMax meet" overflow="visible" aria-hidden="true">
      <rect x="-300" y="-100" width="800" height="300" className="ma-sky" />
      <circle cx="162" cy="24" r="11" className="ma-sun ink-s" />
      <path d={`${A.far} L500 200 L-300 200 Z`} className="ma-far" />
      <path d={A.far} className="ink-s thin" />
      <path d={`${A.hillA} L500 200 L-300 200 Z`} className="ma-hill" />
      <path d={A.hillA} className="ink-s" />
      {A.trees.map((t, i) => (
        <g key={i}>
          <path d={poly([[t.x, 74], [t.x, 74 - t.s * 1.6]])} className="ink-s" />
          <path d={blob(t.x, 72 - t.s * 1.7, t.s, s + i)} className="ma-tree ink-s" />
        </g>
      ))}

      {mode === 'train' && (
        <g>
          <path d="M0 80 L200 80" className="ink-s thin" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path d={box(18 + i * 56, 60, 52, 18, s + i, 1)} className={i === 0 ? 'ma-coral ink-s' : 'ma-cream ink-s'} />
              {[0, 1, 2].map((w) => <path key={w} d={box(24 + i * 56 + w * 15, 64, 10, 7, s + w, 0.6)} className="ma-glass ink-s thin" />)}
              <circle cx={28 + i * 56} cy="80" r="2.6" className="ink-fill" /><circle cx={58 + i * 56} cy="80" r="2.6" className="ink-fill" />
            </g>
          ))}
          <path d="M4 70 L16 70 M2 64 L14 64 M6 76 L16 76" className="ink-s thin" />
        </g>
      )}

      {mode === 'bus' && (
        <g>
          <path d={box(40, 52, 112, 28, s, 1.4)} className="ma-butter ink-s" />
          {[0, 1, 2, 3, 4].map((w) => <path key={w} d={box(48 + w * 19, 57, 14, 10, s + w, 0.6)} className="ma-glass ink-s thin" />)}
          <path d="M40 70 L152 70" className="ink-s thin" />
          <circle cx="66" cy="82" r="6" className="ink-fill" /><circle cx="126" cy="82" r="6" className="ink-fill" />
          <path d="M30 66 L38 66 M26 72 L36 72" className="ink-s thin" />
        </g>
      )}

      {mode === 'flight' && (
        <g transform="translate(100 46) rotate(-8)">
          <path d={poly(wobble([[-46, 0], [30, -9], [52, 0], [30, 9]], 2, s), true)} className="ma-cream ink-s" />
          <path d={poly(wobble([[-8, -5], [-30, -32], [-18, -32], [14, -6]], 2, s + 1), true)} className="ma-coral ink-s" />
          <path d={poly(wobble([[-8, 5], [-30, 32], [-18, 32], [14, 6]], 2, s + 2), true)} className="ma-cream ink-s" />
          <path d={poly(wobble([[-40, 0], [-50, -14], [-40, -14], [-30, -2]], 1.4, s + 3), true)} className="ma-coral ink-s" />
          {[0, 1, 2, 3, 4].map((w) => <circle key={w} cx={-4 + w * 9} cy="-2" r="1.8" className="ma-glass ink-s thin" />)}
          <path d="M-62 4 L-52 4 M-66 -3 L-54 -3" className="ink-s thin" />
        </g>
      )}

      {(mode === 'cab' || mode === 'auto') && (
        <g>
          <path d={poly(wobble([[52, 78], [52, 64], [66, 62], [74, 50], [112, 50], [122, 62], [146, 64], [146, 78]], 1.6, s), true)} className="ma-butter ink-s" />
          <path d={poly(wobble([[78, 52], [86, 52], [86, 62], [72, 62]], 1, s + 1), true)} className="ma-glass ink-s thin" />
          <path d={poly(wobble([[92, 52], [110, 52], [117, 62], [92, 62]], 1, s + 2), true)} className="ma-glass ink-s thin" />
          <path d={box(88, 43, 16, 6, s + 3, 0.6)} className="ma-coral ink-s thin" />
          <circle cx="74" cy="80" r="7" className="ink-fill" /><circle cx="126" cy="80" r="7" className="ink-fill" />
          <path d="M38 70 L48 70 M34 76 L46 76" className="ink-s thin" />
        </g>
      )}

      {(mode === 'metro' || mode === 'ferry' || mode === 'bike' || mode === 'other') && (
        <g>
          <path d={smooth(ring(100, 56, 18, s, 2))} className="ma-butter ink-s" />
          <path d="M100 30 L100 36 M100 76 L100 82 M74 56 L80 56 M120 56 L126 56 M81 37 L85 41 M115 71 L119 75 M81 75 L85 71 M115 41 L119 37" className="ink-s thin" />
          <path d="M96 56 L100 48 L104 56 L100 64 Z" className="ma-coral ink-s thin" />
        </g>
      )}
    </svg>
  )
}
