import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { poly, ring, smooth, wobble, type P } from '../../lib/sketch'
import { prefersReducedMotion } from '../../lib/prefs'

/*
  Pencil drawings that sketch themselves. Every stroke is a normalised path
  (pathLength = 1) so one CSS animation can draw them in order, line by line,
  when the section scrolls into view (see .sketch in index.css).
*/

const R = (pts: P[], amp: number, seed: number, close = true) => poly(wobble(pts, amp, seed), close)

function Strokes({ d, className }: { d: string[]; className?: string }) {
  return (
    <>
      {d.map((p, i) => (
        <path key={i} d={p} pathLength={1} className={className} style={{ '--k': i } as CSSProperties} />
      ))}
    </>
  )
}

const TRAIN = (() => {
  const wheels = [30, 62, 98, 128].map((x, i) => smooth(ring(x, 67, 5, 20 + i, 1)))
  return [
    R([[10, 26], [112, 22], [146, 46], [149, 63], [10, 63]], 1.6, 1),
    ...[0, 1, 2, 3].map((i) => R([[22 + i * 22, 31], [38 + i * 22, 31], [38 + i * 22, 43], [22 + i * 22, 43]], 1, 10 + i)),
    poly(wobble([[10, 53], [149, 53]], 1.2, 5), false),
    R([[112, 22], [112, 63]], 1, 6, false),
    ...wheels,
    poly(wobble([[0, 76], [160, 76]], 1.2, 7), false),
    ...[10, 34, 58, 82, 106, 130].map((x, i) => poly(wobble([[x, 73], [x + 4, 80]], 1, 30 + i), false)),
    'M6 36 L-4 36 M8 44 L-8 44 M6 52 L-2 52',
    'M70 14 Q 76 6 70 -2 Q 64 -10 72 -16',
  ]
})()

const PLANE = [
  R([[18, 46], [112, 30], [148, 42], [112, 52]], 1.5, 40),
  R([[64, 38], [34, 6], [48, 6], [92, 34]], 1.4, 41),
  R([[64, 48], [40, 78], [52, 78], [92, 50]], 1.4, 42),
  R([[26, 44], [12, 22], [24, 22], [42, 40]], 1.2, 43),
  ...[0, 1, 2, 3, 4].map((i) => smooth(ring(60 + i * 12, 40 - i * 1.2, 1.7, 50 + i, 0.4))),
  'M0 60 Q 10 58 22 60 M-6 68 Q 8 66 20 68',
]

const COMPASS = [
  smooth(ring(45, 45, 32, 60, 1.6)),
  smooth(ring(45, 45, 25, 61, 1.2)),
  R([[45, 18], [51, 45], [45, 72], [39, 45]], 0.8, 62),
  'M45 8 L45 14 M45 76 L45 82 M8 45 L14 45 M76 45 L82 45',
  'M45 20 L48 45 L45 45 Z',
]

const BACKPACK = [
  R([[14, 26], [66, 26], [70, 80], [10, 80]], 1.6, 70),
  'M26 26 Q 40 4 54 26',
  R([[22, 50], [58, 50], [58, 74], [22, 74]], 1.2, 71),
  'M22 60 L58 60',
  'M30 34 L30 46 M50 34 L50 46',
  'M14 40 Q 2 52 12 68 M66 40 Q 78 52 68 68',
]

const TICKET = [
  R([[6, 8], [144, 8], [144, 62], [6, 62]], 1.4, 80),
  'M100 8 L100 62',
  smooth(ring(100, 8, 5, 81, 0.5)),
  smooth(ring(100, 62, 5, 82, 0.5)),
  'M16 22 L82 22 M16 32 L66 32 M16 42 L78 42',
  'M112 22 L134 22 M112 34 L128 34 M112 46 L134 46',
]

function make(vb: string, d: string[], label: string, className: string) {
  return function Sketch() {
    return (
      <svg className={`sketch ${className}`} viewBox={vb} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet" overflow="visible">
        <Strokes d={d} />
      </svg>
    )
  }
}

export const SketchTrain = make('-10 -20 170 110', TRAIN, 'Pencil sketch of a train', 'sk-train')
export const SketchPlane = make('-10 0 170 90', PLANE, 'Pencil sketch of an aeroplane', 'sk-plane')
export const SketchCompass = make('0 0 90 90', COMPASS, 'Pencil sketch of a compass', 'sk-compass')
export const SketchBackpack = make('0 0 80 90', BACKPACK, 'Pencil sketch of a backpack', 'sk-backpack')
export const SketchTicket = make('0 0 150 70', TICKET, 'Pencil sketch of a ticket', 'sk-ticket')

/**
 * A winding road that draws itself as you scroll past, with a pencil cab
 * driving along the part that is already drawn.
 */
export function RoadDivider() {
  const wrap = useRef<HTMLDivElement>(null)
  const road = useRef<SVGPathElement>(null)
  const cab = useRef<SVGGElement>(null)
  const [w, setW] = useState(900)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(Math.max(280, el.clientWidth)))
    ro.observe(el)
    setW(Math.max(280, el.clientWidth))
    return () => ro.disconnect()
  }, [])

  const d = useMemo(
    () => `M-10 46 C ${w * 0.12} 8, ${w * 0.2} 80, ${w * 0.34} 40 S ${w * 0.56} 4, ${w * 0.7} 46 S ${w * 0.9} 78, ${w + 10} 30`,
    [w],
  )

  useEffect(() => {
    const el = wrap.current
    const p = road.current
    const c = cab.current
    if (!el || !p || !c) return
    const len = p.getTotalLength()
    const apply = (t: number) => {
      p.style.strokeDashoffset = String(1 - t)
      const at = Math.max(0.5, t * len)
      const a = p.getPointAtLength(at)
      const b = p.getPointAtLength(Math.min(len, at + 2))
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
      c.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)})`)
      c.style.opacity = t > 0.02 && t < 0.995 ? '1' : '0'
    }
    if (prefersReducedMotion()) { apply(1); return }
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      apply(Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.8))))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf) }
  }, [d])

  return (
    <div className="road-divider" ref={wrap} aria-hidden="true">
      <svg viewBox={`0 0 ${w} 90`} width="100%" height="90">
        <path ref={road} d={d} pathLength={1} className="rd-line" />
        <g ref={cab} className="rd-cab" style={{ opacity: 0 }}>
          <path d="M-14 -2 L-14 -9 L-6 -11 L-2 -17 L8 -17 L12 -11 L16 -9 L16 -2 Z" className="rd-body" />
          <path d="M-3 -16 L-3 -11 L10 -11 L7 -16 Z" className="rd-glass" />
          <circle cx="-7" cy="-1" r="3.4" className="rd-wheel" /><circle cx="9" cy="-1" r="3.4" className="rd-wheel" />
          <path d="M-20 -6 L-30 -6 M-18 -11 L-26 -11" className="rd-speed" />
        </g>
      </svg>
    </div>
  )
}
