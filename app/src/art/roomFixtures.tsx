// Room-scale furniture for the baked slots (window / dresser / door / lamp), drawn directly
// in RoomScene's 320×250 coordinate space and tinted by the equipped item's colour. These
// render ONLY when an item is equipped in that slot — otherwise RoomScene keeps its crafted
// default art, so the default room is unchanged.
import type { JSX } from 'react'
import { shade } from './hash'

const LINE = '#2c2113'
const NIGHT = '#26324f'
type Draw = (c: string) => JSX.Element
const T = (c: string) => ({ base: c, dark: shade(c, 0.74), light: shade(c, 1.22) })
const moon = <><circle cx="115" cy="76" r="12" fill="#D6E0EE" /><circle cx="119" cy="74" r="10" fill="#2A3856" opacity="0.28" /></>

// ---- window (centred ~130,92) ----
export const WINDOW_ART: Record<string, Draw> = {
  round: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">
    <circle cx="130" cy="92" r="50" fill={k.dark} /><circle cx="130" cy="92" r="44" fill={NIGHT} stroke="none" />
    {moon}<line x1="130" y1="46" x2="130" y2="138" stroke={k.base} strokeWidth="5" /><line x1="84" y1="92" x2="176" y2="92" stroke={k.base} strokeWidth="5" />
  </g> },
  square: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">
    <rect x="90" y="50" width="80" height="80" rx="6" fill={k.dark} /><rect x="96" y="56" width="68" height="68" fill={NIGHT} stroke="none" />
    {moon}<line x1="130" y1="56" x2="130" y2="124" stroke={k.base} strokeWidth="4" /><line x1="96" y1="90" x2="164" y2="90" stroke={k.base} strokeWidth="4" />
  </g> },
  arch: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">
    <path d="M90 132 L90 92 Q90 48 130 48 Q170 48 170 92 L170 132 Z" fill={k.dark} />
    <path d="M97 130 L97 92 Q97 55 130 55 Q163 55 163 92 L163 130 Z" fill={NIGHT} stroke="none" />
    {moon}<line x1="130" y1="55" x2="130" y2="130" stroke={k.base} strokeWidth="4" /><line x1="97" y1="92" x2="163" y2="92" stroke={k.base} strokeWidth="4" />
  </g> },
}

// ---- dresser (centred ~131, body 96..166 / 118..170) ----
const dresserShadow = <ellipse cx="131" cy="172" rx="44" ry="9" fill="#102E34" opacity="0.18" />
export const DRESSER_ART: Record<string, Draw> = {
  drawers: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">{dresserShadow}
    <rect x="96" y="116" width="70" height="54" rx="7" fill={k.base} />
    <rect x="101" y="122" width="60" height="14" rx="3" fill={k.light} /><rect x="101" y="139" width="60" height="14" rx="3" fill={k.light} /><rect x="101" y="156" width="60" height="10" rx="3" fill={k.dark} />
    <circle cx="131" cy="129" r="2" fill={LINE} /><circle cx="131" cy="146" r="2" fill={LINE} />
  </g> },
  cabinet: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">{dresserShadow}
    <rect x="96" y="114" width="70" height="56" rx="7" fill={k.base} />
    <rect x="101" y="120" width="29" height="44" rx="3" fill={k.dark} /><rect x="132" y="120" width="29" height="44" rx="3" fill={k.dark} />
    <circle cx="127" cy="142" r="2.5" fill={LINE} /><circle cx="135" cy="142" r="2.5" fill={LINE} />
  </g> },
  shelves: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">{dresserShadow}
    <rect x="96" y="112" width="70" height="58" rx="6" fill={k.base} />
    <rect x="101" y="118" width="60" height="46" fill={k.dark} /><line x1="101" y1="134" x2="161" y2="134" stroke={k.light} strokeWidth="3" /><line x1="101" y1="150" x2="161" y2="150" stroke={k.light} strokeWidth="3" />
    <circle cx="115" cy="127" r="4" fill={k.light} stroke="none" /><rect x="140" y="122" width="6" height="10" fill={k.light} stroke="none" />
  </g> },
  sideboard: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">{dresserShadow}
    <rect x="94" y="124" width="74" height="38" rx="6" fill={k.base} />
    <rect x="100" y="130" width="28" height="26" rx="3" fill={k.dark} /><rect x="134" y="130" width="28" height="26" rx="3" fill={k.dark} />
    <rect x="100" y="162" width="6" height="10" fill={k.dark} /><rect x="156" y="162" width="6" height="10" fill={k.dark} />
  </g> },
}

