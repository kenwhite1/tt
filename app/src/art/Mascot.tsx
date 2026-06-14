// The pet mascot. 'dog' is the user's photoreal PNG (via Puppy); the others are
// original cute flat-SVG characters in one cohesive sticker style. <Mascot> routes
// by species and shares the .pet-img animation classes (breathe / happy / sleep).
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

// Accepts any string (pet.species from the DB) and falls back to the dog for
// unknown values, so legacy/garbage data never renders a blank pet.
export function Mascot({ species = 'dog', size = 180, state = 'idle' }: { species?: string; size?: number; state?: PuppyState }) {
  const sp = (species in ART ? species : 'dog') as Species
  if (sp === 'dog') return <Puppy size={size} state={state} />
  const cls = 'pet-img' + (state === 'happy' ? ' happy' : state === 'sleeping' ? ' sleep' : '')
  return (
    <svg className={cls} width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ overflow: 'visible' }}>
      {ART[sp as Exclude<Species, 'dog'>]}
    </svg>
  )
}

// shared face bits keep the set cohesive
const Eyes = ({ x1 = 42, x2 = 58, y = 40, r = 3.3 }: { x1?: number; x2?: number; y?: number; r?: number }) => (
  <>
    <circle cx={x1} cy={y} r={r} fill="#2b2b2b" /><circle cx={x2} cy={y} r={r} fill="#2b2b2b" />
    <circle cx={x1 + 1.2} cy={y - 1.1} r={r * 0.32} fill="#fff" /><circle cx={x2 + 1.2} cy={y - 1.1} r={r * 0.32} fill="#fff" />
  </>
)
const Cheeks = ({ x1 = 36, x2 = 64, y = 46, rx = 4.6, ry = 3.2 }: { x1?: number; x2?: number; y?: number; rx?: number; ry?: number }) => (
  <>
    <ellipse cx={x1} cy={y} rx={rx} ry={ry} fill="#F2A0A0" opacity="0.75" />
    <ellipse cx={x2} cy={y} rx={rx} ry={ry} fill="#F2A0A0" opacity="0.75" />
  </>
)

