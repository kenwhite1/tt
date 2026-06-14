// Procedural micropet sprite — original flat-cozy creatures with soft shaded volume.
// Deterministic per speciesId: the hash picks a body archetype; a radial gradient + ground
// shadow + highlight give it depth, tinted by the variant colour.
import { useId } from 'react'
import { hashStr, pick, shade } from './hash'

interface Props { speciesId: string; variantHex?: string; adult?: boolean; size?: number }

type Archetype = 'blob' | 'critter' | 'bird' | 'cloud' | 'bug' | 'snail' | 'cat' | 'sprout'
const ARCHETYPES: Archetype[] = ['blob', 'critter', 'bird', 'cloud', 'bug', 'snail', 'cat', 'sprout']

export function Micropet({ speciesId, variantHex = '#C9A3E0', adult = false, size = 56 }: Props) {
  const h = hashStr(speciesId)
  const kind = pick(ARCHETYPES, h)
  const dark = shade(variantHex, 0.78)
  const light = shade(variantHex, 1.22)
  const scale = adult ? 1 : 0.86
  const eyeX = (h >> 3) % 2 === 0 ? 25 : 26
  const happy = (h >> 5) % 3 === 0

  const uid = useId().replace(/[:]/g, '')
  const bf = `url(#mp-${uid})`

  const eyes = happy ? (
    <>
      <path d={`M${eyeX} 33 q3 -3 6 0`} stroke="#3E2B14" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d={`M${38} 33 q3 -3 6 0`} stroke="#3E2B14" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  ) : (
    <>
      <circle cx={eyeX + 1.5} cy="34" r="2.7" fill="#3E2B14" />
      <circle cx="40.5" cy="34" r="2.7" fill="#3E2B14" />
      <circle cx={eyeX + 2.4} cy="33" r="0.9" fill="#fff" />
      <circle cx="41.4" cy="33" r="0.9" fill="#fff" />
    </>
  )
  const cheeks = (h >> 7) % 2 === 0 && (
    <>
      <ellipse cx="22" cy="38" rx="3" ry="2" fill="#F2A07E" opacity="0.6" />
      <ellipse cx="44" cy="38" rx="3" ry="2" fill="#F2A07E" opacity="0.6" />
    </>
  )
  const mouth = <path d="M31 39 q2 2 4 0" stroke="#3E2B14" strokeWidth="1.8" fill="none" strokeLinecap="round" />

  const body = (() => {
    switch (kind) {
      case 'bird':
        return <>
          <ellipse cx="33" cy="38" rx="16" ry="15" fill={bf} />
          <path d="M20 34 q-8 2 -10 8 q8 1 12 -3z" fill={dark} />
          <path d="M33 24 q3 -5 7 -3 q-1 5 -5 6z" fill={light} />
          <path d="M31 41 l4 0 l-2 4z" fill="#F2A93B" />
        </>
      case 'cloud':
        return <>
          <ellipse cx="33" cy="40" rx="18" ry="12" fill={bf} />
          <circle cx="22" cy="36" r="8" fill={bf} />
          <circle cx="44" cy="36" r="8" fill={bf} />
          <circle cx="33" cy="31" r="9" fill={light} />
        </>
      case 'bug':
        return <>
          <ellipse cx="33" cy="40" rx="14" ry="13" fill={bf} />
          <ellipse cx="20" cy="33" rx="7" ry="9" fill={light} opacity="0.85" />
          <ellipse cx="46" cy="33" rx="7" ry="9" fill={light} opacity="0.85" />
          <line x1="29" y1="26" x2="26" y2="20" stroke={dark} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="37" y1="26" x2="40" y2="20" stroke={dark} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="26" cy="19" r="1.6" fill={dark} /><circle cx="40" cy="19" r="1.6" fill={dark} />
        </>
      case 'snail':
        return <>
          <ellipse cx="40" cy="44" rx="16" ry="6" fill={dark} />
          <circle cx="36" cy="36" r="13" fill={light} />
          <circle cx="36" cy="36" r="8" fill={bf} />
          <circle cx="36" cy="36" r="3.5" fill={dark} />
          <path d="M22 44 q-6 0 -7 -8" stroke={bf} strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="15" cy="34" r="1.4" fill="#3E2B14" />
        </>
      case 'cat':
        return <>
          <ellipse cx="33" cy="40" rx="15" ry="14" fill={bf} />
          <path d="M21 30 l-3 -9 l9 5z" fill={variantHex} />
          <path d="M45 30 l3 -9 l-9 5z" fill={variantHex} />
          <path d="M22 27 l-1.5 -4 l4 2z" fill={dark} />
          <path d="M44 27 l1.5 -4 l-4 2z" fill={dark} />
          <path d="M48 46 q8 -2 9 -9" stroke={bf} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      case 'sprout':
        return <>
          <ellipse cx="33" cy="42" rx="13" ry="12" fill={bf} />
          <path d="M33 30 q-2 -10 -9 -12 q1 8 8 12z" fill={shade('#7FB069', 1)} />
          <path d="M33 30 q2 -9 9 -10 q-1 7 -8 11z" fill={shade('#7FB069', 1.15)} />
          <ellipse cx="33" cy="52" rx="9" ry="3" fill={dark} opacity="0.5" />
        </>
      case 'critter':
        return <>
          <ellipse cx="33" cy="40" rx="15" ry="14" fill={bf} />
          <ellipse cx="23" cy="28" rx="5" ry="6" fill={variantHex} />
          <ellipse cx="43" cy="28" rx="5" ry="6" fill={variantHex} />
          <ellipse cx="23" cy="28" rx="2.5" ry="3.2" fill={light} />
          <ellipse cx="43" cy="28" rx="2.5" ry="3.2" fill={light} />
          <ellipse cx="33" cy="44" rx="7" ry="5" fill={light} />
        </>
      default: // blob
        return <>
          <ellipse cx="33" cy="39" rx="16" ry="15" fill={bf} />
          <ellipse cx="33" cy="46" rx="9" ry="6" fill={light} />
        </>
    }
  })()

  return (
    <svg width={size} height={size} viewBox="0 0 66 60" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`mp-${uid}`} cx="40%" cy="32%" r="78%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={variantHex} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      <ellipse cx="33" cy="55" rx="15" ry="3.5" fill="#000" opacity="0.1" />
      <g transform={`translate(33 36) scale(${scale}) translate(-33 -36)`}>
        {body}
        <ellipse cx="26" cy="30" rx="6" ry="4" fill="#fff" opacity="0.18" />
        {eyes}
        {cheeks}
        {mouth}
      </g>
    </svg>
  )
}
