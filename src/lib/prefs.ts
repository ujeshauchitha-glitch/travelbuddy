// Everything a person can customise. Each choice becomes a data-attribute on
// <html> (see the CUSTOMISATION section of index.css) and is remembered.

export const OPTIONS = {
  theme: ['system', 'light', 'dark'],
  palette: ['coral', 'sage', 'sky', 'butter', 'plum', 'mint', 'brick'],
  texture: ['paper', 'grain', 'plain', 'dots', 'hatch', 'lined', 'grid'],
  edge: ['soft', 'bold', 'flat'],
  line: ['clean', 'sketchy'],
  corners: ['square', 'soft', 'pill'],
  density: ['cozy', 'compact'],
  size: ['s', 'm', 'l'],
  motion: ['full', 'calm', 'off'],
  art: ['stamps', 'icons'],
  cursor: ['trail', 'pencil', 'system'],
} as const

type Opt<K extends keyof typeof OPTIONS> = (typeof OPTIONS)[K][number]

export interface Prefs {
  theme: Opt<'theme'>
  palette: Opt<'palette'>
  texture: Opt<'texture'>
  edge: Opt<'edge'>
  line: Opt<'line'>
  corners: Opt<'corners'>
  density: Opt<'density'>
  size: Opt<'size'>
  motion: Opt<'motion'>
  art: Opt<'art'>
  cursor: Opt<'cursor'>
  doodles: boolean
  haptics: boolean
  fx: boolean
}

export const DEFAULTS: Prefs = {
  theme: 'system', palette: 'coral', texture: 'paper', edge: 'soft', line: 'clean', corners: 'soft',
  density: 'cozy', size: 'm', motion: 'full', art: 'stamps', cursor: 'trail', doodles: true, haptics: true, fx: true,
}

const KEY = 'tt-prefs'
const LEGACY_THEME = 'tb-theme'

/** Accepts anything and returns a safe, complete Prefs. Unknown values fall back to defaults. */
export function sanitize(raw: unknown): Prefs {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out: Record<string, unknown> = { ...DEFAULTS }
  for (const k of Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]) {
    const v = src[k]
    if (typeof v === 'string' && (OPTIONS[k] as readonly string[]).includes(v)) out[k] = v
  }
  if (typeof src.doodles === 'boolean') out.doodles = src.doodles
  if (typeof src.haptics === 'boolean') out.haptics = src.haptics
  if (typeof src.fx === 'boolean') out.fx = src.fx
  return out as unknown as Prefs
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return sanitize(JSON.parse(raw))
    const legacy = localStorage.getItem(LEGACY_THEME)
    if (legacy === 'light' || legacy === 'dark') return { ...DEFAULTS, theme: legacy }
  } catch { /* storage blocked: defaults still work */ }
  return DEFAULTS
}

export function savePrefs(p: Prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* private mode */ }
}

export function applyPrefs(p: Prefs) {
  const r = document.documentElement
  r.dataset.palette = p.palette
  r.dataset.texture = p.texture
  r.dataset.edge = p.edge
  r.dataset.line = p.line
  r.dataset.corners = p.corners
  r.dataset.density = p.density
  r.dataset.fs = p.size
  r.dataset.motion = p.motion
  r.dataset.art = p.art
  r.dataset.cursor = p.cursor
  r.dataset.fx = p.fx ? 'on' : 'off'
  r.dataset.doodles = p.doodles ? 'on' : 'off'
  if (p.theme === 'system') r.removeAttribute('data-theme')
  else r.dataset.theme = p.theme
}

/** A short code people can paste to share a look. */
export function encodePrefs(p: Prefs): string {
  return 'TT1.' + btoa(JSON.stringify(p))
}
export function decodePrefs(code: string): Prefs | null {
  try {
    const body = code.trim().replace(/^TT1\./, '')
    return sanitize(JSON.parse(atob(body)))
  } catch {
    return null
  }
}

// Haptic taps on phones (a very short vibration), when switched on.
let hapticsOn = true
export const setHaptics = (on: boolean) => { hapticsOn = on }
export function haptic(ms = 8) {
  if (hapticsOn && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms) } catch { /* not allowed */ }
  }
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off')
