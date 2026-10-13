import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import type { Trip } from '../lib/types'
import TripCard from '../components/TripCard'

export default function MyTrips() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'trips'), where('memberIds', 'array-contains', user!.uid), orderBy('departAt', 'desc'))
    return onSnapshot(q, (s) => {
      setTrips(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Trip))
      setLoading(false)
    }, () => setLoading(false))
  }, [user])

  return (
    <>
      <h2>My trips</h2>
      {loading ? <p className="muted">Loading…</p> : trips.length === 0
        ? <div className="card empty"><p>You have not hosted or joined any trips yet.</p></div>
        : <div className="trip-grid">{trips.map((t) => <TripCard key={t.id} trip={t} />)}</div>}
    </>
  )
}
