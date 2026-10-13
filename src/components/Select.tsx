import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption<T extends string> {
  value: T
  label: string
  hint?: string
  disabled?: boolean
}

interface Props<T extends string> {
  value: T | ''
  onChange: (value: T) => void
  options: SelectOption<T>[]
  /** Accessible name when there is no visible label right next to it. */
  ariaLabel?: string
  /** id of a visible element that labels this control. */
  labelledBy?: string
  placeholder?: string
}

/**
 * A dropdown that matches the app instead of the operating system.
 * Follows the ARIA combobox + listbox pattern: arrow keys move, Enter or Space
 * picks, Escape closes, Home/End jump, and typing a letter jumps to a match.
 */
export default function Select<T extends string>({
  value, onChange, options, ariaLabel, labelledBy, placeholder = 'Select…',
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [up, setUp] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const uid = useId()
  const optId = (i: number) => `${uid}-opt-${i}`
  const selected = options.find((o) => o.value === value)

  // Close when clicking or tapping anywhere outside.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Keep the highlighted option visible inside the scrolling list.
  useEffect(() => {
    if (!open || active < 0) return
    list.current?.querySelector<HTMLElement>(`[id="${optId(active)}"]`)?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open])

  const openList = () => {
    // Open upward when the list would run under the bottom edge or the phone tab bar.
    const r = button.current?.getBoundingClientRect()
    if (r) {
      const reserved = window.matchMedia('(max-width: 759px)').matches ? 100 : 16
      const below = window.innerHeight - r.bottom - reserved
      const wanted = Math.min(280, options.length * 52 + 16)
      setUp(below < wanted && r.top > below)
    }
    const i = options.findIndex((o) => o.value === value && !o.disabled)
    setActive(i >= 0 ? i : options.findIndex((o) => !o.disabled))
    setOpen(true)
  }

  const step = (dir: 1 | -1) => {
    if (!options.length) return
    let i = active
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length
      if (!options[i].disabled) { setActive(i); return }
    }
  }

  const choose = (i: number) => {
    const o = options[i]
    if (!o || o.disabled) return
    onChange(o.value)
    setOpen(false)
    button.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); open ? step(1) : openList(); break
      case 'ArrowUp': e.preventDefault(); open ? step(-1) : openList(); break
      case 'Home': if (open) { e.preventDefault(); setActive(options.findIndex((o) => !o.disabled)) } break
      case 'End': if (open) {
        e.preventDefault()
        for (let i = options.length - 1; i >= 0; i--) if (!options[i].disabled) { setActive(i); break }
      } break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) choose(active); else openList()
        break
      case 'Escape': if (open) { e.preventDefault(); setOpen(false) } break
      case 'Tab': setOpen(false); break
      default:
        // Type-ahead: jump to the first option starting with what was typed.
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = Date.now()
          typed.current.text = (now - typed.current.at > 700 ? '' : typed.current.text) + e.key.toLowerCase()
          typed.current.at = now
          const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text))
          if (i >= 0) { if (!open) setOpen(true); setActive(i) }
        }
    }
  }

  return (
    <div className="select" ref={root}>
      <button
        type="button"
        ref={button}
        className={open ? 'select-btn open' : 'select-btn'}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-labelledby={labelledBy}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? '' : 'placeholder'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && (
        <ul className={up ? 'select-list up' : 'select-list'} role="listbox" id={`${uid}-list`} ref={list} aria-label={ariaLabel}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={optId(i)}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              className={['select-opt', i === active ? 'active' : '', o.disabled ? 'disabled' : ''].join(' ').trim()}
              onPointerEnter={() => !o.disabled && setActive(i)}
              onClick={() => choose(i)}
            >
              <span>
                <span className="opt-label">{o.label}</span>
                {o.hint && <span className="opt-hint">{o.hint}</span>}
              </span>
              {o.value === value && <Check size={16} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
