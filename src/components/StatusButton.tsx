import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check, LoaderCircle } from 'lucide-react'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  busy?: boolean
  done?: boolean
  children: ReactNode
  busyLabel?: string
  doneLabel?: string
}

/** A button that shows what is happening: a spinner while working, a check when it worked. */
export default function StatusButton({ busy, done, children, busyLabel, doneLabel, className = 'btn primary', disabled, ...rest }: Props) {
  const state = busy ? 'is-busy' : done ? 'is-done' : ''
  return (
    <button {...rest} className={`${className} status-btn ${state}`.trim()} disabled={disabled || busy} aria-live="polite">
      <span className="sb-icon" aria-hidden="true">
        {busy ? <LoaderCircle size={17} className="spin" /> : done ? <Check size={17} className="pop" /> : null}
      </span>
      <span>{busy ? (busyLabel ?? children) : done ? (doneLabel ?? children) : children}</span>
    </button>
  )
}
