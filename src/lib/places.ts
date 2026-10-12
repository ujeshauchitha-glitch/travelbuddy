import type { Place } from './types'

// Photon (OpenStreetMap-based, built for search-as-you-type). Any place in the
// world works; if the search finds nothing the typed text is still accepted.
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const res = await fetch(`https://photon.komoot.io/api/?limit=6&q=${encodeURIComponent(q)}`, { signal })
  if (!res.ok) return []
  const data = await res.json()
  const seen = new Set<string>()
  const out: Place[] = []
  for (const f of data.features ?? []) {
    const p = f.properties ?? {}
    const name = [p.name, p.city !== p.name ? p.city : undefined, p.state, p.country]
      .filter(Boolean)
      .join(', ')
    if (!name || seen.has(name)) continue
    seen.add(name)
    const [lng, lat] = f.geometry?.coordinates ?? []
    out.push({ name, lat, lng })
  }
  return out
}

export const samePlace = (a: Place, b: Place) =>
  a.name.trim().toLowerCase() === b.name.trim().toLowerCase()
