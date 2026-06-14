// A flat round rug the pet lies on. It sits ENTIRELY BEHIND the pet (no element ever
// overlaps the dog), so the paws and heart tag stay fully visible — the pose reads as
// "puppy resting on its mat" instead of floating on bare floor. Sized in px to stay
// proportional to the fixed-size raster pet.
interface Props { children: React.ReactNode }

export function PetRug({ children }: Props) {
  return (
    <div className="petrug">
      <div className="petrug-shadow" aria-hidden />
      <svg className="petrug-mat" viewBox="0 0 202 92" aria-hidden>
        <defs>
          <radialGradient id="rugFill" cx="50%" cy="40%" r="72%">
            <stop offset="0%" stopColor="#E5C9D8" />
            <stop offset="100%" stopColor="#BC8DA3" />
          </radialGradient>
        </defs>
        {/* braided rug: outer body + concentric tone rings + soft sheen */}
        <ellipse cx="101" cy="50" rx="100" ry="40" fill="url(#rugFill)" />
        <ellipse cx="101" cy="50" rx="100" ry="40" fill="none" stroke="#A87890" strokeWidth="2.5" strokeOpacity="0.55" />
        <ellipse cx="101" cy="50" rx="80" ry="31" fill="none" stroke="#CFA6BF" strokeWidth="5" strokeOpacity="0.7" />
        <ellipse cx="101" cy="50" rx="60" ry="22" fill="none" stroke="#E4C9D7" strokeWidth="5" strokeOpacity="0.6" />
        <ellipse cx="101" cy="45" rx="46" ry="14" fill="#F1DEE9" opacity="0.45" />
      </svg>
      <div className="petrug-pet">{children}</div>
    </div>
  )
}
