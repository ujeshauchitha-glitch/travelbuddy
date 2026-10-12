import type { Timestamp } from 'firebase/firestore'

export type Visibility = 'campus' | 'travelmates' | 'me'
export type ContactField = 'phone' | 'email' | 'instagram'

export interface Profile {
  displayName: string
  photoURL?: string
  hometown?: string
  bio?: string
  contactVisibility: Record<ContactField, Visibility>
  createdAt?: Timestamp
}

export type TravelMode =
  | 'cab' | 'train' | 'flight' | 'bus' | 'auto' | 'metro' | 'ferry' | 'bike' | 'other'

export interface Place {
  name: string // always present, free text or picked from search
  lat?: number
  lng?: number
}

export interface Trip {
  id: string
  hostId: string
  hostName: string
  mode: TravelMode
  modeLabel?: string // only for mode === 'other'
  origin: Place
  destination: Place
  pickupNote?: string
  departAt: Timestamp
  spotsOpen: number
  carrier?: string // airline, railway, bus operator...
  number?: string // flight / train / bus number
  costNote?: string
  notes?: string
  luggageFriendly: boolean
  memberIds: string[]
  createdAt: Timestamp
}

export type RequestStatus = 'pending' | 'accepted' | 'declined'
export interface JoinRequest {
  uid: string
  displayName: string
  status: RequestStatus
}
