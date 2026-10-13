import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { prefersReducedMotion } from '../lib/motion'

/* ---------------------------------------------------------------------------
   A pen-and-ink sketch of a road trip. Every line is generated once with a
   little hand-shake (no live filters, so scrolling stays smooth), then the
   scroll position moves the camera, a cab along the road and a plane across
   the sky. Hatching and paper grain supply the texture.
   --------------------------------------------------------------------------- */

type P = [number, number]

function rnd(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

const f = (n: number) => n.toFixed(1)
const wobble = (pts: P[], amp: number, seed: number): P[] => {
  const r = rnd(seed)
  return pts.map(([x, y]) => [x + (r() - 0.5) * amp, y + (r() - 0.5) * amp])
}
const poly = (pts: P[], close = false) =>
  'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + (close ? ' Z' : '')
// Rounded line through the points: quadratic curves via midpoints.
const smooth = (pts: P[]) => {
  if (pts.length < 3) return poly(pts)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]
    const [nx, ny] = pts[i + 1]
    d += ` Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`
  }
  const l = pts[pts.length - 1]
  return d + ` L${f(l[0])} ${f(l[1])}`
}
const sample = (fn: (x: number) => number, x0: number, x1: number, step: number): P[] => {
  const out: P[] = []
  for (let x = x0; x < x1; x += step) out.push([x, fn(x)])
  out.push([x1, fn(x1)])
  return out
}
// A pen circle: drawn around once and slightly past the start, like a real stroke.
const ring = (cx: number, cy: number, r: number, seed: number, amp: number): P[] => {
  const n = 30
  const pts: P[] = []
  for (let i = 0; i <= n + 3; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return wobble(pts, amp, seed)
}

const FAR_PEAKS: P[] = [[0, 560], [120, 470], [220, 540], [360, 400], [480, 520], [620, 430], [760, 540], [900, 410], [1040, 520], [1180, 440], [1320, 530], [1440, 470]]
const midY = (x: number) => 628 + 36 * Math.sin(x / 210 + 0.6) + 16 * Math.sin(x / 83 + 2)
const nearY = (x: number) => 704 + 26 * Math.sin(x / 260 + 1.2) + 12 * Math.sin(x / 97)

const ROAD = 'M-40 840 C 260 770 520 800 760 770 C 1000 740 1180 700 1480 740'
// Plane flight path: quadratic Bezier, evaluated by hand in the scroll handler.
const P0 = { x: -60, y: 300 }
const P1 = { x: 720, y: 10 }
const P2 = { x: 1500, y: 210 }
const PLANE_D = `M${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`

function buildScene() {
  // far mountains: straight pen strokes, subdivided so they shake a little
  const far: P[] = []
  for (let i = 0; i < FAR_PEAKS.length - 1; i++) {
    const [ax, ay] = FAR_PEAKS[i]
    const [bx, by] = FAR_PEAKS[i + 1]
    const steps = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 36))
    for (let k = 0; k < steps; k++) far.push([ax + ((bx - ax) * k) / steps, ay + ((by - ay) * k) / steps])
  }
  far.push(FAR_PEAKS[FAR_PEAKS.length - 1])
  const farA = wobble(far, 3.2, 11)
  const farB = wobble(far, 4.2, 12)
  const mid = sample(midY, 0, 1440, 36)
  const midA = wobble(mid, 3, 21)
  const midB = wobble(mid, 4, 22)
  const near = sample(nearY, 0, 1440, 36)
  const nearA = wobble(near, 3, 31)
  const nearB = wobble(near, 4, 32)
  const base: P[] = [[1440, 900], [0, 900]]

  // tufts of grass along the near hill
  const r = rnd(77)
  let grass = ''
  for (let x = 12; x < 1440; x += 30 + r() * 26) {
    const y = nearY(x) + 6 + r() * 5
    grass += `M${f(x)} ${f(y)} L${f(x + (r() - 0.5) * 6)} ${f(y - 8 - r() * 9)} `
  }

  // faint horizontal strokes of haze low in the sky
  const hz = rnd(5)
  let haze = ''
  for (let y = 478; y < 640; y += 22) {
    const x = hz() * 1100
    const len = 160 + hz() * 340
    haze += `M${f(x)} ${f(y)} Q${f(x + len / 2)} ${f(y + (hz() - 0.5) * 6)} ${f(x + len)} ${f(y + (hz() - 0.5) * 4)} `
  }

  // sun: double pen circle plus short rays
  const sr = rnd(9)
  let rays = ''
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    const r1 = 112 + sr() * 6
    const r2 = r1 + 20 + sr() * 16
    rays += `M${f(720 + Math.cos(a) * r1)} ${f(640 + Math.sin(a) * r1)} L${f(720 + Math.cos(a) * r2)} ${f(640 + Math.sin(a) * r2)} `
  }

  // a cloud drawn as one looping line
  const cloudPts: P[] = [[0, 60], [8, 48], [22, 42], [26, 28], [40, 16], [58, 14], [72, 6], [92, 8], [104, 20], [122, 18], [134, 30], [136, 44], [150, 50], [152, 60]]

  // star crosses (dark mode only)
  const st = rnd(3)
  let stars = ''
  for (let i = 0; i < 34; i++) {
    const x = st() * 1440
    const y = st() * 400
    const s = 2 + st() * 2.5
    stars += `M${f(x - s)} ${f(y)} L${f(x + s)} ${f(y)} M${f(x)} ${f(y - s)} L${f(x)} ${f(y + s)} `
  }

  return {
    farFill: poly([...farA, ...base], true), farLineA: poly(farA), farLineB: poly(farB),
    midFill: poly([...midA, ...base], true), midLineA: smooth(midA), midLineB: smooth(midB),
    nearFill: poly([...nearA, ...base], true), nearLineA: smooth(nearA), nearLineB: smooth(nearB),
    grass, haze, rays, stars,
    sunA: smooth(ring(720, 640, 90, 41, 2.4)), sunB: smooth(ring(720, 640, 92, 42, 3)),
    sunRing: smooth(ring(720, 640, 132, 43, 3)),
    cloudLine: smooth(wobble(cloudPts, 2.4, 51)), cloudBase: poly(wobble([[0, 60], [152, 60]], 1.6, 52)),
    cabBody: poly(wobble([[-22, -15], [22, -15], [22, -1], [-22, -1]], 1.4, 61), true),
    cabRoof: poly(wobble([[-12, -15], [-7, -25], [9, -25], [14, -15]], 1.2, 62), true),
    cabSign: poly(wobble([[-4, -31], [4, -31], [4, -26], [-4, -26]], 0.8, 63), true),
    wheelA: smooth(ring(-12, 0, 5, 64, 1)), wheelB: smooth(ring(12, 0, 5, 65, 1)),
    plane: poly(wobble([[-16, 0], [8, -3], [18, 0], [8, 3]], 1, 71), true),
    wingA: poly(wobble([[-3, -2], [-12, -13], [-7, -13], [5, -2]], 1, 72), true),
    wingB: poly(wobble([[-3, 2], [-12, 13], [-7, 13], [5, 2]], 1, 73), true),
    tail: poly(wobble([[-14, 0], [-18, -6], [-14, -6], [-10, 0]], 0.8, 74), true),
  }
}

