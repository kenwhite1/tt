// The pet — rendered from the app's puppy artwork (app/public/pet.png, transparent).
// Keeps the prior prop/type surface so every call site works unchanged; stage/dyes/outfit
// are accepted but the raster art is fixed.
import type { Stage } from '@shared/constants'

export type PuppyState = 'idle' | 'sleeping' | 'happy' | 'walking'
export type DyePart = 'body' | 'ears' | 'muzzle' | 'cheeks' | 'paws' | 'tail' | 'tummy'
export type OutfitSlot = 'head' | 'face' | 'neck' | 'top' | 'bottom' | 'full' | 'feet' | 'held' | 'back'

interface Props {
  size?: number
  state?: PuppyState
  stage?: Stage
  dyes?: Partial<Record<DyePart, string>>
  outfit?: Partial<Record<OutfitSlot, string>>
}

export function Puppy({ size = 180, state = 'idle' }: Props) {
  const cls = 'pet-img' + (state === 'happy' ? ' happy' : state === 'sleeping' ? ' sleep' : '')
  return (
    <picture>
      <source srcSet="/pet.webp" type="image/webp" />
      <img src="/pet.png" width={size} height={size} alt="" draggable={false} className={cls} />
    </picture>
  )
}
