// Tiny helpers for drawing hand-made-looking SVG lines. Everything is computed
// once from fixed seeds, so the "hand shake" is stable and costs nothing at runtime.

export type P = [number, number]

export function rnd(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

const f = (n: number) => n.toFixed(1)

export const wobble = (pts: P[], amp: number, seed: number): P[] => {
  const r = rnd(seed)
  return pts.map(([x, y]) => [x + (r() - 0.5) * amp, y + (r() - 0.5) * amp])
}

export const poly = (pts: P[], close = false) =>
  'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + (close ? ' Z' : '')

/** Rounded line through the points (quadratic curves via midpoints). */
export const smooth = (pts: P[]) => {
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

export const sample = (fn: (x: number) => number, x0: number, x1: number, step: number): P[] => {
  const out: P[] = []
  for (let x = x0; x < x1; x += step) out.push([x, fn(x)])
  out.push([x1, fn(x1)])
  return out
}

/** A pen circle: drawn around once and slightly past the start, like a real stroke. */
export const ring = (cx: number, cy: number, r: number, seed: number, amp: number): P[] => {
  const n = 28
  const pts: P[] = []
  for (let i = 0; i <= n + 3; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return wobble(pts, amp, seed)
}

/** A slightly imperfect rectangle as a closed path. */
export const box = (x: number, y: number, w: number, h: number, seed: number, amp = 1.2) =>
  poly(wobble([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], amp, seed), true)

/** A filled blob (tree crown, bush) from a wobbly circle. */
export const blob = (cx: number, cy: number, r: number, seed: number) => smooth(ring(cx, cy, r, seed, r * 0.28))
