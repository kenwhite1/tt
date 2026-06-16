// The pet mascot. Each non-dog species is a cozy 3D render in
// app/public/mascots/<id>.{webp,png}; the dog stays the original Puppy artwork.
// All share the .pet-img animation classes (breathe / happy / sleep), so the pet
// keeps the same idle bob and celebration bounce whatever species you picked.
import { Puppy, type PuppyState, type OutfitSlot } from './Puppy'
import { Garment } from './Garment'
import { GARMENT_ART, CLOTHING_PALETTE } from './garmentMap'

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

// Equipped items render as procedural vector garments (Garment.tsx) tinted by the item's
// colour, positioned over the pet. `size` is the garment SVG size as a fraction of the pet.
// Positions tuned to the lying-down puppy raster; approximate for the sitting image species.
const SLOT_POS: Partial<Record<OutfitSlot, { top: string; left: string; size: number }>> = {
  back: { top: '40%', left: '14%', size: 0.46 },
  full: { top: '70%', left: '50%', size: 0.66 },
  top:  { top: '78%', left: '50%', size: 0.5 },
  bottom: { top: '88%', left: '44%', size: 0.4 },
  head: { top: '14%', left: '50%', size: 0.56 },
  face: { top: '45%', left: '50%', size: 0.5 },
  neck: { top: '70%', left: '50%', size: 0.42 },
  feet: { top: '92%', left: '58%', size: 0.36 },
  held: { top: '80%', left: '82%', size: 0.44 },
}
// drawing order: back layer first, accessories/held last
const SLOT_ORDER: OutfitSlot[] = ['back', 'full', 'top', 'bottom', 'head', 'face', 'neck', 'feet', 'held']
const SLOT_DEFAULT: Record<string, string> = {
  head: 'hat', face: 'glasses', neck: 'scarf', top: 'shirt', bottom: 'shorts', feet: 'shoes', held: 'ball', back: 'backpack', full: 'dress',
}
export type MascotOutfit = Partial<Record<OutfitSlot, { itemId: string; colorId: string }>>

function OutfitOverlay({ outfit, size }: { outfit?: MascotOutfit; size: number }) {
  if (!outfit) return null
  const slots = SLOT_ORDER.filter(s => outfit[s] && SLOT_POS[s])
  if (slots.length === 0) return null
  return (
    <>
      {slots.map(slot => {
        const pos = SLOT_POS[slot]!
        const entry = outfit[slot]!
        const art = GARMENT_ART[entry.itemId] ?? SLOT_DEFAULT[slot] ?? 'hat'
        const color = CLOTHING_PALETTE[entry.colorId] ?? '#E0A94B'
        const g = Math.round(size * pos.size)
        return (
          <span key={slot} aria-hidden style={{
            position: 'absolute', top: pos.top, left: pos.left, width: g, height: g,
            transform: 'translate(-50%, -50%)', pointerEvents: 'none',
            filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.18))',
          }}>
            <Garment art={art} color={color} size={g} />
          </span>
        )
      })}
    </>
  )
}

// Accepts any string (pet.species from the DB) and falls back to the dog for
// unknown values, so legacy/garbage data never renders a blank pet.
export function Mascot({ species = 'dog', size = 180, state = 'idle', outfit }: { species?: string; size?: number; state?: PuppyState; outfit?: MascotOutfit }) {
  const wrap = { position: 'relative' as const, display: 'inline-block', width: size, height: size }
  if (!IMG_SPECIES.has(species)) {
    return (
      <span style={wrap}>
        <Puppy size={size} state={state} />
        <OutfitOverlay outfit={outfit} size={size} />
      </span>
    )
  }
  const cls = 'pet-img' + (state === 'happy' ? ' happy' : state === 'sleeping' ? ' sleep' : '')
  return (
    <span style={wrap}>
      <picture>
        <source srcSet={`/mascots/${species}.webp`} type="image/webp" />
        <img src={`/mascots/${species}.png`} width={size} height={size} alt="" draggable={false} className={cls} />
      </picture>
      <OutfitOverlay outfit={outfit} size={size} />
    </span>
  )
}
