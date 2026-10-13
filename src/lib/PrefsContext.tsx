import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULTS, applyPrefs, haptic, loadPrefs, savePrefs, setHaptics, type Prefs } from './prefs'
import { installFx } from './fx'

interface PrefsApi {
  prefs: Prefs
  set: (patch: Partial<Prefs>) => void
  reset: () => void
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
}

const Ctx = createContext<PrefsApi | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function usePrefs() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePrefs outside PrefsProvider')
  return v
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    applyPrefs(prefs)
    savePrefs(prefs)
    setHaptics(prefs.haptics)
  }, [prefs])

  // Ink ripples and magnetic buttons, unless switched off.
  useEffect(() => {
    if (!prefs.fx || prefs.motion === 'off') return
    return installFx()
  }, [prefs.fx, prefs.motion])

  // One light tap on anything pressable (phones only, and only if enabled).
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (e.pointerType === 'touch' && t?.closest?.('button, .btn, .chip, .switch, a.card, .app-nav a')) haptic()
    }
    document.addEventListener('pointerdown', onDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const set = useCallback((patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch })), [])
  const reset = useCallback(() => setPrefs(DEFAULTS), [])
  const value = useMemo(() => ({ prefs, set, reset, panelOpen, setPanelOpen }), [prefs, set, reset, panelOpen])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
