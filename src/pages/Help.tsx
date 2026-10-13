import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import type { Issue, IssueCategory } from '../lib/types'
import Select from '../components/Select'

const CATEGORIES: { id: IssueCategory; label: string }[] = [
  { id: 'safety', label: 'Safety concern or report a person/trip' },
  { id: 'bug', label: 'Something is broken' },
  { id: 'account', label: 'Account or privacy help' },
  { id: 'feedback', label: 'Idea or feedback' },
]

const FAQ: { q: string; a: string }[] = [
  { q: 'Who can see my phone, email, Instagram and gender?',
    a: 'Only the people you allow, per field: everyone on campus, only your travel mates (the host and anyone they accepted onto a trip you share), or only you. Change it any time on your Profile. The server enforces it, so it cannot be bypassed by editing the page.' },
  { q: 'How do women-only trips work?',
    a: 'When posting, a woman can choose “Women only”. The server then refuses join requests from anyone whose profile gender is not woman. Gender is self-declared, so it is a strong filter, not a guarantee. Always use the safety tips below and report anything that feels wrong.' },
  { q: 'What does “travel mates” mean?',
    a: 'Two people become travel mates when a host accepts a join request. That unlocks the contact details each of them chose to share with travel mates.' },
  { q: 'Can someone message me out of nowhere?',
    a: 'Chats can only start from a trip, between the host and someone interested in it. You can block anyone from inside the chat, and blocked people can no longer message you.' },
  { q: 'Is this an official VIT service?',
    a: 'No. Travel Tinder is a student-built project. Sign-in is limited to @vitstudent.ac.in Google accounts so you only meet fellow students.' },
  { q: 'Who reads my reports?',
    a: 'Reports go to the project owner and are visible only to you and them. If you are in danger, call the emergency numbers above first.' },
]

export default function Help() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [category, setCategory] = useState<IssueCategory>((params.get('category') as IssueCategory) || 'feedback')
  const tripId = params.get('trip') ?? ''
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [mine, setMine] = useState<Issue[]>([])

  useEffect(() => {
    const q = query(collection(db, 'issues'), where('authorId', '==', user!.uid), orderBy('createdAt', 'desc'), limit(20))
    return onSnapshot(q, (s) => setMine(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Issue)), () => {})
  }, [user])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setDone(false)
    try {
      await addDoc(collection(db, 'issues'), {
        authorId: user!.uid,
        category,
        text: text.trim(),
        status: 'open',
        ...(tripId ? { tripId } : {}),
        createdAt: serverTimestamp(),
      })
      setText(''); setDone(true)
    } catch {
      setError('Could not send. Please try again.')
    }
    setBusy(false)
  }

  return (
    <>
      <h2>Help &amp; safety</h2>
      <p className="muted small"><Link to="/about">About Travel Tinder and how your data is handled</Link></p>

      <div className="card sos">
        <strong>In danger or an emergency?</strong>
        <ul className="plain">
          <li>Emergency (India): <a href="tel:112">112</a></li>
          <li>Women helpline: <a href="tel:181">181</a> · Women in distress: <a href="tel:1091">1091</a></li>
        </ul>
      </div>

      <h3>Staying safe on shared trips</h3>
      <ul className="tips">
        <li>Chat in the app first and meet in a public, well-lit place.</li>
        <li>Share your trip details and live location with a friend or family member.</li>
        <li>Check the cab or vehicle number and driver before you get in.</li>
        <li>Never share money, OTPs or ID photos in chat.</li>
        <li>Trust your gut. You can leave a trip, block someone, or report them at any time.</li>
      </ul>

      <h3>Common questions</h3>
      {FAQ.map((f) => (
        <details key={f.q} className="card faq"><summary>{f.q}</summary><p>{f.a}</p></details>
      ))}

      <h3>Report a problem or send feedback</h3>
      <form onSubmit={submit} className="form">
        <div className="field"><span id="category-label">What is this about?</span>
          <Select<IssueCategory>
            value={category}
            onChange={setCategory}
            labelledBy="category-label"
            options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          /></div>
        {tripId && <p className="muted small">This report will be linked to the trip you came from.</p>}
        <label className="field"><span>Details</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} required
            placeholder="What happened? Include names, places and times if you can." /></label>
        {error && <p className="error" role="alert">{error}</p>}
        {done && <p className="ok" role="status">Thanks, we received it.</p>}
        <button className="btn primary" disabled={busy || !text.trim()}>{busy ? 'Sending…' : 'Send'}</button>
      </form>

      {mine.length > 0 && (
        <>
          <h3>Your reports</h3>
          {mine.map((i) => (
            <div key={i.id} className="card">
              <div className="row between"><span className="chip">{i.category}</span><span className="chip">{i.status}</span></div>
              <p>{i.text}</p>
            </div>
          ))}
        </>
      )}
    </>
  )
}