// ---- door (right, ~236..292 / 36..172) ----
const doorShadow = <ellipse cx="264" cy="172" rx="36" ry="7" fill="#102E34" opacity="0.20" />
export const DOOR_ART: Record<string, Draw> = {
  arched: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">{doorShadow}
    <path d="M236 60 Q236 36 264 36 Q292 36 292 60 L292 172 L236 172 Z" fill={k.base} />
    <circle cx="264" cy="64" r="12" fill="#CFE0EC" /><circle cx="264" cy="64" r="8" fill={NIGHT} stroke="none" />
    <circle cx="245" cy="118" r="3.5" fill={k.dark} />
  </g> },
  panel: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">{doorShadow}
    <rect x="236" y="40" width="56" height="132" rx="4" fill={k.base} />
    <rect x="244" y="48" width="40" height="40" rx="3" fill={k.dark} /><rect x="244" y="94" width="40" height="40" rx="3" fill={k.dark} /><rect x="244" y="140" width="40" height="24" rx="3" fill={k.dark} />
    <circle cx="245" cy="112" r="3.5" fill={k.light} />
  </g> },
  round_top: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">{doorShadow}
    <path d="M236 64 Q236 38 264 38 Q292 38 292 64 L292 172 L236 172 Z" fill={k.base} />
    <path d="M248 64 Q248 50 264 50 Q280 50 280 64 L280 78 L248 78 Z" fill="#CFE0EC" /><path d="M248 64 Q248 50 264 50 Q280 50 280 64 L280 78 L248 78 Z" fill={NIGHT} opacity="0.55" stroke="none" />
    <circle cx="246" cy="120" r="3.5" fill={k.dark} />
  </g> },
  barn: c => { const k = T(c); return <g stroke={LINE} strokeWidth="2">{doorShadow}
    <rect x="232" y="44" width="64" height="6" rx="2" fill={k.dark} />
    <rect x="236" y="52" width="56" height="120" rx="3" fill={k.base} />
    <path d="M236 52 L292 168 M292 52 L236 168" stroke={k.dark} strokeWidth="4" />
    <circle cx="241" cy="44" r="3" fill={LINE} /><circle cx="287" cy="44" r="3" fill={LINE} />
  </g> },
}

// ---- lamp (hangs from top, ~cx 178) ----
export const LAMP_ART: Record<string, Draw> = {
  hanging: c => { const k = T(c); return <g stroke={LINE} strokeWidth="1.5">
    <line x1="178" y1="0" x2="178" y2="38" stroke="#6F4322" strokeWidth="2" />
    <path d="M161 56 Q178 28 195 56 Z" fill={k.base} /><ellipse cx="178" cy="56" rx="17" ry="4" fill={k.light} />
    <circle cx="178" cy="58" r="3" fill="#FCEFAF" stroke="none" /><path d="M163 60 L150 118 L206 118 L193 60 Z" fill="#FCEFAF" opacity="0.22" stroke="none" />
  </g> },
  pendant: c => { const k = T(c); return <g stroke={LINE} strokeWidth="1.5">
    <line x1="178" y1="0" x2="178" y2="40" stroke="#6F4322" strokeWidth="2" />
    <circle cx="178" cy="52" r="13" fill={k.base} /><circle cx="174" cy="48" r="4" fill={k.light} stroke="none" />
    <path d="M168 58 L156 110 L200 110 L188 58 Z" fill="#FCEFAF" opacity="0.18" stroke="none" />
  </g> },
  chandelier: c => { const k = T(c); return <g stroke={LINE} strokeWidth="1.5">
    <line x1="178" y1="0" x2="178" y2="34" stroke="#6F4322" strokeWidth="2" />
    <path d="M152 44 Q178 36 204 44" fill="none" stroke={k.base} strokeWidth="3" />
    <circle cx="154" cy="48" r="5" fill={k.base} /><circle cx="178" cy="42" r="5" fill={k.base} /><circle cx="202" cy="48" r="5" fill={k.base} />
    <circle cx="154" cy="48" r="2" fill="#FCEFAF" stroke="none" /><circle cx="178" cy="42" r="2" fill="#FCEFAF" stroke="none" /><circle cx="202" cy="48" r="2" fill="#FCEFAF" stroke="none" />
  </g> },
  flush: c => { const k = T(c); return <g stroke={LINE} strokeWidth="1.5">
    <ellipse cx="178" cy="20" rx="22" ry="11" fill={k.base} /><ellipse cx="178" cy="18" rx="14" ry="6" fill={k.light} />
    <path d="M160 24 L150 100 L206 100 L196 24 Z" fill="#FCEFAF" opacity="0.16" stroke="none" />
  </g> },
}
