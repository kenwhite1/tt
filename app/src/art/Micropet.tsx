// Procedural micropet sprite — built by the art module agent.
interface Props { speciesId: string; variantHex?: string; adult?: boolean; size?: number }

export function Micropet({ variantHex = '#C9A3E0', size = 56 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="36" r="20" fill={variantHex} />
      <circle cx="25" cy="32" r="3" fill="#3E2B14" />
      <circle cx="39" cy="32" r="3" fill="#3E2B14" />
      <path d="M27 42 q5 4 10 0" stroke="#3E2B14" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}
