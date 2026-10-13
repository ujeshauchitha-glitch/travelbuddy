import { useEffect, useRef, useState } from 'react'
import { usePrefs } from '../lib/PrefsContext'

// What counts as "something you can press", and where the real text cursor must stay.
const INTERACTIVE = 'a[href], button, [role="button"], [role="radio"], summary, label.switch, .chip, a.card, .select-opt, [data-magnet]'
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'

/**
 * A pencil for a cursor. It tilts with your hand, leaves a faint graphite trail that
 * fades, draws a hand-made ring round anything you can press, and bursts a few
 * pencil strokes when you click. Only on devices with a real pointer, never when
 * motion is off, and it can be switched to a plain pencil or the system cursor.
 */
export default function Cursor() {
  const { prefs } = usePrefs()
  const [fine, setFine] = useState(() => window.matchMedia('(pointer: fine)').matches)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const active = fine && prefs.cursor !== 'system' && prefs.motion !== 'off' && !reduced
  const showTrail = active && prefs.cursor === 'trail' && prefs.motion === 'full'
  const pencil = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const on = () => setFine(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const p = pencil.current
    const rg = ring.current
    if (!p || !rg) return
    root.classList.add('tt-cursor')

    const cv = canvas.current
    const ctx = cv?.getContext('2d') ?? null
    const pts: { x: number; y: number; t: number; j: number }[] = []
    let x = -100, y = -100, vx = 0, tilt = 0, raf = 0, visible = false, hot = false
    let ink = getComputedStyle(root).getPropertyValue('--text').trim() || '#242126'

    const resize = () => {
      if (!cv) return
      const d = window.devicePixelRatio || 1
      cv.width = window.innerWidth * d
      cv.height = window.innerHeight * d
      ctx?.setTransform(d, 0, 0, d, 0, 0)
    }
    resize()

    const draw = () => {
      if (!ctx) return
      const now = performance.now()
      while (pts.length && now - pts[0].t > 650) pts.shift()
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      if (pts.length < 2) return
      ctx.lineCap = 'round'
      ctx.strokeStyle = ink
      for (let pass = 0; pass < 2; pass++) { // a firm line and a faint second pass beside it
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i]
          const life = 1 - (now - b.t) / 650
          ctx.globalAlpha = Math.max(0, life) * (pass ? 0.2 : 0.5)
          ctx.lineWidth = pass ? 1 : 1.7
          ctx.beginPath()
          ctx.moveTo(a.x + (pass ? a.j : 0), a.y - (pass ? a.j : 0))
          ctx.lineTo(b.x + (pass ? b.j : 0), b.y - (pass ? b.j : 0))
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
    }

    const frame = () => {
      raf = 0
      tilt += (Math.max(-16, Math.min(16, vx * 0.7)) - tilt) * 0.22
      vx *= 0.82
      p.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`
      rg.style.transform = `translate3d(${x - 23}px, ${y - 23}px, 0)`
      draw()
      if (Math.abs(vx) > 0.05 || Math.abs(tilt) > 0.2 || pts.length) raf = requestAnimationFrame(frame)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame) }

    const burst = (cx: number, cy: number) => {
      const el = document.createElement('div')
      el.className = 'burst'
      el.style.left = `${cx}px`
      el.style.top = `${cy}px`
      el.innerHTML = '<svg viewBox="-20 -20 40 40" width="40" height="40" aria-hidden="true"><path d="M0 -8 L0 -17 M8 0 L17 0 M0 8 L0 17 M-8 0 L-17 0 M6 -6 L12 -12 M6 6 L12 12 M-6 6 L-12 12 M-6 -6 L-12 -12"/></svg>'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 520)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      vx = e.clientX - x
      x = e.clientX
      y = e.clientY
      if (!visible) { visible = true; p.classList.add('on') }
      const t = e.target as Element | null
      const overText = !!t?.closest?.(TEXT)
      p.classList.toggle('text', overText)
      const nowHot = !!t?.closest?.(INTERACTIVE) && !overText
      if (nowHot !== hot) {
        hot = nowHot
        p.classList.toggle('hot', hot)
        rg.classList.toggle('on', hot)
        if (hot) { rg.classList.remove('draw'); void rg.offsetWidth; rg.classList.add('draw') }
      }
      if (showTrail) {
        pts.push({ x, y, t: performance.now(), j: (Math.random() - 0.5) * 1.8 })
        if (pts.length > 70) pts.shift()
      }
      kick()
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      p.classList.add('press')
      burst(e.clientX, e.clientY)
    }
    const onUp = () => p.classList.remove('press')
    const onLeave = () => { visible = false; p.classList.remove('on'); rg.classList.remove('on') }
    const onEnter = () => { if (x > 0) { visible = true; p.classList.add('on') } }

    // keep the trail ink matching the theme
    const mo = new MutationObserver(() => { ink = getComputedStyle(root).getPropertyValue('--text').trim() || ink })
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    window.addEventListener('resize', resize)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      window.removeEventListener('resize', resize)
      mo.disconnect()
      if (raf) cancelAnimationFrame(raf)
      root.classList.remove('tt-cursor')
    }
  }, [active, showTrail])

  if (!active) return null
  return (
    <>
      {showTrail && <canvas ref={canvas} className="trail" aria-hidden="true" />}
      <div ref={ring} className="cursor-ring" aria-hidden="true">
        <svg viewBox="0 0 46 46" width="46" height="46"><path pathLength="1" d="M23 3 C 35 2, 44 11, 43 24 C 42 36, 31 44, 20 43 C 8 42, 2 32, 4 21 C 6 11, 14 5, 25 5" /></svg>
      </div>
      <div ref={pencil} className="pencil" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="38" height="38">
          <path d="M2 2 L12 6 L6 12 Z" fill="#E6B796" stroke="#242126" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M2 2 L5.2 3.3 L3.3 5.2 Z" fill="#242126" />
          <path d="M12 6 L35 29 L29 35 L6 12 Z" fill="#F2D477" stroke="#242126" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M16 10 L31 25" stroke="#242126" strokeWidth="0.9" opacity="0.4" />
          <path d="M35 29 L38.6 32.6 L32.6 38.6 L29 35 Z" fill="#F0644F" stroke="#242126" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M31.4 27.4 L36.6 32.6 M27.4 31.4 L32.6 36.6" stroke="#242126" strokeWidth="1.2" />
        </svg>
      </div>
    </>
  )
}
