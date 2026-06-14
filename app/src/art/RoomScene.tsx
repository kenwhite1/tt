// The puppy's room — original cozy interior with soft shading/gradients: papered wall,
// glowing moon window, shaded dresser, arched door, hanging lamp, straw nest. The pet is
// rendered by the caller via the children slot, positioned on the floor.
interface Props { children?: React.ReactNode }

export function RoomScene({ children }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(40, 50, 70, 0.15)' }}>
      <svg viewBox="0 0 320 250" width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="rs-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A9BEDA" />
            <stop offset="100%" stopColor="#94A9C7" />
          </linearGradient>
          <linearGradient id="rs-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#347A85" />
            <stop offset="100%" stopColor="#2A626C" />
          </linearGradient>
          <radialGradient id="rs-glass" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#33436B" />
            <stop offset="100%" stopColor="#222E4B" />
          </radialGradient>
          <radialGradient id="rs-moon" cx="40%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#FBFCFF" />
            <stop offset="100%" stopColor="#D6E0EE" />
          </radialGradient>
          <linearGradient id="rs-dresser" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8CAE3" />
            <stop offset="100%" stopColor="#9DB4D2" />
          </linearGradient>
          <linearGradient id="rs-door" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#B27C49" />
            <stop offset="100%" stopColor="#9A6A3B" />
          </linearGradient>
          <radialGradient id="rs-nest" cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#C6A953" />
            <stop offset="100%" stopColor="#A98F44" />
          </radialGradient>
        </defs>

        {/* wall + floor */}
        <rect x="0" y="0" width="320" height="170" fill="url(#rs-wall)" />
        <path d="M0 168 Q160 150 320 168 L320 250 L0 250 Z" fill="url(#rs-floor)" />
        <path d="M0 168 Q160 150 320 168 L320 178 Q160 160 0 178 Z" fill="#3E8A95" opacity="0.7" />
        <path d="M0 168 Q160 150 320 168 L320 174 Q160 156 0 174 Z" fill="#1F4d56" opacity="0.25" />

        {/* hanging lamp */}
        <line x1="178" y1="0" x2="178" y2="40" stroke="#6F4322" strokeWidth="2" />
        <path d="M163 56 Q178 30 193 56 Z" fill="#8C9A57" />
        <path d="M163 56 Q178 30 178 56 Z" fill="#A2B069" />
        <ellipse cx="178" cy="56" rx="15" ry="4" fill="#AEBD74" />
        <path d="M165 58 L150 122 L206 122 L191 58 Z" fill="#FCEFAF" opacity="0.3" />

        {/* round moon window */}
        <circle cx="130" cy="92" r="51" fill="#CBD8EC" />
        <circle cx="130" cy="92" r="44" fill="url(#rs-glass)" />
        <circle cx="113" cy="74" r="13" fill="url(#rs-moon)" />
        <circle cx="118" cy="72" r="11" fill="#2A3856" opacity="0.3" />
        <ellipse cx="146" cy="108" rx="22" ry="16" fill="#445782" opacity="0.35" transform="rotate(-30 146 108)" />
        <line x1="130" y1="48" x2="130" y2="136" stroke="#CBD8EC" strokeWidth="5" />
        <line x1="86" y1="92" x2="174" y2="92" stroke="#CBD8EC" strokeWidth="5" />
        {/* light beams onto floor */}
        <path d="M96 132 L70 200 L120 200 L120 132 Z" fill="#EAF2FB" opacity="0.12" />
        <path d="M164 132 L210 200 L150 200 L140 132 Z" fill="#EAF2FB" opacity="0.1" />

        {/* dresser under window */}
        <ellipse cx="131" cy="172" rx="40" ry="7" fill="#1F4d56" opacity="0.22" />
        <rect x="96" y="118" width="70" height="52" rx="7" fill="url(#rs-dresser)" />
        <rect x="101" y="124" width="60" height="13" rx="3.5" fill="#92ACCE" />
        <rect x="101" y="140" width="60" height="13" rx="3.5" fill="#92ACCE" />
        <rect x="101" y="156" width="60" height="10" rx="3.5" fill="#92ACCE" />
        <rect x="101" y="124" width="60" height="4" rx="2" fill="#C6D6EC" opacity="0.6" />
        <circle cx="131" cy="130.5" r="1.8" fill="#5C6E92" />
        <circle cx="131" cy="146.5" r="1.8" fill="#5C6E92" />

        {/* arched door, right */}
        <path d="M236 60 Q236 36 264 36 Q292 36 292 60 L292 172 L236 172 Z" fill="url(#rs-door)" />
        <path d="M240 62 Q240 42 264 42 L264 168 L240 168 Z" fill="#C28A53" opacity="0.25" />
        <circle cx="264" cy="66" r="13" fill="#CFE0EC" />
        <circle cx="264" cy="66" r="9" fill="url(#rs-glass)" />
        <circle cx="261" cy="63" r="3" fill="#E8F0F8" opacity="0.6" />
        <circle cx="245" cy="120" r="3.5" fill="#5C3A1E" />
        <circle cx="244" cy="119" r="1.2" fill="#fff" opacity="0.5" />

        {/* straw nest bed, bottom-left */}
        <ellipse cx="52" cy="212" rx="54" ry="22" fill="#1F4d56" opacity="0.2" />
        <ellipse cx="52" cy="206" rx="52" ry="22" fill="url(#rs-nest)" />
        <ellipse cx="52" cy="202" rx="38" ry="14" fill="#8E7636" />
        <ellipse cx="52" cy="200" rx="30" ry="10" fill="#6E5C2C" opacity="0.6" />
        <path d="M8 204 q44 -16 88 0" stroke="#D8BE6A" strokeWidth="2" fill="none" opacity="0.6" />
      </svg>
      {/* pet sits on the floor, centered toward the lower-middle */}
      <div style={{ position: 'absolute', left: '50%', bottom: '4%', transform: 'translateX(-50%)' }}>
        {children}
      </div>
    </div>
  )
}
