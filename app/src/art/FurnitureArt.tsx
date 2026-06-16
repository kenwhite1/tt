// Procedural vector furniture — a cute color-tinted SVG per archetype, layered into the
// crafted RoomScene (additive: keeps the hand-drawn room, adds equipped pieces in free areas).
import type { JSX } from 'react'
import { shade } from './hash'

const LINE = '#3a2c1c'
interface K { base: string; dark: string; light: string }
const cols = (c: string): K => ({ base: c, dark: shade(c, 0.74), light: shade(c, 1.24) })

const ART: Record<string, (k: K) => JSX.Element> = {
  // bed
  basket: ({ base, dark, light }) => <>
    <path d="M26 50 L74 50 L67 82 L33 82 Z" fill={base} />
    <ellipse cx="50" cy="50" rx="24" ry="7" fill={light} />
    <path d="M38 56 V78 M50 56 V80 M62 56 V78" stroke={dark} strokeWidth="2" />
  </>,
  cushion: ({ base, dark, light }) => <>
    <ellipse cx="50" cy="62" rx="32" ry="21" fill={base} />
    <ellipse cx="50" cy="58" rx="25" ry="14" fill={light} />
    <circle cx="50" cy="60" r="3" fill={dark} />
  </>,
  mat: ({ base, light }) => <>
    <ellipse cx="50" cy="64" rx="36" ry="13" fill={base} />
    <ellipse cx="50" cy="62" rx="27" ry="8" fill={light} />
  </>,
  bench: ({ base, dark }) => <>
    <rect x="22" y="52" width="56" height="11" rx="3" fill={base} />
    <rect x="28" y="63" width="6" height="18" fill={dark} /><rect x="66" y="63" width="6" height="18" fill={dark} />
  </>,
  // rug
  oval_rug: ({ base, light }) => <>
    <ellipse cx="50" cy="58" rx="42" ry="19" fill={base} />
    <ellipse cx="50" cy="58" rx="31" ry="13" fill={light} />
    <ellipse cx="50" cy="58" rx="18" ry="7" fill={base} />
  </>,
  round_rug: ({ base, light }) => <>
    <ellipse cx="50" cy="58" rx="36" ry="17" fill={base} />
    <ellipse cx="50" cy="58" rx="24" ry="11" fill={light} />
  </>,
  runner: ({ base, light }) => <>
    <rect x="12" y="50" width="76" height="18" rx="8" fill={base} />
    <rect x="18" y="54" width="64" height="10" rx="5" fill={light} />
  </>,
  // clock
  round_clock: ({ base }) => <>
    <circle cx="50" cy="48" r="25" fill={base} /><circle cx="50" cy="48" r="18" fill="#fff" />
    <path d="M50 48 L50 35 M50 48 L60 53" stroke={LINE} strokeWidth="2.6" /><circle cx="50" cy="48" r="2.2" fill={LINE} />
  </>,
  cuckoo: ({ base, dark }) => <>
    <path d="M30 30 L50 16 L70 30 L70 66 L30 66 Z" fill={base} />
    <circle cx="50" cy="44" r="13" fill="#fff" /><path d="M50 44 V35 M50 44 L57 47" stroke={LINE} strokeWidth="2" />
    <path d="M43 66 L43 78 M57 66 L57 78" stroke={dark} strokeWidth="2.5" />
  </>,
  square_clock: ({ base }) => <>
    <rect x="27" y="25" width="46" height="46" rx="6" fill={base} /><circle cx="50" cy="48" r="15" fill="#fff" />
    <path d="M50 48 V37 M50 48 L58 51" stroke={LINE} strokeWidth="2" />
  </>,
  // wall_item
  picture: ({ base, dark, light }) => <>
    <rect x="24" y="26" width="52" height="42" rx="3" fill={dark} /><rect x="29" y="31" width="42" height="32" fill={light} />
    <path d="M32 58 L44 44 L52 52 L62 40 L68 50 L68 61 L32 61 Z" fill={base} />
  </>,
  mirror: ({ dark }) => <>
    <ellipse cx="50" cy="46" rx="21" ry="27" fill={dark} /><ellipse cx="50" cy="46" rx="16" ry="22" fill="#cfe7f0" />
    <path d="M44 30 Q39 40 42 54" stroke="#fff" strokeWidth="3" opacity="0.6" fill="none" />
  </>,
  shelf: ({ base, dark, light }) => <>
    <rect x="22" y="54" width="56" height="6" rx="2" fill={base} />
    <rect x="30" y="38" width="8" height="16" fill={dark} /><circle cx="52" cy="47" r="7" fill={light} /><rect x="62" y="40" width="8" height="14" fill={dark} />
  </>,
  garland: ({ base, dark, light }) => <>
    <path d="M18 40 Q50 58 82 40" fill="none" stroke={dark} strokeWidth="2" />
    <circle cx="30" cy="47" r="5" fill={base} /><circle cx="44" cy="52" r="5" fill={light} /><circle cx="56" cy="52" r="5" fill={base} /><circle cx="70" cy="47" r="5" fill={light} />
  </>,
  plaque: ({ base, light }) => <>
    <rect x="27" y="32" width="46" height="32" rx="6" fill={base} /><rect x="33" y="38" width="34" height="20" rx="3" fill={light} />
  </>,
  // dresser_item
  plant: ({ base, dark, light }) => <>
    <path d="M40 56 L60 56 L57 80 L43 80 Z" fill={dark} />
    <path d="M50 56 Q38 34 28 40 M50 56 Q62 32 74 38 M50 56 Q50 30 50 26" fill="none" stroke={base} strokeWidth="5" strokeLinecap="round" />
    <circle cx="28" cy="40" r="6" fill={light} /><circle cx="74" cy="38" r="6" fill={light} /><circle cx="50" cy="26" r="6" fill={base} />
  </>,
  table_lamp: ({ base, dark, light }) => <>
    <rect x="46" y="50" width="8" height="28" fill={dark} /><ellipse cx="50" cy="80" rx="15" ry="4" fill={dark} />
    <path d="M34 50 L66 50 L58 30 L42 30 Z" fill={base} /><ellipse cx="50" cy="30" rx="8" ry="3" fill={light} />
  </>,
  books: ({ base, dark, light }) => <>
    <rect x="32" y="40" width="11" height="38" fill={base} /><rect x="44" y="44" width="11" height="34" fill={dark} /><rect x="56" y="36" width="11" height="42" fill={light} />
  </>,
  vase: ({ base, dark, light }) => <>
    <path d="M40 42 Q33 60 44 80 L56 80 Q67 60 60 42 Q50 48 40 42 Z" fill={base} />
    <ellipse cx="50" cy="42" rx="10" ry="3" fill={dark} /><ellipse cx="45" cy="58" rx="4" ry="9" fill={light} opacity="0.5" />
  </>,
  toy: ({ base }) => <>
    <circle cx="40" cy="42" r="8" fill={base} /><circle cx="60" cy="42" r="8" fill={base} /><circle cx="50" cy="58" r="18" fill={base} />
    <circle cx="44" cy="54" r="2.5" fill={LINE} /><circle cx="56" cy="54" r="2.5" fill={LINE} />
  </>,
  // door side
  coatrack: ({ base, dark }) => <>
    <rect x="47" y="28" width="6" height="48" fill={base} />
    <path d="M50 30 Q41 30 39 37 M50 34 Q59 34 61 41" fill="none" stroke={base} strokeWidth="3" strokeLinecap="round" />
    <path d="M37 76 L63 76 L58 82 L42 82 Z" fill={dark} />
  </>,
  stand: ({ base, dark, light }) => <>
    <rect x="42" y="44" width="16" height="32" rx="3" fill={base} /><ellipse cx="50" cy="44" rx="11" ry="4" fill={light} /><ellipse cx="50" cy="78" rx="13" ry="4" fill={dark} />
  </>,
}

export const FURNITURE_ARTS = new Set(Object.keys(ART))

export function FurnitureArt({ art, color }: { art: string; color: string }) {
  const draw = ART[art]
  if (!draw) return null
  const k = cols(/^#[0-9a-f]{6}$/i.test(color) ? color : '#C8A36A')
  return (
    <svg viewBox="0 0 100 100" width="100%" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <g stroke={LINE} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">{draw(k)}</g>
    </svg>
  )
}
