import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { prefersReducedMotion } from '../lib/motion'

// Deterministic pseudo-random so the stars and lanterns are stable between renders.
function seeded(n: number) {
  let s = 1234567
  return Array.from({ length: n }, () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  })
}

const ROAD = 'M-40 840 C 260 770 520 800 760 770 C 1000 740 1180 700 1480 740'
// Plane flight path: quadratic Bezier, evaluated by hand in the scroll handler.
const P0 = { x: -60, y: 300 }
const P1 = { x: 720, y: 10 }
const P2 = { x: 1500, y: 210 }
const PLANE_D = `M${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`

/**
 * A pinned, scroll-driven illustrated scene: sun, layered hills, a road with a
 * cab driving along it and a plane crossing the sky. Everything is driven by
 * one number, --hp (0..1), the scroll progress through the pinned section.
 */
export default function HeroScene({ a, b }: { a: ReactNode; b: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const road = useRef<SVGPathElement>(null)
  const cab = useRef<SVGGElement>(null)
  const plane = useRef<SVGGElement>(null)

  const stars = useMemo(() => seeded(90).reduce<{ x: number; y: number; r: number }[]>((acc, _v, i, all) => {
    if (i % 3 === 0 && i + 2 < all.length) acc.push({ x: all[i] * 1440, y: all[i + 1] * 420, r: 0.6 + all[i + 2] * 1.4 })
    return acc
  }, []), [])
  const lanterns = useMemo(() => seeded(30).reduce<{ left: number; size: number; dur: number; delay: number }[]>((acc, _v, i, all) => {
    if (i % 3 === 0 && i + 2 < all.length) {
      acc.push({ left: all[i] * 100, size: 5 + all[i + 1] * 7, dur: 16 + all[i + 2] * 16, delay: -all[i + 1] * 24 })
    }
    return acc
  }, []), [])

  useEffect(() => {
    const el = root.current
    const roadEl = road.current
    if (!el || !roadEl) return
    const len = roadEl.getTotalLength()

    const apply = (hp: number) => {
      el.style.setProperty('--hp', hp.toFixed(4))
      el.dataset.phase = hp < 0.42 ? 'a' : 'b'

      const d = hp * len
      const p = roadEl.getPointAtLength(d)
      const q = roadEl.getPointAtLength(Math.min(len, d + 2))
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
      cab.current?.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(1.5)`)

      const t = hp
      const u = 1 - t
      const x = u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x
      const y = u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y
      const dx = 2 * u * (P1.x - P0.x) + 2 * t * (P2.x - P1.x)
      const dy = 2 * u * (P1.y - P0.y) + 2 * t * (P2.y - P1.y)
      const pa = (Math.atan2(dy, dx) * 180) / Math.PI
      plane.current?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${pa.toFixed(1)}) scale(1.6)`)
    }

    if (prefersReducedMotion()) { apply(0.5); return }

    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const span = Math.max(1, r.height - window.innerHeight)
      apply(Math.min(1, Math.max(0, -r.top / span)))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="scene" ref={root} data-phase="a">
      <div className="scene-pin">
        <div className="scene-art" aria-hidden="true">
          <div className="sky" />
          <svg className="scene-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
            <rect x="0" y="0" width="1440" height="900" fill="var(--sky-1)" />
            <rect x="0" y="470" width="1440" height="430" fill="var(--sky-2)" />
            <rect x="0" y="590" width="1440" height="310" fill="var(--sky-3)" />

            <g className="l-stars">
              {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" />)}
            </g>

            <g className="l-sun">
              <circle cx="720" cy="640" r="132" fill="var(--sun-ring)" />
              <circle cx="720" cy="640" r="90" fill="var(--sun)" className="outline" />
            </g>

            <g className="cloud c1"><g transform="translate(0 70) scale(1.3)"><path fill="var(--cloud)" d="M0 60 Q0 40 22 40 Q26 12 56 14 Q78 -4 100 18 Q132 14 134 42 Q150 44 150 60 Z" /></g></g>
            <g className="cloud c2"><g transform="translate(0 150) scale(0.9)"><path fill="var(--cloud)" d="M0 60 Q0 40 22 40 Q26 12 56 14 Q78 -4 100 18 Q132 14 134 42 Q150 44 150 60 Z" /></g></g>

            {/* plane: a dashed trail that draws itself, and the plane at its tip */}
            <path d={PLANE_D} className="plane-trail" pathLength="1" />
            <g ref={plane} className="plane">
              <path d="M-16 0 L8 -3 L18 0 L8 3 Z M-3 -2 L-12 -13 L-7 -13 L5 -2 Z M-3 2 L-12 13 L-7 13 L5 2 Z M-14 0 L-18 -6 L-14 -6 L-10 0 Z" />
            </g>

            <g className="l-far"><path d="M0 560 L120 470 L220 540 L360 400 L480 520 L620 430 L760 540 L900 410 L1040 520 L1180 440 L1320 530 L1440 470 L1440 900 L0 900 Z" className="hill" fill="var(--hill-1)" /></g>
            <g className="l-mid"><path d="M0 640 C 200 560 360 600 520 650 C 700 700 860 560 1040 590 C 1220 620 1340 600 1440 570 L1440 900 L0 900 Z" className="hill" fill="var(--hill-2)" /></g>
            <g className="l-near">
              <path d="M0 700 C 260 650 520 690 760 700 C 1000 710 1180 660 1440 690 L1440 900 L0 900 Z" className="hill" fill="var(--hill-3)" />
              <path ref={road} d={ROAD} className="road" />
              <path d={ROAD} className="road-dash" />
              <g ref={cab} className="cab">
                <rect x="-22" y="-15" width="44" height="14" rx="5" fill="#ffc857" />
                <path d="M-12 -15 L-7 -25 H9 L14 -15 Z" fill="#ffd97a" />
                <rect x="-4" y="-31" width="8" height="5" rx="1" fill="#2b1612" />
                <circle cx="-12" cy="0" r="5" fill="#2b1612" />
                <circle cx="12" cy="0" r="5" fill="#2b1612" />
              </g>
            </g>
          </svg>
          <div className="lanterns">
            {lanterns.map((l, i) => (
              <span key={i} className="lantern" style={{ left: `${l.left}%`, width: l.size, height: l.size * 1.3, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` } as CSSProperties} />
            ))}
          </div>
        </div>

        <div className="scene-copy copy-a">{a}</div>
        <div className="scene-copy copy-b">{b}</div>
        <div className="scroll-cue" aria-hidden="true"><span /></div>
      </div>
    </div>
  )
}