const ART: Record<Exclude<Species, 'dog'>, JSX.Element> = {
  cat: (
    <g>
      <path d="M28 26 l5 20 -19 -7z" fill="#F0A24A" /><path d="M72 26 l-5 20 19 -7z" fill="#F0A24A" />
      <path d="M28 31 l3 11 -10 -4z" fill="#F4B6A8" /><path d="M72 31 l-3 11 10 -4z" fill="#F4B6A8" />
      <ellipse cx="50" cy="70" rx="24" ry="22" fill="#F0A24A" />
      <ellipse cx="50" cy="74" rx="15" ry="16" fill="#F8D2A0" />
      <path d="M73 78 q16 0 11 -17" stroke="#F0A24A" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="43" r="22" fill="#F4A857" />
      <Cheeks x1={37} x2={63} y={47} rx={5} ry={3.4} />
      <Eyes x1={42} x2={58} y={41} />
      <path d="M48 47 l4 0 -2 2.6z" fill="#E0786A" />
      <path d="M50 49.6 q-3 3 -6 1 M50 49.6 q3 3 6 1" stroke="#9a6b3a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M30 45 h-12 M30 50 h-11 M70 45 h12 M70 50 h11" stroke="#cBA98a" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </g>
  ),
  owl: (
    <g>
      <path d="M30 27 l7 17 -15 -6z" fill="#A9763E" /><path d="M70 27 l-7 17 15 -6z" fill="#A9763E" />
      <ellipse cx="50" cy="58" rx="30" ry="34" fill="#A9763E" />
      <ellipse cx="50" cy="67" rx="21" ry="23" fill="#E8C58C" />
      <ellipse cx="22" cy="60" rx="8" ry="18" fill="#8E5E2C" /><ellipse cx="78" cy="60" rx="8" ry="18" fill="#8E5E2C" />
      <circle cx="39" cy="45" r="13" fill="#F6EAD2" /><circle cx="61" cy="45" r="13" fill="#F6EAD2" />
      <circle cx="39" cy="45" r="7" fill="#2b2b2b" /><circle cx="61" cy="45" r="7" fill="#2b2b2b" />
      <circle cx="41.4" cy="42.6" r="2.3" fill="#fff" /><circle cx="63.4" cy="42.6" r="2.3" fill="#fff" />
      <path d="M50 51 l5.5 7 -11 0z" fill="#F2A93B" />
      <path d="M41 90 v5 M46 90 v5 M54 90 v5 M59 90 v5" stroke="#F2A93B" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  ),
  turtle: (
    <g>
      <ellipse cx="27" cy="79" rx="9" ry="6.5" fill="#7FB85E" /><ellipse cx="73" cy="79" rx="9" ry="6.5" fill="#7FB85E" />
      <ellipse cx="50" cy="62" rx="34" ry="26" fill="#C8923E" />
      <ellipse cx="50" cy="60" rx="34" ry="25" fill="#E0A94C" />
      <path d="M50 36 v46 M16 60 h68 M31 43 l8 15 M69 43 l-8 15 M31 78 l8 -15 M69 78 l-8 -15" stroke="#C8923E" strokeWidth="2.4" fill="none" opacity="0.65" />
      <ellipse cx="23" cy="65" rx="8" ry="6" fill="#86C264" /><ellipse cx="77" cy="65" rx="8" ry="6" fill="#86C264" />
      <circle cx="50" cy="33" r="18" fill="#86C264" />
      <Cheeks x1={38} x2={62} y={37} rx={4} ry={2.8} />
      <Eyes x1={43} x2={57} y={30} r={3.2} />
      <path d="M45 38 q5 4 10 0" stroke="#3a6b2a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  elephant: (
    <g>
      <circle cx="24" cy="47" r="20" fill="#AAB6C6" /><circle cx="76" cy="47" r="20" fill="#AAB6C6" />
      <circle cx="27" cy="48" r="12" fill="#94A2B4" opacity="0.55" /><circle cx="73" cy="48" r="12" fill="#94A2B4" opacity="0.55" />
      <rect x="35" y="66" width="12" height="22" rx="6" fill="#B7C2D0" /><rect x="53" y="66" width="12" height="22" rx="6" fill="#B7C2D0" />
      <circle cx="50" cy="48" r="27" fill="#B7C2D0" />
      <path d="M50 52 q-4 17 5 24 q7 5 7 -4" stroke="#B7C2D0" strokeWidth="11" fill="none" strokeLinecap="round" />
      <Cheeks x1={34} x2={66} y={53} />
      <Eyes x1={40} x2={60} y={45} r={3.4} />
    </g>
  ),
  alpaca: (
    <g>
      <rect x="40" y="82" width="7.5" height="14" rx="3.5" fill="#D8C39A" /><rect x="52.5" y="82" width="7.5" height="14" rx="3.5" fill="#D8C39A" />
      {/* woolly body: deeper base + lighter fluff bumps for dimension */}
      <ellipse cx="50" cy="76" rx="27" ry="18" fill="#E2D0A8" />
      <circle cx="32" cy="72" r="11" fill="#F1E6CC" /><circle cx="50" cy="66" r="13" fill="#F1E6CC" />
      <circle cx="68" cy="72" r="11" fill="#F1E6CC" /><circle cx="41" cy="80" r="9" fill="#F1E6CC" /><circle cx="59" cy="80" r="9" fill="#F1E6CC" />
      {/* neck + head */}
      <path d="M45 44 q-2 18 5 28 h6 q-2 -16 1 -28z" fill="#EBDCB8" />
      <ellipse cx="50.5" cy="35" rx="13" ry="15" fill="#F1E6CC" />
      <path d="M40 26 l-4 -9 9 4z" fill="#D8C39A" /><path d="M61 26 l4 -9 -9 4z" fill="#D8C39A" />
      {/* fluffy forelock */}
      <circle cx="43" cy="22" r="6.5" fill="#FBF4E4" /><circle cx="51" cy="18" r="7.5" fill="#FBF4E4" /><circle cx="59" cy="22" r="6.5" fill="#FBF4E4" />
      <Cheeks x1={43} x2={58} y={39} rx={3.6} ry={2.6} />
      <Eyes x1={46} x2={56} y={34} r={3} />
      <ellipse cx="50.5" cy="43" rx="5.5" ry="4" fill="#E0CDA2" />
      <path d="M48 42.5 h5" stroke="#9a7b4a" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  ),
}
