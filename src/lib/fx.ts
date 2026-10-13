// Playful button behaviour, installed once for the whole page:
//  - ink ripples that spread from exactly where you press
//  - "magnetic" buttons (marked data-magnet) that lean toward your pointer
// Both switch off with the "Interactive effects" setting or when motion is off.

const PRESSABLE = '.btn, .pass, .chip, .seg-btn, .step-btn'

export function installFx(): () => void {
  const fine = window.matchMedia('(pointer: fine)').matches

  const onDown = (e: PointerEvent) => {
    const t = (e.target as Element | null)?.closest<HTMLElement>(PRESSABLE)
    if (!t || (t as HTMLButtonElement).disabled) return
    let box = t.querySelector<HTMLElement>(':scope > .btn-fx')
    if (!box) {
      box = document.createElement('span')
      box.className = 'btn-fx'
      box.setAttribute('aria-hidden', 'true')
      t.appendChild(box)
    }
    const r = t.getBoundingClientRect()
    const d = Math.max(r.width, r.height) * 2.2
    const s = document.createElement('span')
    s.className = 'ink-ripple'
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`
    box.appendChild(s)
    setTimeout(() => s.remove(), 650)
  }

  let leaning: HTMLElement | null = null
  const release = () => {
    if (leaning) { leaning.style.translate = ''; leaning.style.scale = ''; leaning = null }
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    let best: HTMLElement | null = null
    let bestD = 80 // only buttons within 80px feel the pull
    document.querySelectorAll<HTMLElement>('[data-magnet]').forEach((el) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const dx = Math.max(Math.abs(e.clientX - cx) - r.width / 2, 0)
      const dy = Math.max(Math.abs(e.clientY - cy) - r.height / 2, 0)
      const d = Math.hypot(dx, dy)
      if (d < bestD) { bestD = d; best = el }
    })
    const el = best as HTMLElement | null
    if (el !== leaning) release()
    if (!el) return
    const r = el.getBoundingClientRect()
    const mx = Math.max(-9, Math.min(9, (e.clientX - (r.left + r.width / 2)) * 0.14))
    const my = Math.max(-7, Math.min(7, (e.clientY - (r.top + r.height / 2)) * 0.2))
    el.style.translate = `${mx}px ${my}px`
    el.style.scale = '1.035'
    leaning = el
  }

  document.addEventListener('pointerdown', onDown, { passive: true })
  if (fine) document.addEventListener('pointermove', onMove, { passive: true })
  return () => {
    document.removeEventListener('pointerdown', onDown)
    document.removeEventListener('pointermove', onMove)
    release()
  }
}
