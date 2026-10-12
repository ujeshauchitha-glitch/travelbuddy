import type { Audience, ContactField, Gender, TravelMode, Visibility } from './types'

export const MODES: { id: TravelMode; label: string; icon: string; numberLabel?: string; carrierLabel?: string }[] = [
  { id: 'cab', label: 'Cab', icon: '🚕' },
  { id: 'train', label: 'Train', icon: '🚆', numberLabel: 'Train no. / name', carrierLabel: 'Class (optional)' },
  { id: 'flight', label: 'Flight', icon: '✈️', numberLabel: 'Flight no.', carrierLabel: 'Airline' },
  { id: 'bus', label: 'Bus', icon: '🚌', numberLabel: 'Bus no. (optional)', carrierLabel: 'Operator' },
  { id: 'auto', label: 'Auto', icon: '🛺' },
  { id: 'metro', label: 'Metro', icon: '🚇' },
  { id: 'ferry', label: 'Ferry', icon: '⛴️' },
  { id: 'bike', label: 'Bike', icon: '🏍️' },
  { id: 'other', label: 'Other', icon: '🧭' },
]

export const modeInfo = (id: TravelMode) => MODES.find((m) => m.id === id) ?? MODES[MODES.length - 1]

export const VISIBILITY_OPTIONS: { id: Visibility; label: string; hint: string }[] = [
  { id: 'campus', label: 'Everyone on campus', hint: 'Any verified VIT student can see it' },
  { id: 'travelmates', label: 'Only my travel mates', hint: 'People whose trip you hosted or joined' },
  { id: 'me', label: 'Only me', hint: 'Hidden from everyone' },
]

export const DEFAULT_VISIBILITY: Record<ContactField, Visibility> = {
  phone: 'travelmates',
  email: 'me',
  instagram: 'travelmates',
  gender: 'me',
}

export const GENDERS: { id: Gender; label: string }[] = [
  { id: 'woman', label: 'Woman' },
  { id: 'man', label: 'Man' },
  { id: 'nonbinary', label: 'Non-binary' },
  { id: 'prefer_not', label: 'Prefer not to say' },
]

export const AUDIENCES: { id: Audience; label: string; badge?: string }[] = [
  { id: 'anyone', label: 'Anyone on campus' },
  { id: 'women_only', label: 'Women only', badge: '♀ Women only' },
  { id: 'men_only', label: 'Men only', badge: '♂ Men only' },
]

export const audienceBadge = (a?: Audience) => AUDIENCES.find((x) => x.id === a)?.badge

// Mirrors the Firestore rule so the UI can explain *why* someone cannot join.
export const canJoinAudience = (aud: Audience | undefined, gender: Gender | null) =>
  !aud || aud === 'anyone' || (aud === 'women_only' && gender === 'woman') || (aud === 'men_only' && gender === 'man')

// Ids contain only letters and digits, so '_' is a safe separator.
export const convId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`)
