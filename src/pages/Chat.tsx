import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import type { Message } from '../lib/types'

export default function Chat() {
  const { cid } = useParams()
  const [params] = useSearchParams()
  const tripId = params.get('trip') ?? ''
  const { user, profile } = useAuth()
  const me = user!.uid
  const other = (cid ?? '').split('_').find((u) => u !== me) ?? ''
  const valid = !!cid && (cid ?? '').split('_').length === 2 && (cid ?? '').split('_').includes(me) && !!other

  const [otherName, setOtherName] = useState('Student')
  const [exists, setExists] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!valid) return
    getDoc(doc(db, 'profiles', other)).then((s) => s.exists() && setOtherName(s.data().displayName)).catch(() => {})
    getDoc(doc(db, 'conversations', cid!)).then((s) => setExists(s.exists())).catch(() => setExists(false))
    return onSnapshot(doc(db, 'profiles', me, 'blocked', other), (s) => setBlocked(s.exists()), () => {})
  }, [valid, cid, other, me])

  useEffect(() => {
    if (!valid || !exists) return
    const q = query(collection(db, 'conversations', cid!, 'messages'), orderBy('createdAt'), limit(300))
    return onSnapshot(q, (s) => setMessages(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)), () => {})
  }, [valid, exists, cid])

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  if (!valid) return <p>This chat link is not valid.</p>

  const send = async (e: FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || blocked) return
    setBusy(true); setError('')
    try {
      const convRef = doc(db, 'conversations', cid!)
      const b = writeBatch(db)
      if (exists) {
        b.update(convRef, { lastMessage: body.slice(0, 80), lastAt: serverTimestamp() })
      } else {
        if (!tripId) throw new Error('Open the chat from a trip to start it.')
        b.set(convRef, {
          uids: [me, other].sort(),
          names: { [me]: profile?.displayName ?? 'Student', [other]: otherName },
          tripId,
          lastMessage: body.slice(0, 80),
          lastAt: serverTimestamp(),
        })
      }
      b.set(doc(collection(db, 'conversations', cid!, 'messages')), { senderId: me, text: body, createdAt: serverTimestamp() })
      await b.commit()
      setExists(true)
      setText('')
    } catch (err) {
      setError(err instanceof Error && err.message.startsWith('Open') ? err.message
        : 'Could not send. You may not be allowed to message this person.')
    }
    setBusy(false)
  }

  const toggleBlock = async () => {
    const ref = doc(db, 'profiles', me, 'blocked', other)
    if (blocked) await deleteDoc(ref)
    else if (confirm(`Block ${otherName}? They will not be able to message you.`)) await setDoc(ref, { createdAt: serverTimestamp() })
  }

  return (
    <div className="chat">
      <div className="row between">
        <h2>{otherName}</h2>
        <div className="row">
          <button className="btn" onClick={toggleBlock}>{blocked ? 'Unblock' : 'Block'}</button>
          <Link className="btn" to={`/app/help?category=safety${tripId ? `&trip=${tripId}` : ''}`}>Report</Link>
        </div>
      </div>
      <div className="bubbles" aria-live="polite">
        {messages.length === 0 && <p className="muted small">Say hello. Do not share money or OTPs in chat.</p>}
        {messages.map((m) => (
          <div key={m.id} className={m.senderId === me ? 'bubble mine' : 'bubble'}>{m.text}</div>
        ))}
        <div ref={bottom} />
      </div>
      {blocked ? <p className="notice">You blocked this person. Unblock to send messages.</p> : (
        <form onSubmit={send} className="composer">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Type a message" aria-label="Message" />
          <button className="btn primary" disabled={busy || !text.trim()}>Send</button>
        </form>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
