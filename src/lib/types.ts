import type { Timestamp } from 'firebase/firestore'

export type Visibility = 'campus' | 'travelmates' | 'me'
export type ContactField = 'phone' | 'email' | 'instagram' | 'gender'

export type Gender = 'woman' | 'man' | 'nonbinary' | 'prefer_not'

// Who a trip is open to. Enforced by Firestore rules, not just the UI.
export type Audience = 'anyone' | 'women_only' | 'men_only'

export interface Profile {
  displayName: string
  photoURL?: string
  hometown?: string
  bio?: string
  contactVisibility: Record<ContactField, Visibility>
  travelPref?: Audience // default audience when this person posts a trip
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
  audience?: Audience // missing on very old trips = 'anyone'
  memberIds: string[]
  createdAt: Timestamp
}

export type RequestStatus = 'pending' | 'accepted' | 'declined'
export interface JoinRequest {
  uid: string
  displayName: string
  status: RequestStatus
}

export interface Conversation {
  id: string
  uids: [string, string]
  names: Record<string, string>
  tripId: string
  lastMessage?: string
  lastAt?: Timestamp
}

export interface Message {
  id: string
  senderId: string
  text: string
  createdAt?: Timestamp
}

export type IssueCategory = 'bug' | 'safety' | 'account' | 'feedback'
export interface Issue {
  id: string
  category: IssueCategory
  text: string
  status: 'open' | 'seen' | 'resolved'
  tripId?: string
  createdAt?: Timestamp
}
