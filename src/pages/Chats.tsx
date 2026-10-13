import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import type { Conversation } from '../lib/types'

export default function Chats() {
  const { user } = useAuth()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'conversations'), where('uids', 'array-contains', user!.uid), orderBy('lastAt', 'desc'))
    return onSnapshot(q, (s) => {
      setConvs(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation))
      setLoading(false)
    }, () => setLoading(false))
  }, [user])

  return (
    <>
      <h2>Messages</h2>
      <p className="muted small">Private chats with people from trips. Only the two of you can read them.</p>
      {loading ? <p className="muted">Loading…</p> : convs.length === 0 ? (
        <div className="card empty"><p>No chats yet. Open a trip and tap “Ask a question” to start one.</p></div>
      ) : convs.map((c) => {
        const other = c.uids.find((u) => u !== user!.uid) ?? ''
        return (
          <Link key={c.id} to={`/app/chat/${c.id}?trip=${c.tripId}`} className="card">
            <strong>{c.names?.[other] ?? 'Student'}</strong>
            <div className="muted small">{c.lastMessage}</div>
          </Link>
        )
      })}
    </>
  )
}
