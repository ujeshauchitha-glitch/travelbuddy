import ModeIcon from '../ModeIcon'
import type { TravelMode } from '../../lib/types'

// The illustrated postage stamps (public/art). Other modes get a plain stamp-style frame.
// The frame is always rendered next to the picture; CSS shows one or the other
// (the "Illustrations: Icons only" setting hides the picture).
const FILE: Partial<Record<TravelMode, string>> = {
  flight: 'plane', train: 'train', metro: 'train', cab: 'car', auto: 'car', bus: 'bus',
}

export default function ModeStamp({ mode, className = '' }: { mode: TravelMode; className?: string }) {
  const file = FILE[mode]
  return (
    <>
      {file && (
        // Decorative: the mode name is always written next to it.
        <img className={`mode-stamp ${className}`.trim()} src={`/art/stamp-${file}.webp`} width={355} height={360}
          alt="" loading="lazy" decoding="async" />
      )}
      <span className={`stamp-fallback ${className}`.trim()} aria-hidden="true"><ModeIcon id={mode} size={30} /></span>
    </>
  )
}
