import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * In-app replacement for window.confirm(). The browser popup is blocked in
 * some in-app browsers and after "prevent more dialogs", which made buttons
 * look dead. This is always visible, themed, and keyboard friendly.
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onCancel,
}: Props) {
  const cancel = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancel.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null
  return createPortal(
    <div className="modal-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg">
        <h3 id="confirm-title">{title}</h3>
        <p id="confirm-msg" className="muted">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn" ref={cancel} onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={danger ? 'btn danger-solid' : 'btn primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
