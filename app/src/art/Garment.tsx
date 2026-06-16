// Procedural vector garments — a cute flat-shaded SVG per archetype, tinted by the item's
// actual colour. Replaces the per-slot emoji stickers so every clothing item renders as
// itself, in its colour. Archetype per item comes from garmentMap.ts (GARMENT_ART).
import type { JSX } from 'react'
import { shade } from './hash'

const LINE = '#4a3520'
interface K { base: string; dark: string; light: string }
const cols = (c: string): K => ({ base: c, dark: shade(c, 0.76), light: shade(c, 1.24) })

// Each archetype draws inside a 0..100 box, roughly centred, with the group supplying the
// dark outline. Per-shape fills use base/dark/light; a few override stroke for coloured frames.
const ART: Record<string, (k: K) => JSX.Element> = {
  // ---- head ----
  hat: ({ base, dark, light }) => <>
    <ellipse cx="50" cy="64" rx="42" ry="11" fill={dark} />
    <path d="M30 62 Q32 26 50 24 Q68 26 70 62 Z" fill={base} />
    <ellipse cx="50" cy="46" rx="20" ry="5" fill={light} />
  </>,
  cap: ({ base, dark, light }) => <>
    <path d="M26 58 Q26 28 50 28 Q74 28 74 58 Q50 64 26 58 Z" fill={base} />
    <path d="M70 56 Q92 56 92 66 Q74 68 68 60 Z" fill={dark} />
    <circle cx="50" cy="30" r="3.5" fill={light} />
  </>,
  beanie: ({ base, dark, light }) => <>
    <path d="M26 58 Q26 24 50 24 Q74 24 74 58 Z" fill={base} />
    <rect x="22" y="54" width="56" height="12" rx="6" fill={dark} />
    <circle cx="50" cy="20" r="6" fill={light} />
  </>,
  headphones: ({ base, light }) => <>
    <path d="M22 58 Q22 18 50 18 Q78 18 78 58" fill="none" stroke={LINE} strokeWidth="7" />
    <rect x="14" y="48" width="18" height="26" rx="8" fill={base} />
    <rect x="68" y="48" width="18" height="26" rx="8" fill={base} />
    <circle cx="23" cy="61" r="3" fill={light} />
  </>,
  crown: ({ base, light }) => <>
    <path d="M24 66 L30 36 L42 52 L50 30 L58 52 L70 36 L76 66 Z" fill={base} />
    <circle cx="30" cy="35" r="4" fill={light} /><circle cx="50" cy="29" r="4" fill={light} /><circle cx="70" cy="35" r="4" fill={light} />
  </>,
  flower: ({ base, light }) => <>
    <g fill={base}><circle cx="50" cy="30" r="13" /><circle cx="30" cy="46" r="13" /><circle cx="70" cy="46" r="13" /><circle cx="40" cy="66" r="13" /><circle cx="60" cy="66" r="13" /></g>
    <circle cx="50" cy="50" r="11" fill={light} />
  </>,
  ears: ({ base, light }) => <>
    <path d="M26 62 Q50 52 74 62" fill="none" stroke={LINE} strokeWidth="6" />
    <path d="M32 60 Q26 28 42 34 Q46 52 40 60 Z" fill={base} />
    <path d="M68 60 Q74 28 58 34 Q54 52 60 60 Z" fill={base} />
    <path d="M36 52 Q34 40 40 42" fill={light} stroke="none" />
  </>,
  party_hat: ({ base, dark, light }) => <>
    <path d="M50 16 L32 66 L68 66 Z" fill={base} />
    <path d="M40 50 L45 38 M52 58 L60 44 M34 64 L38 56" stroke={dark} strokeWidth="3" fill="none" />
    <circle cx="50" cy="14" r="6" fill={light} />
  </>,
  bow: ({ base, dark }) => <>
    <path d="M50 50 L26 36 Q20 50 26 64 Z" fill={base} />
    <path d="M50 50 L74 36 Q80 50 74 64 Z" fill={base} />
    <circle cx="50" cy="50" r="8" fill={dark} />
  </>,
  // ---- face ----
  glasses: ({ base }) => <g stroke={base} strokeWidth="5" fill="#eaf4fa">
    <circle cx="34" cy="50" r="14" /><circle cx="66" cy="50" r="14" /><path d="M48 50 H52" /><path d="M20 47 L21 50" /><path d="M80 47 L79 50" />
  </g>,
  sunglasses: ({ base, dark }) => <g stroke={base} strokeWidth="5" fill={dark}>
    <circle cx="34" cy="50" r="14" /><circle cx="66" cy="50" r="14" /><path d="M48 50 H52" />
  </g>,
  mask: ({ base, light }) => <>
    <path d="M28 44 Q50 36 72 44 Q74 62 50 66 Q26 62 28 44 Z" fill={base} />
    <path d="M28 48 L20 46 M72 48 L80 46" stroke={LINE} strokeWidth="3" />
    <path d="M36 52 H64" stroke={light} strokeWidth="2" />
  </>,
  // ---- neck ----
  scarf: ({ base, dark }) => <>
    <path d="M28 44 Q50 58 72 44 L67 56 Q50 66 33 56 Z" fill={base} />
    <path d="M58 54 L63 80 L51 78 L49 56 Z" fill={dark} />
  </>,
  bowtie: ({ base, dark }) => <>
    <path d="M50 50 L32 40 L32 60 Z" fill={base} /><path d="M50 50 L68 40 L68 60 Z" fill={base} />
    <rect x="45" y="43" width="10" height="14" rx="3" fill={dark} />
  </>,
  collar: ({ base, light }) => <>
    <path d="M30 42 Q50 54 70 42 L65 52 Q50 60 35 52 Z" fill={base} />
    <circle cx="50" cy="58" r="5" fill={light} />
  </>,
  necklace: ({ base, light }) => <>
    <path d="M30 42 Q50 66 70 42" fill="none" stroke={base} strokeWidth="4" />
    <circle cx="50" cy="64" r="7" fill={base} /><circle cx="50" cy="64" r="3" fill={light} />
  </>,
  bandana: ({ base, dark }) => <>
    <path d="M28 40 Q50 48 72 40 L50 72 Z" fill={base} />
    <path d="M28 40 Q50 48 72 40" stroke={dark} strokeWidth="3" fill="none" />
  </>,
  // ---- top ----
  shirt: ({ base, light }) => <>
    <path d="M30 44 L22 54 L31 61 L34 56 L34 80 Q50 86 66 80 L66 56 L69 61 L78 54 L70 44 Q50 56 30 44 Z" fill={base} />
    <path d="M42 46 Q50 52 58 46" fill="none" stroke={light} strokeWidth="2" />
  </>,
  sweater: ({ base, dark }) => <>
    <path d="M30 44 L24 56 L33 62 L34 76 Q50 82 66 76 L67 62 L76 56 L70 44 Q50 56 30 44 Z" fill={base} />
    <rect x="34" y="74" width="32" height="7" rx="3" fill={dark} />
  </>,
  jacket: ({ base, dark, light }) => <>
    <path d="M30 44 L23 55 L32 61 L34 80 Q50 86 66 80 L68 61 L77 55 L70 44 Q50 56 30 44 Z" fill={base} />
    <path d="M50 50 V82" stroke={dark} strokeWidth="3" />
    <path d="M44 47 L50 56 L56 47" fill={light} stroke="none" />
  </>,
  vest: ({ base, dark }) => <>
    <path d="M34 46 L34 80 Q50 86 66 80 L66 46 Q50 56 34 46 Z" fill={base} />
    <path d="M50 52 V82" stroke={dark} strokeWidth="2" />
  </>,
  raincoat: ({ base, dark }) => <>
    <path d="M30 46 L24 58 L33 62 L34 82 Q50 88 66 82 L67 62 L76 58 L70 46 Q50 56 30 46 Z" fill={base} />
    <path d="M34 38 Q50 30 66 38 Q60 48 50 48 Q40 48 34 38 Z" fill={dark} />
  </>,
  // ---- bottom ----
  shorts: ({ base, dark }) => <>
    <path d="M30 46 H70 L65 70 L53 70 L50 56 L47 70 L35 70 Z" fill={base} />
    <rect x="30" y="44" width="40" height="6" rx="3" fill={dark} />
  </>,
  pants: ({ base, dark }) => <>
    <path d="M32 44 H68 L64 82 L54 82 L50 56 L46 82 L36 82 Z" fill={base} />
    <rect x="32" y="42" width="36" height="6" rx="3" fill={dark} />
  </>,
  skirt: ({ base, light }) => <>
    <path d="M34 46 H66 L74 76 Q50 84 26 76 Z" fill={base} />
    <path d="M34 46 H66" stroke={light} strokeWidth="3" />
  </>,
  // ---- feet ----
  shoes: ({ base }) => <>
    <path d="M26 56 Q26 44 40 44 L58 44 Q74 46 76 58 Q76 64 68 64 L30 64 Q26 62 26 56 Z" fill={base} />
    <rect x="26" y="59" width="50" height="6" rx="3" fill="#fff" />
    <path d="M46 46 L50 56 M54 46 L58 56" stroke={LINE} strokeWidth="2" />
  </>,
  boots: ({ base, dark }) => <>
    <path d="M34 32 L54 32 L56 56 L72 56 L72 68 L34 68 Z" fill={base} />
    <rect x="34" y="60" width="38" height="8" rx="2" fill={dark} />
  </>,
  socks: ({ base, light }) => <>
    <path d="M40 32 L56 32 L56 56 L70 56 L70 68 L40 68 Z" fill={base} />
    <rect x="40" y="32" width="16" height="9" fill={light} />
  </>,
  sandals: ({ base }) => <>
    <rect x="30" y="58" width="44" height="9" rx="4" fill={base} />
    <path d="M40 58 L52 44 L64 58" fill="none" stroke={base} strokeWidth="5" />
  </>,
  // ---- held ----
  ball: ({ base, light }) => <>
    <circle cx="50" cy="52" r="24" fill={base} />
    <ellipse cx="41" cy="42" rx="9" ry="6" fill={light} opacity="0.75" />
  </>,
  teddy: ({ base, light }) => <>
    <circle cx="36" cy="36" r="9" fill={base} /><circle cx="64" cy="36" r="9" fill={base} />
    <circle cx="50" cy="54" r="20" fill={base} />
    <ellipse cx="50" cy="58" rx="9" ry="7" fill={light} />
    <circle cx="43" cy="50" r="2.6" fill={LINE} /><circle cx="57" cy="50" r="2.6" fill={LINE} />
  </>,
  balloon: ({ base, light }) => <>
    <ellipse cx="50" cy="40" rx="22" ry="26" fill={base} />
    <path d="M50 66 L50 90" fill="none" stroke={LINE} strokeWidth="2" />
    <path d="M45 65 L55 65 L50 73 Z" fill={base} />
    <ellipse cx="42" cy="32" rx="6" ry="9" fill={light} opacity="0.7" />
  </>,
  umbrella: ({ base, dark }) => <>
    <path d="M20 54 Q50 24 80 54 Z" fill={base} />
    <path d="M35 54 Q50 40 50 54 M65 54 Q50 40 50 54" fill={dark} />
    <path d="M50 54 V84 Q50 90 43 88" fill="none" stroke={LINE} strokeWidth="3" />
  </>,
  food: ({ base, light }) => <>
    <path d="M40 54 L50 88 L60 54 Z" fill="#e0b079" />
    <circle cx="50" cy="46" r="17" fill={base} />
    <circle cx="44" cy="40" r="6" fill={light} opacity="0.8" />
  </>,
  wand: ({ base, dark }) => <>
    <path d="M50 24 L57 42 L75 42 L60 53 L66 71 L50 60 L34 71 L40 53 L25 42 L43 42 Z" fill={base} />
    <path d="M50 58 L50 90" fill="none" stroke={dark} strokeWidth="3" />
  </>,
  book: ({ base, dark, light }) => <>
    <path d="M28 38 L50 45 L72 38 L72 70 L50 77 L28 70 Z" fill={base} />
    <path d="M28 38 L50 45 L72 38" fill={light} />
    <path d="M50 45 V77" stroke={dark} strokeWidth="2" />
  </>,
  // ---- back ----
  backpack: ({ base, dark }) => <>
    <rect x="32" y="38" width="36" height="42" rx="11" fill={base} />
    <rect x="40" y="54" width="20" height="20" rx="6" fill={dark} />
    <path d="M42 38 Q42 28 50 28 Q58 28 58 38" fill="none" stroke={LINE} strokeWidth="4" />
  </>,
  cape: ({ base, dark }) => <>
    <path d="M34 32 Q50 28 66 32 L74 82 Q50 74 26 82 Z" fill={base} />
    <path d="M34 32 Q50 44 66 32" fill={dark} />
  </>,
  wings: ({ base, light }) => <>
    <path d="M50 50 Q20 28 16 56 Q20 76 50 60 Z" fill={base} />
    <path d="M50 50 Q80 28 84 56 Q80 76 50 60 Z" fill={light} />
  </>,
  shell: ({ base, dark }) => <>
    <path d="M24 62 Q24 30 50 30 Q76 30 76 62 Z" fill={base} />
    <path d="M50 30 V62 M28 50 H72 M34 40 Q50 44 66 40" stroke={dark} strokeWidth="2" fill="none" />
  </>,
  // ---- full ----
  dress: ({ base, light }) => <>
    <path d="M40 38 L60 38 L57 54 L76 84 Q50 92 24 84 L43 54 Z" fill={base} />
    <circle cx="50" cy="44" r="4" fill={light} />
  </>,
  onesie: ({ base, dark }) => <>
    <path d="M33 38 H67 L67 64 L63 86 L54 86 L50 66 L46 86 L37 86 L33 64 Z" fill={base} />
    <circle cx="50" cy="50" r="3" fill={dark} /><circle cx="50" cy="60" r="3" fill={dark} />
  </>,
  suit: ({ base, dark }) => <>
    <path d="M34 38 L66 38 L66 84 L54 84 L50 56 L46 84 L34 84 Z" fill={base} />
    <path d="M44 38 L50 56 L56 38" fill="#fff" stroke="none" />
    <path d="M50 56 V84" stroke={dark} strokeWidth="2" />
  </>,
  costume: ({ base, light }) => <>
    <path d="M34 36 Q50 32 66 36 L70 82 Q50 74 30 82 Z" fill={base} />
    <path d="M50 48 L54 59 L66 59 L56 66 L60 78 L50 71 L40 78 L44 66 L34 59 L46 59 Z" fill={light} stroke="none" />
  </>,
}

export const GARMENT_ARTS = new Set(Object.keys(ART))

export function Garment({ art, color, size }: { art: string; color: string; size: number }) {
  const draw = ART[art] ?? ART.hat
  const k = cols(/^#[0-9a-f]{6}$/i.test(color) ? color : '#E0A94B')
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: 'visible' }} aria-hidden>
      <g stroke={LINE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {draw(k)}
      </g>
    </svg>
  )
}
