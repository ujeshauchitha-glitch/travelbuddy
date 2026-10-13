import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Timestamp } from 'firebase/firestore'
import { Check, Copy, RotateCcw, X } from 'lucide-react'
import { usePrefs } from '../lib/PrefsContext'
import { DEFAULTS, OPTIONS, decodePrefs, encodePrefs, type Prefs } from '../lib/prefs'
import { useToast } from './Toast'
import TripCard from './TripCard'
import type { Trip } from '../lib/types'

const SWATCH: Record<(typeof OPTIONS.palette)[number], string> = {
  coral: '#F0644F', sage: '#A8B79A', sky: '#A9C9D6', butter: '#F2D477', plum: '#B99AAE', mint: '#D4E3D0', brick: '#AC4038',
}

function Seg<K extends keyof Prefs>({ label, hint, field, options }: {
  label: string; hint?: string; field: K; options: { id: Prefs[K]; label: string }[]
}) {
  const { prefs, set } = usePrefs()
  return (
    <fieldset className="cz-group">
      <legend>{label}</legend>
      {hint && <p className="cz-hint">{hint}</p>}
      <div className="seg" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const on = prefs[field] === o.id
          return (
            <button key={String(o.id)} type="button" role="radio" aria-checked={on} className={on ? 'seg-btn on' : 'seg-btn'}
              onClick={() => set({ [field]: o.id } as unknown as Partial<Prefs>)}>
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Toggle({ label, hint, field }: { label: string; hint?: string; field: 'doodles' | 'haptics' | 'fx' }) {
  const { prefs, set } = usePrefs()
  return (
    <label className="switch cz-switch">
      <input type="checkbox" checked={prefs[field]} onChange={(e) => set({ [field]: e.target.checked } as Partial<Prefs>)} />
      <span className="track" aria-hidden="true" />
      <span>{label}{hint && <small className="cz-hint"> {hint}</small>}</span>
    </label>
  )
}

const SAMPLE: Trip = {
  id: 'preview', hostId: 'p', hostName: 'Ananya Rao', mode: 'train', number: '12607', costNote: 'Split equally',
  origin: { name: 'Katpadi Junction' }, destination: { name: 'Chennai Central' },
  departAt: Timestamp.fromMillis(Date.now() + 2 * 86_400_000), spotsOpen: 3, luggageFriendly: true,
  audience: 'women_only', memberIds: ['p'], createdAt: Timestamp.now(),
}

export default function Customize() {
  const { prefs, set, reset, panelOpen, setPanelOpen } = usePrefs()
  const toast = useToast()
  const close = useRef<HTMLButtonElement>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const myCode = encodePrefs(prefs)

  useEffect(() => {
    if (!panelOpen) return
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panelOpen, setPanelOpen])

  if (!panelOpen) return null

  const copy = async () => {
    try { await navigator.clipboard.writeText(myCode); toast('Theme code copied') }
    catch { toast('Select the code and copy it by hand', 'info') }
  }
  const apply = () => {
    const p = decodePrefs(code)
    if (!p) { setCodeError('That does not look like a theme code.'); return }
    setCodeError(''); set(p); setCode(''); toast('Theme applied')
  }
  const isDefault = JSON.stringify(prefs) === JSON.stringify(DEFAULTS)

  return createPortal(
    <div className="cz-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) setPanelOpen(false) }}>
      <aside className="cz" role="dialog" aria-label="Customise the look">
        <header className="cz-head">
          <div>
            <h3>Customise</h3>
            <p className="cz-hint">Changes apply instantly and are remembered on this device.</p>
          </div>
          <button type="button" ref={close} className="icon-btn" onClick={() => setPanelOpen(false)} aria-label="Close"><X size={18} aria-hidden="true" /></button>
        </header>

        <div className="cz-preview" aria-hidden="true"><TripCard trip={SAMPLE} /></div>

        <section>
          <h4>Look</h4>
          <Seg label="Theme" field="theme" options={[{ id: 'system', label: 'System' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} />
          <fieldset className="cz-group">
            <legend>Accent colour</legend>
            <div className="swatches" role="radiogroup" aria-label="Accent colour">
              {OPTIONS.palette.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={prefs.palette === c} aria-label={c}
                  className={prefs.palette === c ? 'swatch on' : 'swatch'} style={{ background: SWATCH[c] }} onClick={() => set({ palette: c })}>
                  {prefs.palette === c && <Check size={16} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </fieldset>
          <Seg label="Paper" hint="The texture behind the page." field="texture"
            options={[{ id: 'paper', label: 'Paper' }, { id: 'grain', label: 'Grain' }, { id: 'plain', label: 'Plain' }, { id: 'dots', label: 'Dots' }, { id: 'hatch', label: 'Hatch' }, { id: 'lined', label: 'Lined' }, { id: 'grid', label: 'Grid' }]} />
          <Seg label="Line style" hint="Sketchy is uneven and hand-drawn." field="line" options={[{ id: 'clean', label: 'Clean' }, { id: 'sketchy', label: 'Sketchy' }]} />
        </section>

        <section>
          <h4>Shape</h4>
          <Seg label="Edges" hint="Outline weight and the offset shadow." field="edge" options={[{ id: 'soft', label: 'Soft' }, { id: 'bold', label: 'Bold' }, { id: 'flat', label: 'Flat' }]} />
          <Seg label="Corners" field="corners" options={[{ id: 'square', label: 'Square' }, { id: 'soft', label: 'Soft' }, { id: 'pill', label: 'Pill' }]} />
          <Seg label="Spacing" field="density" options={[{ id: 'cozy', label: 'Cozy' }, { id: 'compact', label: 'Compact' }]} />
        </section>

        <section>
          <h4>Comfort</h4>
          <Seg label="Text size" field="size" options={[{ id: 's', label: 'Small' }, { id: 'm', label: 'Medium' }, { id: 'l', label: 'Large' }]} />
          <Seg label="Motion" hint="Calm keeps fades; Off stops all animation." field="motion" options={[{ id: 'full', label: 'Full' }, { id: 'calm', label: 'Calm' }, { id: 'off', label: 'Off' }]} />
          <Seg label="Illustrations" field="art" options={[{ id: 'stamps', label: 'Stamps' }, { id: 'icons', label: 'Icons only' }]} />
          <Seg label="Cursor" hint="A pencil that leaves a faint trail. Mouse and trackpad only." field="cursor" options={[{ id: 'trail', label: 'Pencil + trail' }, { id: 'pencil', label: 'Pencil' }, { id: 'system', label: 'System' }]} />
          <Toggle label="Interactive effects" hint="(ink ripples, magnetic buttons)" field="fx" />
          <Toggle label="Hand-drawn doodles" field="doodles" />
          <Toggle label="Tap vibration" hint="(phones)" field="haptics" />
        </section>

        <section>
          <h4>Share your look</h4>
          <label className="field"><span>Your theme code</span>
            <div className="code-row"><input readOnly value={myCode} onFocus={(e) => e.currentTarget.select()} aria-label="Your theme code" />
              <button type="button" className="btn sm" onClick={copy}><Copy size={15} aria-hidden="true" /> Copy</button></div>
          </label>
          <label className="field"><span>Use a friend&rsquo;s code</span>
            <div className="code-row"><input value={code} onChange={(e) => { setCode(e.target.value); setCodeError('') }} placeholder="Paste a TT1.… code" />
              <button type="button" className="btn sm" onClick={apply} disabled={!code.trim()}>Apply</button></div>
          </label>
          {codeError && <p className="error small" role="alert">{codeError}</p>}
        </section>

        <footer className="cz-foot">
          <button type="button" className="btn" onClick={() => { reset(); toast('Back to the defaults', 'info') }} disabled={isDefault}>
            <RotateCcw size={16} aria-hidden="true" /> Reset everything
          </button>
          <button type="button" className="btn primary" onClick={() => setPanelOpen(false)}>Done</button>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
