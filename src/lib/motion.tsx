import { Fragment, createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({
  children, delay = 0, className = '', as = 'div',
}: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' | 'p' }) {
  const ref = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { el.classList.add('in'); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.disconnect() }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return createElement(
    as,
    { ref, className: `reveal ${className}`.trim(), style: { '--d': `${delay}ms` } as CSSProperties },
    children,
  )
}

/** Splits a headline into words that slide up one after another on load. */
export function WordReveal({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <Fragment key={i}>
          <span className="w-mask">
            <span className="w" style={{ '--i': i } as CSSProperties}>{w}</span>
          </span>{' '}
        </Fragment>
      ))}
    </>
  )
}

/**
 * Scroll-linked values for a page root, written as CSS variables so React
 * never re-renders on scroll:  --sy (scrollY px) and a `.scrolled` class.
 */
export function useScrollVars(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      el.style.setProperty('--sy', String(Math.round(y)))
      el.classList.toggle('scrolled', y > 8)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [root])
}

/** Sets --p (0..1) on the element as it scrolls through the viewport, and
 *  reports how many children have been reached. */
export function useScrollProgress(ref: React.RefObject<HTMLElement | null>, count: number, onStep: (n: number) => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) { el.style.setProperty('--p', '1'); onStep(count); return }
    let raf = 0
    let last = -1
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.65 - r.top) / r.height))
      el.style.setProperty('--p', p.toFixed(3))
      const n = Math.min(count, Math.ceil(p * count + 0.02))
      if (n !== last) { last = n; onStep(n) }
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
  }, [ref, count, onStep])
}
