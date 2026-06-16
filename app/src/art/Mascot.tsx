// The pet mascot. Each non-dog species is a cozy 3D render in
// app/public/mascots/<id>.{webp,png}; the dog stays the original Puppy artwork.
// All share the .pet-img animation classes (breathe / happy / sleep), so the pet
// keeps the same idle bob and celebration bounce whatever species you picked.
import { Puppy, type PuppyState, type OutfitSlot } from './Puppy'

export type Species = 'dog' | 'turtle' | 'owl' | 'elephant' | 'cat' | 'alpaca'

export const MASCOTS: { id: Species; ru: string; emoji: string; blurb: string }[] = [
  { id: 'dog', ru: 'Щенок', emoji: '🐶', blurb: 'Тёплый, преданный и любопытный' },
  { id: 'cat', ru: 'Котёнок', emoji: '🐱', blurb: 'Ласковый, спокойный и независимый' },
  { id: 'owl', ru: 'Совёнок', emoji: '🦉', blurb: 'Мудрый, внимательный и чуткий' },
  { id: 'turtle', ru: 'Черепашка', emoji: '🐢', blurb: 'Неспешная, надёжная и стойкая' },
  { id: 'elephant', ru: 'Слонёнок', emoji: '🐘', blurb: 'Добрый, чуткий и заботливый' },
  { id: 'alpaca', ru: 'Альпака', emoji: '🦙', blurb: 'Мягкая, дружелюбная и забавная' },
]

const IMG_SPECIES = new Set(['cat', 'owl', 'turtle', 'elephant', 'alpaca'])

// Warm the browser cache for every image-based mascot so the onboarding species
// picker paints instantly instead of fetching ~25KB webps the moment it mounts.
// Idempotent; safe to call repeatedly. `index.html` already preloads the dog.
let mascotsPreloaded = false
export function preloadMascots(): void {
  if (mascotsPreloaded || typeof Image === 'undefined') return
  mascotsPreloaded = true
  const supportsWebp = document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp')
  for (const id of IMG_SPECIES) {
    const img = new Image()
    img.decoding = 'async'
    img.src = `/mascots/${id}.${supportsWebp ? 'webp' : 'png'}`
  }
}

// Accepts any string (pet.species from the DB) and falls back to the dog for
// unknown values, so legacy/garbage data never renders a blank pet.
export function Mascot({ species = 'dog', size = 180, state = 'idle' }: { species?: string; size?: number; state?: PuppyState }) {
  if (!IMG_SPECIES.has(species)) return <Puppy size={size} state={state} />
  const cls = 'pet-img' + (state === 'happy' ? ' happy' : state === 'sleeping' ? ' sleep' : '')
  return (
    <picture>
      <source srcSet={`/mascots/${species}.webp`} type="image/webp" />
      <img src={`/mascots/${species}.png`} width={size} height={size} alt="" draggable={false} className={cls} />
    </picture>
  )
}
