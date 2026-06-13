// The puppy's room (birbhouse) — original flat-vector cozy interior: papered wall, round
// moon window with light beams, dresser, arched door, hanging lamp, straw nest bed.
// The pet is rendered by the caller, positioned on the floor via the children slot.
interface Props { children?: React.ReactNode }

export function RoomScene({ children }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', overflow: 'hidden' }}>
      <svg viewBox="0 0 320 250" width="100%" style={{ display: 'block' }}>
        {/* wall + floor */}
        <rect x="0" y="0" width="320" height="170" fill="#9DB4D2" />
        <rect x="0" y="0" width="320" height="170" fill="#A9BEDA" opacity="0.5" />
        <path d="M0 168 Q160 150 320 168 L320 250 L0 250 Z" fill="#2E6E79" />
        <path d="M0 168 Q160 150 320 168 L320 182 Q160 164 0 182 Z" fill="#3A828D" />

        {/* hanging lamp */}
        <line x1="178" y1="0" x2="178" y2="40" stroke="#6F4322" strokeWidth="2" />
        <path d="M163 56 Q178 30 193 56 Z" fill="#8C9A57" />
        <ellipse cx="178" cy="56" rx="15" ry="4" fill="#A9B86E" />
        <path d="M165 58 L150 120 L206 120 L191 58 Z" fill="#F8E59E" opacity="0.28" />

        {/* round moon window */}
        <circle cx="130" cy="92" r="50" fill="#C2D2E8" />
        <circle cx="130" cy="92" r="44" fill="#26324F" />
        <circle cx="113" cy="74" r="13" fill="#EAF0F7" opacity="0.92" />
        <circle cx="118" cy="72" r="11" fill="#26324F" opacity="0.35" />
        <line x1="130" y1="48" x2="130" y2="136" stroke="#C2D2E8" strokeWidth="5" />
        <line x1="86" y1="92" x2="174" y2="92" stroke="#C2D2E8" strokeWidth="5" />
        <line x1="100" y1="118" x2="150" y2="64" stroke="#5C6E92" strokeWidth="3" opacity="0.5" />
        {/* light beams onto floor */}
        <path d="M96 132 L70 200 L120 200 L120 132 Z" fill="#EAF2FB" opacity="0.12" />
        <path d="M164 132 L210 200 L150 200 L140 132 Z" fill="#EAF2FB" opacity="0.1" />

        {/* dresser under window */}
        <rect x="96" y="120" width="70" height="50" rx="6" fill="#9FB6D4" />
        <rect x="96" y="120" width="70" height="50" rx="6" fill="#B6C8E0" opacity="0.5" />
        <rect x="102" y="126" width="58" height="11" rx="3" fill="#86A0C2" />
        <rect x="102" y="141" width="58" height="11" rx="3" fill="#86A0C2" />
        <rect x="102" y="156" width="58" height="9" rx="3" fill="#86A0C2" />
        <circle cx="131" cy="131" r="1.6" fill="#5C6E92" />
        <circle cx="131" cy="146" r="1.6" fill="#5C6E92" />

        {/* arched door, right */}
        <path d="M236 60 Q236 36 264 36 Q292 36 292 60 L292 170 L236 170 Z" fill="#A8723F" />
        <path d="M236 60 Q236 36 264 36 Q292 36 292 60 L292 170 L236 170 Z" fill="#C28A53" opacity="0.35" />
        <circle cx="264" cy="66" r="13" fill="#CFE0EC" />
        <circle cx="264" cy="66" r="9" fill="#26324F" />
        <circle cx="244" cy="120" r="3" fill="#6F4322" />

        {/* straw nest bed, bottom-left */}
        <ellipse cx="52" cy="206" rx="52" ry="22" fill="#B79A4C" />
        <ellipse cx="52" cy="202" rx="38" ry="14" fill="#8E7636" />
        <ellipse cx="52" cy="200" rx="30" ry="10" fill="#6E5C2C" opacity="0.6" />
      </svg>
      {/* pet sits on the floor, centered toward the lower-middle */}
      <div style={{ position: 'absolute', left: '50%', bottom: '4%', transform: 'translateX(-50%)' }}>
        {children}
      </div>
    </div>
  )
}
