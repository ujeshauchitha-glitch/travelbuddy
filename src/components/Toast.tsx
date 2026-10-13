import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Check, Info } from 'lucide-react'

type Kind = 'ok' | 'info'
interface ToastItem { id: number; text: string; kind: Kind }
const Ctx = createContext<{ push: (text: string, kind?: Kind) => void } | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useToast outside ToastProvider')
  return v.push
}

let next = 1
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((text: string, kind: Kind = 'ok') => {
    const id = next++
    setItems((l) => [...l.slice(-2), { id, text, kind }])
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3400)
  }, [])
  const value = useMemo(() => ({ push }), [push])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.kind === 'ok' ? <Check size={16} aria-hidden="true" /> : <Info size={16} aria-hidden="true" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
