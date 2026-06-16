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

// Until per-item clothing art exists, equipped outfit slots render as positioned
// emoji stickers over the pet. Works for the dog (raster) and every image species.
// Positions are tuned to the lying-down puppy raster (head in the upper-centre,
// front paws on the rug below). Emoji are anchored at their centre (translate -50%).
const SLOT_STICKER: Partial<Record<OutfitSlot, { emoji: string; top: string; left: string; scale: number }>> = {
  head: { emoji: '\u{1F3A9}', top: '13%', left: '50%', scale: 0.34 },
  face: { emoji: '\u{1F453}', top: '45%', left: '50%', scale: 0.32 },
  neck: { emoji: '\u{1F9E3}', top: '72%', left: '50%', scale: 0.26 },
  top:  { emoji: '\u{1F455}', top: '80%', left: '50%', scale: 0.28 },
  full: { emoji: '\u{1F458}', top: '74%', left: '50%', scale: 0.40 },
  bottom: { emoji: '\u{1FA73}', top: '88%', left: '42%', scale: 0.24 },
  feet: { emoji: '\u{1F45F}', top: '92%', left: '58%', scale: 0.24 },
  held: { emoji: '\u{1F9F8}', top: '80%', left: '81%', scale: 0.28 },
  back: { emoji: '\u{1F392}', top: '37%', left: '11%', scale: 0.28 },
}
export type MascotOutfit = Partial<Record<OutfitSlot, string>>

function OutfitOverlay({ outfit, size }: { outfit?: MascotOutfit; size: number }) {
  if (!outfit) return null
  const slots = (Object.keys(SLOT_STICKER) as OutfitSlot[]).filter(s => outfit[s])
  if (slots.length === 0) return null
  return (
    <>
      {slots.map(slot => {
        const s = SLOT_STICKER[slot]!
        return (
          <span key={slot} aria-hidden style={{
            position: 'absolute', top: s.top, left: s.left, transform: 'translate(-50%, -50%)',
            fontSize: Math.round(size * s.scale), lineHeight: 1, pointerEvents: 'none',
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.18))',
          }}>{s.emoji}</span>
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
        <Puppy size={size} state={state} outfit={outfit} />
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
