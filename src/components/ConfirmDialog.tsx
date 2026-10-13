import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  title: string
  message: string
  /** Extra detail shown under the message, e.g. a list of what will happen. */
  children?: React.ReactNode
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  /** Progress text shown while busy. */
  busyText?: string
  /** If set, the confirm button stays disabled until this exact word is typed. */
  requireText?: string
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * In-app replacement for window.confirm(). The browser popup is blocked in
 * some in-app browsers and after "prevent more dialogs", which made buttons
 * look dead. This is always visible, themed, and keyboard friendly.
 */
export default function ConfirmDialog({
  open, title, message, children, confirmLabel = 'Confirm', danger, busy, busyText, requireText, error, onConfirm, onCancel,
}: Props) {
  const cancel = useRef<HTMLButtonElement>(null)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!open) return
    setTyped('')
    cancel.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null
  const ready = !requireText || typed.trim().toLowerCase() === requireText.toLowerCase()
  return createPortal(
    <div className="modal-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg">
        <h3 id="confirm-title">{title}</h3>
        <p id="confirm-msg" className="muted">{message}</p>
        {children}
        {requireText && (
          <label className="field modal-field">
            <span>Type <strong>{requireText}</strong> to continue</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} disabled={busy} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
          </label>
        )}
        {busy && busyText && <p className="muted small" role="status">{busyText}</p>}
        {error && <p className="error small" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" ref={cancel} onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={danger ? 'btn danger-solid' : 'btn primary'} onClick={onConfirm} disabled={busy || !ready}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
