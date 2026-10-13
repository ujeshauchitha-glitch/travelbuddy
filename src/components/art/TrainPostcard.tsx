import { useMemo } from 'react'
import { blob, box, poly, rnd, ring, sample, smooth, wobble, type P } from '../../lib/sketch'

/**
 * The hero postcard: a pencil-and-ink landscape with a viaduct and a little
 * train rolling across it. Flat paper colours, ink outlines, hatching for shade.
 */
function build() {
  const farPeaks: P[] = [[0, 250], [70, 205], [118, 235], [200, 150], [262, 215], [330, 170], [398, 232], [470, 160], [540, 225], [640, 190]]
  const far: P[] = []
  for (let i = 0; i < farPeaks.length - 1; i++) {
    const [ax, ay] = farPeaks[i]
    const [bx, by] = farPeaks[i + 1]
    const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 22))
    for (let k = 0; k < n; k++) far.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
  }
  far.push(farPeaks[farPeaks.length - 1])
  const farW = wobble(far, 2.6, 5)
  const midY = (x: number) => 262 + 22 * Math.sin(x / 90 + 0.6) + 8 * Math.sin(x / 31)
  const mid = wobble(sample(midY, 0, 640, 20), 2.2, 8)

  const r = rnd(14)
  const trees = Array.from({ length: 16 }, (_, i) => ({
    x: 18 + i * 40 + r() * 20, y: 270 + r() * 26, s: 9 + r() * 7, seed: 100 + i,
  }))
  // viaduct arches
  const arches = Array.from({ length: 7 }, (_, i) => ({ x: 20 + i * 92 }))
  const cloud: P[] = [[0, 30], [8, 20], [24, 16], [30, 6], [48, 2], [64, 8], [78, 4], [96, 12], [112, 14], [118, 24], [124, 30]]

  return {
    far: poly([...farW, [640, 360], [0, 360]], true), farLine: poly(farW),
    mid: smooth(mid), midFill: `${smooth(mid)} L640 360 L0 360 Z`,
    trees, arches,
    sun: smooth(ring(500, 78, 30, 21, 2)), sunB: smooth(ring(500, 78, 32, 22, 2.6)),
    cloud: smooth(wobble(cloud, 2, 31)), cloudBase: poly(wobble([[0, 30], [124, 30]], 1.4, 32)),
  }
}

export default function TrainPostcard() {
  const A = useMemo(build, [])
  return (
    <svg className="postcard-art" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration of a train crossing a stone viaduct in the hills">
      <defs>
        <pattern id="pc-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <line x1="0" y1="0" x2="0" y2="8" className="hatch-line" />
        </pattern>
      </defs>
      <rect width="640" height="400" className="pc-sky" />

      <g className="pc-clouds">
        <g className="pc-cloud c1"><g transform="translate(40 40)"><path d={A.cloud} className="pc-cloudfill ink-s" /><path d={A.cloudBase} className="ink-s thin" /></g></g>
        <g className="pc-cloud c2"><g transform="translate(0 92) scale(0.8)"><path d={A.cloud} className="pc-cloudfill ink-s" /><path d={A.cloudBase} className="ink-s thin" /></g></g>
      </g>

      <circle cx="500" cy="78" r="30" className="pc-sun" />
      <path d={A.sun} className="ink-s" /><path d={A.sunB} className="ink-s thin" />

      <path d={A.far} className="pc-far" />
      <path d={A.far} fill="url(#pc-hatch)" opacity="0.8" />
      <path d={A.farLine} className="ink-s" />

      <path d={A.midFill} className="pc-mid" />
      <path d={A.midFill} fill="url(#pc-hatch)" opacity="0.55" />
      <path d={A.mid} className="ink-s" />

      {/* a band of water behind the viaduct */}
      <path d="M0 296 L640 296 L640 330 L0 330 Z" className="pc-water" />
      <path d="M30 306 L80 306 M150 314 L230 314 M310 306 L380 306 M450 316 L540 316 M560 304 L610 304" className="ink-s thin" />

      {A.trees.map((t) => (
        <g key={t.seed}>
          <path d={poly([[t.x, t.y], [t.x, t.y - t.s * 1.1]])} className="ink-s" />
          <path d={blob(t.x, t.y - t.s * 1.5, t.s, t.seed)} className="pc-tree ink-s" />
        </g>
      ))}

      {/* viaduct */}
      <path d={box(0, 226, 640, 18, 41, 1.4)} className="pc-stone ink-s" />
      {A.arches.map((a, i) => (
        <g key={i}>
          <path d={box(a.x - 10, 244, 92, 100, 50 + i, 1.4)} className="pc-stone ink-s" />
          <path d={`M${a.x + 6} 344 L${a.x + 6} 290 Q${a.x + 36} 252 ${a.x + 66} 290 L${a.x + 66} 344 Z`} className="pc-arch ink-s" />
        </g>
      ))}
      <path d="M0 244 L640 244" className="ink-s thin" />

      {/* the train */}
      <g className="pc-train">
        <path d="M-150 198 L-30 198 M-170 206 L-60 206 M-140 214 L-20 214" className="ink-s thin" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path d={box(-10 + i * 78, 196, 74, 30, 70 + i, 1.2)} className={i === 3 ? 'pc-coral ink-s' : 'pc-cream ink-s'} />
            <path d={box(-10 + i * 78, 214, 74, 6, 80 + i, 0.8)} className="pc-coral ink-s thin" />
            {[0, 1, 2, 3].map((w) => <path key={w} d={box(-2 + i * 78 + w * 17, 202, 12, 9, 90 + w, 0.7)} className="pc-glass ink-s thin" />)}
            <circle cx={8 + i * 78} cy="228" r="3.4" className="ink-fill" /><circle cx={56 + i * 78} cy="228" r="3.4" className="ink-fill" />
          </g>
        ))}
      </g>
    </svg>
  )
}