export default function HeroScene({ a, b }: { a: ReactNode; b: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const road = useRef<SVGPathElement>(null)
  const cab = useRef<SVGGElement>(null)
  const plane = useRef<SVGGElement>(null)
  const S = useMemo(buildScene, [])

  const lanterns = useMemo(() => {
    const r = rnd(1234567)
    return Array.from({ length: 10 }, () => ({ left: r() * 100, size: 5 + r() * 7, dur: 16 + r() * 16, delay: -r() * 24 }))
  }, [])

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
            <defs>
              {/* two hatch directions, drawn as repeating pen strokes */}
              <pattern id="hatch-a" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
                <line x1="0" y1="0" x2="0" y2="9" className="hatch-line" />
              </pattern>
              <pattern id="hatch-b" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
                <line x1="0" y1="0" x2="0" y2="7" className="hatch-line" />
              </pattern>
            </defs>

            <path d={S.stars} className="ink star-marks" />
            <path d={S.haze} className="ink haze" />

            <g className="l-sun">
              <circle cx="720" cy="640" r="132" fill="var(--sun-ring)" />
              <circle cx="720" cy="640" r="90" fill="var(--sun)" />
              <path d={S.sunRing} className="ink faint" />
              <path d={S.sunA} className="ink" />
              <path d={S.sunB} className="ink thin" />
              <path d={S.rays} className="ink thin" />
            </g>

            <g className="cloud c1"><g transform="translate(0 70) scale(1.3)">
              <path d={S.cloudLine} fill="var(--cloud)" className="ink faint" /><path d={S.cloudBase} className="ink faint" />
            </g></g>
            <g className="cloud c2"><g transform="translate(0 150) scale(0.9)">
              <path d={S.cloudLine} fill="var(--cloud)" className="ink faint" /><path d={S.cloudBase} className="ink faint" />
            </g></g>

            {/* plane: a dashed trail that draws itself, and the plane at its tip */}
            <path d={PLANE_D} className="plane-trail" pathLength="1" />
            <g ref={plane} className="plane">
              <path d={S.plane} /><path d={S.wingA} /><path d={S.wingB} /><path d={S.tail} />
            </g>

            <g className="l-far">
              <path d={S.farFill} fill="var(--hill-1)" />
              <path d={S.farFill} fill="url(#hatch-a)" className="hatch-fade" />
              <path d={S.farLineA} className="ink" /><path d={S.farLineB} className="ink thin" />
            </g>
            <g className="l-mid">
              <path d={S.midFill} fill="var(--hill-2)" />
              <path d={S.midFill} fill="url(#hatch-b)" className="hatch-fade" />
              <path d={S.midLineA} className="ink" /><path d={S.midLineB} className="ink thin" />
            </g>
            <g className="l-near">
              <path d={S.nearFill} fill="var(--hill-3)" />
              <path d={S.nearFill} fill="url(#hatch-a)" className="hatch-fade" />
              <path d={S.nearLineA} className="ink" /><path d={S.nearLineB} className="ink thin" />
              <path d={S.grass} className="ink thin" />
              <path ref={road} d={ROAD} className="road" />
              <path d={ROAD} className="road-dash" />
              <g ref={cab} className="cab">
                <path d={S.cabBody} fill="#ffc857" />
                <path d={S.cabRoof} fill="#ffd97a" />
                <path d={S.cabSign} fill="var(--scene-line)" />
                <path d={S.wheelA} fill="var(--scene-line)" />
                <path d={S.wheelB} fill="var(--scene-line)" />
              </g>
            </g>
          </svg>
          <div className="lanterns">
            {lanterns.map((l, i) => (
              <span key={i} className="lantern" style={{ left: `${l.left}%`, width: l.size, height: l.size * 1.3, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` } as CSSProperties} />
            ))}
          </div>
        </div>
        <div className="scene-grain" aria-hidden="true" />

        <div className="scene-copy copy-a">{a}</div>
        <div className="scene-copy copy-b">{b}</div>
        <div className="scroll-cue" aria-hidden="true"><span /></div>
      </div>
    </div>
  )
}
