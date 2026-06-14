// Tab-bar icons, original sticker-style flat SVGs.
const S = 26

export const TabIcons = {
 home: (
 <svg width={S} height={S} viewBox="0 0 32 32">
 <path d="M16 4 L29 15 H26 V27 H6 V15 H3 Z" fill="#F2A93B" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
 <rect x="13" y="18" width="6" height="9" rx="2" fill="#8A5A33" />
 </svg>
 ),
 quests: (
 <svg width={S} height={S} viewBox="0 0 32 32">
 <rect x="7" y="4" width="18" height="24" rx="3" fill="#F8D77E" stroke="#fff" strokeWidth="2" />
 <path d="M16 10 l1.8 3.6 4 .6 -2.9 2.8 .7 4 -3.6 -1.9 -3.6 1.9 .7 -4 -2.9 -2.8 4 -.6z" fill="#4BA3DD" />
 </svg>
 ),
 shop: (
 <svg width={S} height={S} viewBox="0 0 32 32">
 <rect x="5" y="12" width="22" height="15" rx="3" fill="#FFF4DE" stroke="#fff" strokeWidth="2" />
 <path d="M5 12 L8 5 H24 L27 12 Z" fill="#E2574C" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
 <rect x="13" y="18" width="6" height="9" rx="2" fill="#8A5A33" />
 </svg>
 ),
 friends: (
 <svg width={S} height={S} viewBox="0 0 32 32">
 <circle cx="16" cy="12" r="9" fill="#7FB069" stroke="#fff" strokeWidth="2" />
 <circle cx="9" cy="16" r="6" fill="#5E8E4A" />
 <circle cx="23" cy="16" r="6" fill="#5E8E4A" />
 <rect x="14" y="18" width="4" height="10" rx="2" fill="#8A5A33" />
 </svg>
 ),
 bag: (
 <svg width={S} height={S} viewBox="0 0 32 32">
 <path d="M8 12 q8 -6 16 0 l2 12 q-10 6 -20 0z" fill="#E2574C" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
 <path d="M6 10 l22 -4" stroke="#8A5A33" strokeWidth="3" strokeLinecap="round" />
 </svg>
 ),
 pet: (
 <svg width={S} height={S} viewBox="0 0 32 32">
 <circle cx="16" cy="17" r="11" fill="#F3BA5E" stroke="#fff" strokeWidth="2" />
 <path d="M7 9 q-3 9 2 12 q5 -2 4 -9z" fill="#D98B3A" />
 <path d="M25 9 q3 9 -2 12 q-5 -2 -4 -9z" fill="#D98B3A" />
 <circle cx="12.5" cy="16" r="1.8" fill="#3E2B14" />
 <circle cx="19.5" cy="16" r="1.8" fill="#3E2B14" />
 <ellipse cx="16" cy="20" rx="3" ry="2.2" fill="#6F4322" />
 </svg>
 ),
}

// Crisp custom economy glyphs (replace the inconsistent ⚡/🦴 system emoji).
export function BoltIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M13.5 2 L4.5 13.5 H10 L9 22 L19.5 9.5 H13 Z" fill="#FFD15A" stroke="#E0A42B" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M12.6 4.5 L7 12 h3.4" fill="none" stroke="#FFF0C0" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}
export function BoneIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <g transform="rotate(-20 12 12)" fill="#D9B05A">
        <circle cx="6.6" cy="9.4" r="3.2" /><circle cx="6.6" cy="14.6" r="3.2" />
        <circle cx="17.4" cy="9.4" r="3.2" /><circle cx="17.4" cy="14.6" r="3.2" />
        <rect x="6" y="9" width="12" height="6" rx="3" />
      </g>
    </svg>
  )
}
