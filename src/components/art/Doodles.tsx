// Loose hand-drawn marks for the hero. Each one draws itself once on load.
// The Customise panel can turn all of them off (html[data-doodles='off']).

export function DoodleArrow() {
  return (
    <svg className="doodle doodle-draw d-arrow" viewBox="0 0 74 56" aria-hidden="true">
      <path pathLength="1" d="M4 6 C 22 2, 50 10, 58 32 C 61 41, 56 48, 48 46" />
      <path pathLength="1" d="M48 46 L 56 52 M48 46 L 55 38" />
    </svg>
  )
}

export function DoodleStar() {
  return (
    <svg className="doodle doodle-draw d-star" viewBox="0 0 30 30" aria-hidden="true">
      <path pathLength="1" className="fill" d="M15 3 L18 12 L27 12 L20 18 L23 27 L15 21 L7 27 L10 18 L3 12 L12 12 Z" />
    </svg>
  )
}

export function DoodleSquiggle() {
  return (
    <svg className="doodle doodle-draw d-squig" viewBox="0 0 80 20" aria-hidden="true">
      <path pathLength="1" d="M2 12 Q 10 2 18 12 T 34 12 T 50 12 T 66 12 T 78 10" />
    </svg>
  )
}

export function DoodleSpark() {
  return (
    <svg className="doodle doodle-draw d-spark" viewBox="0 0 26 26" aria-hidden="true">
      <path pathLength="1" d="M13 2 V 9 M13 17 V 24 M2 13 H 9 M17 13 H 24 M5 5 L 10 10 M16 16 L 21 21 M21 5 L 16 10 M10 16 L 5 21" />
    </svg>
  )
}
