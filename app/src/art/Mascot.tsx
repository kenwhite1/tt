// The pet mascot. Each non-dog species is a cozy 3D render in
// app/public/mascots/<id>.{webp,png}; the dog stays the original Puppy artwork.
// All share the .pet-img animation classes (breathe / happy / sleep), so the pet
// keeps the same idle bob and celebration bounce whatever species you picked.
import { Puppy, type PuppyState } from './Puppy'

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
