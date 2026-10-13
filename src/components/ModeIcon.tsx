import {
  Bike, Bus, Car, CarTaxiFront, Compass, Plane, Ship, TrainFront, TramFront, type LucideIcon,
} from 'lucide-react'
import type { TravelMode } from '../lib/types'

const ICONS: Record<TravelMode, LucideIcon> = {
  cab: CarTaxiFront,
  train: TrainFront,
  flight: Plane,
  bus: Bus,
  auto: Car,
  metro: TramFront,
  ferry: Ship,
  bike: Bike,
  other: Compass,
}

export default function ModeIcon({ id, size = 16 }: { id: TravelMode; size?: number }) {
  const Icon = ICONS[id] ?? Compass
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />
}
