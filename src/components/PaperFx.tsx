import { useEffect, useRef, useState } from 'react'
import { usePrefs } from '../lib/PrefsContext'

// Where the paper should not react: things you press, fields you type in, and dialogs.
const SKIP = 'a[href], button, [role="button"], [role="radio"], [role="dialog"], [role="listbox"], summary, label, select, input, textarea, [contenteditable="true"], .select-list, .modal, .cz, [data-magnet]'

const CREASE_LIFE = 5200
const INK_LIFE = 16000
const INK_FADE = 4000

interface Crease { pts: [number, number][]; t: number; w: number }
interface Seg { x1: number; y1: number; x2: number; y2: number; w: number; t: number }

/**
 * The page is paper. Moving the mouse over it crumples it under the pointer: soft
 * creases appear around the cursor and slowly smooth out again. Press and hold on
 * the paper (not on a button or field) and drag to write on it in pencil; the
 * writing fades after a while. Mouse and pen only, off with Motion: Off or the
 * "Interactive effects" switch.
 */
export default function PaperFx() {
  const { prefs } = usePrefs()
  const [fine, setFine] = useState(() => window.matchMedia('(pointer: fine)').matches)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const active = fine && prefs.fx && prefs.motion !== 'off' && !reduced
  const creaseCv = useRef<HTMLCanvasElement>(null)
  const inkCv = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const on = () => setFine(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (!active) return
    const cc = creaseCv.current
    const ic = inkCv.current
    const cctx = cc?.getContext('2d')
    const ictx = ic?.getContext('2d')
    if (!cc || !ic || !cctx || !ictx) return
    const root = document.documentElement

    const creases: Crease[] = []
    const segs: Seg[] = []
    let raf = 0, lastX = -999, lastY = -999, drawing = false, px = 0, py = 0, pw = 2.4
    let ink = '#242126'
    let dark = false

    const theme = () => {
      ink = getComputedStyle(root).getPropertyValue('--text').trim() || ink
      const t = root.getAttribute('data-theme')
      dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    theme()

    const resize = () => {
      const d = window.devicePixelRatio || 1
      for (const [cv, ctx] of [[cc, cctx], [ic, ictx]] as const) {
        cv.width = window.innerWidth * d
        cv.height = window.innerHeight * d
        ctx.setTransform(d, 0, 0, d, 0, 0)
      }
    }
    resize()

    const paint = () => {
      raf = 0
      const now = performance.now()
      const W = window.innerWidth, H = window.innerHeight

      while (creases.length && now - creases[0].t > CREASE_LIFE) creases.shift()
      cctx.clearRect(0, 0, W, H)
      cctx.lineCap = 'round'
      cctx.lineJoin = 'round'
      for (const c of creases) {
        const k = 1 - (now - c.t) / CREASE_LIFE
        const e = Math.min(1, (now - c.t) / 140) * k // creases fold in quickly, then relax
        const shade = dark ? '0,0,0' : '60,40,30'
        const light = dark ? '255,240,225' : '255,255,255'
        cctx.beginPath()
        cctx.moveTo(c.pts[0][0], c.pts[0][1])
        for (let i = 1; i < c.pts.length; i++) cctx.lineTo(c.pts[i][0], c.pts[i][1])
        cctx.strokeStyle = `rgba(${shade},${0.05 * e})`
        cctx.lineWidth = c.w * 5
        cctx.stroke()
        cctx.strokeStyle = `rgba(${shade},${0.26 * e})`
        cctx.lineWidth = c.w
        cctx.stroke()
        cctx.save()
        cctx.translate(1.4, 1.4)
        cctx.strokeStyle = `rgba(${light},${(dark ? 0.2 : 0.7) * e})`
        cctx.lineWidth = c.w
        cctx.stroke()
        cctx.restore()
      }

      while (segs.length && now - segs[0].t > INK_LIFE) segs.shift()
      ictx.clearRect(0, 0, W, H)
      ictx.lineCap = 'round'
      ictx.strokeStyle = ink
      const sx = window.scrollX, sy = window.scrollY
      for (const s of segs) {
        const age = now - s.t
        ictx.globalAlpha = age > INK_LIFE - INK_FADE ? Math.max(0, (INK_LIFE - age) / INK_FADE) * 0.85 : 0.85
        ictx.lineWidth = s.w
        ictx.beginPath()
        ictx.moveTo(s.x1 - sx, s.y1 - sy)
        ictx.lineTo(s.x2 - sx, s.y2 - sy)
        ictx.stroke()
      }
      ictx.globalAlpha = 1

      if (creases.length || segs.length || drawing) raf = requestAnimationFrame(paint)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(paint) }

    const crumple = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const r = Math.random() * 80
        let cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r
        let dir = Math.random() * Math.PI * 2
        const pts: [number, number][] = [[cx, cy]]
        const steps = 3 + Math.floor(Math.random() * 3)
        for (let s = 0; s < steps; s++) {
          dir += (Math.random() - 0.5) * 1.3
          const len = 10 + Math.random() * 26
          cx += Math.cos(dir) * len
          cy += Math.sin(dir) * len
          pts.push([cx, cy])
        }
        creases.push({ pts, t: performance.now(), w: 0.8 + Math.random() * 0.9 })
      }
      if (creases.length > 220) creases.splice(0, creases.length - 220)
    }

    const allowed = (t: EventTarget | null) => t instanceof Element && !t.closest(SKIP)

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      if (drawing) {
        const x = e.clientX + window.scrollX, y = e.clientY + window.scrollY
        const speed = Math.hypot(x - px, y - py)
        const w = Math.max(1.4, Math.min(3.4, 3.6 - speed * 0.07))
        pw += (w - pw) * 0.35
        if (speed > 0.5) segs.push({ x1: px, y1: py, x2: x, y2: y, w: pw, t: performance.now() })
        if (segs.length > 5000) segs.splice(0, segs.length - 5000)
        px = x; py = y
        kick()
        return
      }
      if (!allowed(e.target)) return
      if (Math.hypot(e.clientX - lastX, e.clientY - lastY) > 16) {
        lastX = e.clientX; lastY = e.clientY
        crumple(e.clientX, e.clientY, 2)
        kick()
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || e.clientX >= root.clientWidth || !allowed(e.target)) return
      e.preventDefault() // no text selection while writing
      window.getSelection()?.removeAllRanges()
      drawing = true
      px = e.clientX + window.scrollX
      py = e.clientY + window.scrollY
      pw = 2.6
      segs.push({ x1: px, y1: py, x2: px + 0.1, y2: py + 0.1, w: 2.6, t: performance.now() })
      root.classList.add('tt-inking')
      crumple(e.clientX, e.clientY, 6) // the paper creases where you press
      kick()
    }
    const stop = () => { drawing = false; root.classList.remove('tt-inking') }

    const mo = new MutationObserver(theme)
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('pointerup', stop)
    window.addEventListener('blur', stop)
    window.addEventListener('resize', resize)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('blur', stop)
      window.removeEventListener('resize', resize)
      mo.disconnect()
      if (raf) cancelAnimationFrame(raf)
      root.classList.remove('tt-inking')
    }
  }, [active])

  if (!active) return null
  return (
    <>
      <canvas ref={creaseCv} className="paper-creases" aria-hidden="true" />
      <canvas ref={inkCv} className="paper-ink" aria-hidden="true" />
    </>
  )
}
