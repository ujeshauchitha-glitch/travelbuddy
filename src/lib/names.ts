// Google gives VIT accounts names like "UJESHA SIVARAMAKRISHNAN 26BDS0227".
// For display we drop the registration number and fix ALL CAPS, so people are
// not shown with their reg. no. next to their name. Stored values are untouched.
export function prettyName(raw?: string | null): string {
  if (!raw) return 'Student'
  let n = raw.replace(/[\s\-–—,]*\b\d{2}[A-Za-z]{3}\d{3,5}\b/g, '').replace(/\s+/g, ' ').trim()
  if (!n) return 'Student'
  if (n === n.toUpperCase()) n = n.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase())
  return n
}

export function initials(raw?: string | null): string {
  return prettyName(raw).split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

/** "Vellore, Tamil Nadu, India" -> { main: "Vellore", rest: "Tamil Nadu, India" } */
export function splitPlace(name: string): { main: string; rest: string } {
  const i = name.indexOf(',')
  return i < 0 ? { main: name.trim(), rest: '' } : { main: name.slice(0, i).trim(), rest: name.slice(i + 1).trim() }
}
