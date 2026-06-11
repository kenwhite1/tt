// Golden puppy — original flat-vector rig, v1 (idle / sleeping / walking states).
interface Props {
  size?: number
  state?: 'idle' | 'sleeping' | 'happy'
}

export function Puppy({ size = 180, state = 'idle' }: Props) {
  const sleeping = state === 'sleeping'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ animation: sleeping ? undefined : 'breathe 3.2s ease-in-out infinite' }}
    >
      {/* tail */}
      <path d="M158 138 q26 -8 22 -30" stroke="#E8A84C" strokeWidth="14" fill="none" strokeLinecap="round">
        {!sleeping && (
          <animateTransform attributeName="transform" type="rotate" values="0 158 138; 8 158 138; 0 158 138" dur="0.9s" repeatCount="indefinite" />
        )}
      </path>
      {/* body */}
      <ellipse cx="100" cy="138" rx="62" ry="48" fill="#F3BA5E" />
      <ellipse cx="100" cy="152" rx="38" ry="28" fill="#FBE3B2" />
      {/* front paws */}
      <ellipse cx="74" cy="180" rx="16" ry="10" fill="#EFAF4F" />
      <ellipse cx="126" cy="180" rx="16" ry="10" fill="#EFAF4F" />
      {/* head */}
      <circle cx="100" cy="78" r="52" fill="#F3BA5E" />
      {/* ears */}
      <path d="M52 56 q-14 34 8 50 q16 -6 14 -34 q-4 -16 -22 -16z" fill="#D98B3A" />
      <path d="M148 56 q14 34 -8 50 q-16 -6 -14 -34 q4 -16 22 -16z" fill="#D98B3A" />
      {/* head tuft */}
      <path d="M92 28 q8 -10 16 0 q-4 6 -8 6 q-4 0 -8 -6z" fill="#E8A84C" />
      {/* muzzle */}
      <ellipse cx="100" cy="94" rx="24" ry="18" fill="#FBE3B2" />
      <ellipse cx="100" cy="86" rx="9" ry="7" fill="#6F4322" />
      {/* mouth */}
      {sleeping
        ? <path d="M92 102 q8 4 16 0" stroke="#6F4322" strokeWidth="3" fill="none" strokeLinecap="round" />
        : <path d="M90 100 q5 7 10 0 q5 7 10 0" stroke="#6F4322" strokeWidth="3" fill="none" strokeLinecap="round" />}
      {/* eyes */}
      {sleeping ? (
        <>
          <path d="M72 72 q8 6 16 0" stroke="#5C4326" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M112 72 q8 6 16 0" stroke="#5C4326" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : state === 'happy' ? (
        <>
          <path d="M72 74 q8 -8 16 0" stroke="#5C4326" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M112 74 q8 -8 16 0" stroke="#5C4326" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="80" cy="72" r="6" fill="#3E2B14" />
          <circle cx="120" cy="72" r="6" fill="#3E2B14" />
          <circle cx="82" cy="70" r="2" fill="#fff" />
          <circle cx="122" cy="70" r="2" fill="#fff" />
        </>
      )}
      {/* blush */}
      <ellipse cx="64" cy="88" rx="8" ry="5" fill="#F2A07E" opacity="0.7" />
      <ellipse cx="136" cy="88" rx="8" ry="5" fill="#F2A07E" opacity="0.7" />
      {/* collar */}
      <path d="M62 116 q38 18 76 0 l-3 10 q-35 15 -70 0z" fill="#8E6FC0" />
      {sleeping && (
        <text x="150" y="40" fontSize="22" fill="#8a5a33">
          z
          <animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" />
        </text>
      )}
    </svg>
  )
}
