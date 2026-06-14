// Golden puppy, original rig, v3 — soft shaded volume (radial gradients), ground shadow,
// highlights, glossy eyes. Growth stages, dyeable layers, outfit slots, SMIL micro-animations.
import { useId } from 'react'
import type { Stage } from '@shared/constants'
import { hashStr, pick, shade } from './hash'

export type PuppyState = 'idle' | 'sleeping' | 'happy' | 'walking'
export type DyePart = 'body' | 'ears' | 'muzzle' | 'cheeks' | 'paws' | 'tail' | 'tummy'
export type OutfitSlot = 'head' | 'face' | 'neck' | 'top' | 'bottom' | 'feet' | 'held' | 'back'

interface Props {
  size?: number
  state?: PuppyState
  stage?: Stage
  /** hex tints per body part; unset parts keep the golden defaults */
  dyes?: Partial<Record<DyePart, string>>
  /** itemId per anchor slot, rendered as iconic flat accessory shapes */
  outfit?: Partial<Record<OutfitSlot, string>>
}

const GEO: Record<Stage, { hr: number; hy: number; brx: number; bry: number; bcy: number; ear: number; tail: number }> = {
  baby: { hr: 55, hy: 94, brx: 53, bry: 37, bcy: 152, ear: 0.75, tail: 0.72 },
  toddler: { hr: 53, hy: 86, brx: 58, bry: 42, bcy: 146, ear: 0.86, tail: 0.85 },
  child: { hr: 52, hy: 78, brx: 62, bry: 48, bcy: 138, ear: 1.0, tail: 1.0 },
  teen: { hr: 49, hy: 69, brx: 60, bry: 55, bcy: 134, ear: 1.12, tail: 1.1 },
  adult: { hr: 47, hy: 62, brx: 59, bry: 61, bcy: 131, ear: 1.22, tail: 1.2 },
}

const ACCENTS = ['#E2574C', '#4BA3DD', '#7FB069', '#8E6FC0', '#F2A93B', '#F2A7C3', '#5FA854', '#3D8E9E'] as const

export function Puppy({ size = 180, state = 'idle', stage = 'child', dyes, outfit }: Props) {
  const sleeping = state === 'sleeping'
  const walking = state === 'walking'
  const g = GEO[stage] ?? GEO.child
  const s = g.hr / 52
  const hy = g.hy
  const pawY = g.bcy + g.bry - 6
  const tailX = 100 + g.brx * 0.93

  const body = dyes?.body ?? '#F3BA5E'
  const ears = dyes?.ears ?? '#D98B3A'
  const muzzle = dyes?.muzzle ?? '#FBE3B2'
  const cheeks = dyes?.cheeks ?? '#F2A07E'
  const paws = dyes?.paws ?? '#EFAF4F'
  const tail = dyes?.tail ?? '#E8A84C'
  const tummy = dyes?.tummy ?? '#FBE3B2'
  const tuft = shade(body, 0.9)

  // unique gradient ids per instance (multiple puppies can share a page)
  const uid = useId().replace(/[:]/g, '')
  const gid = (k: string) => `${k}-${uid}`
  // soft-volume radial gradient derived from a base colour (light top-left → base → darker base)
  const grad = (k: string, base: string) => (
    <radialGradient id={gid(k)} cx="40%" cy="32%" r="78%">
      <stop offset="0%" stopColor={shade(base, 1.18)} />
      <stop offset="52%" stopColor={base} />
      <stop offset="100%" stopColor={shade(base, 0.84)} />
    </radialGradient>
  )
  const f = (k: string) => `url(#${gid(k)})`

  const itemColor = (id: string) => pick(ACCENTS, hashStr(id))
  const itemVar = (id: string, n: number) => hashStr(id + '#v') % n

  // ---- outfit pieces (iconic flat shapes, anchored to the rig) ----
  const headItem = outfit?.head && (() => {
    const id = outfit.head!
    const c = itemColor(id), c2 = shade(c, 0.8)
    const v = itemVar(id, 4)
    return (
      <g transform={`translate(100 ${hy - g.hr + 2}) scale(${s})`}>
        {v === 0 && (<><path d="M-26 4 a26 20 0 0 1 52 0 z" fill={c} /><path d="M0 -2 h34 a6 6 0 0 1 0 10 l-34 -4z" fill={c2} /><circle cx="0" cy="-14" r="4" fill={c2} /></>)}
        {v === 1 && (<><path d="M-26 6 a26 24 0 0 1 52 0 z" fill={c} /><rect x="-27" y="2" width="54" height="8" rx="4" fill={c2} /><circle cx="0" cy="-20" r="6" fill="#FAF7F0" /></>)}
        {v === 2 && (<>{[-22, -11, 0, 11, 22].map(x => (<g key={x} transform={`translate(${x} ${Math.abs(x) * 0.18 - 2})`}><circle r="5.5" fill={c} /><circle r="2.2" fill="#F8D77E" /></g>))}</>)}
        {v === 3 && (<><path d="M-16 6 L0 -26 L16 6 z" fill={c} /><circle cx="0" cy="-26" r="4.5" fill={c2} /><path d="M-16 6 q16 6 32 0" stroke={c2} strokeWidth="4" fill="none" strokeLinecap="round" /></>)}
      </g>
    )
  })()

  const faceItem = outfit?.face && (() => {
    const id = outfit.face!
    const c = shade(itemColor(id), 0.7)
    const v = itemVar(id, 3)
    return (
      <g transform={`translate(100 ${hy - 6 * s}) scale(${s})`} fill="none" stroke={c} strokeWidth="3.5">
        {v === 0 && (<><circle cx="-20" cy="0" r="11" /><circle cx="20" cy="0" r="11" /><path d="M-9 0 q9 -5 18 0" /></>)}
        {v === 1 && (<><rect x="-31" y="-9" width="22" height="18" rx="5" /><rect x="9" y="-9" width="22" height="18" rx="5" /><path d="M-9 -2 h18" /></>)}
        {v === 2 && (<g fill={c} stroke="none"><path d="M-20 -10 l3.5 7 7.5 1 -5.5 5.5 1.5 7.5 -7 -4 -7 4 1.5 -7.5 -5.5 -5.5 7.5 -1z" /><path d="M20 -10 l3.5 7 7.5 1 -5.5 5.5 1.5 7.5 -7 -4 -7 4 1.5 -7.5 -5.5 -5.5 7.5 -1z" /><path d="M-7 -2 q7 -4 14 0" stroke={c} strokeWidth="3" fill="none" /></g>)}
      </g>
    )
  })()

  const neckY = hy + g.hr * 0.73
  const neckItem = outfit?.neck && (() => {
    const id = outfit.neck!
    const c = itemColor(id), c2 = shade(c, 0.78)
    const v = itemVar(id, 3)
    return (
      <g transform={`translate(100 ${neckY}) scale(${s})`}>
        {v === 0 && (<><path d="M-38 0 q38 18 76 0 l-2 12 q-36 16 -72 0z" fill={c} /><rect x="14" y="6" width="14" height="30" rx="6" fill={c} /><path d="M16 30 h10 M16 24 h10" stroke={c2} strokeWidth="3" strokeLinecap="round" /></>)}
        {v === 1 && (<><path d="M-36 0 q36 16 72 0 l-26 6 -10 20 -10 -20z" fill={c} /><circle cx="0" cy="12" r="3" fill={c2} /></>)}
        {v === 2 && (<><path d="M-34 2 q34 14 68 0 l-2 9 q-32 12 -64 0z" fill={c2} /><path d="M0 8 l-16 -9 v18 z M0 8 l16 -9 v18 z" fill={c} /><circle cx="0" cy="8" r="4.5" fill={c2} /></>)}
      </g>
    )
  })()

  const topItem = outfit?.top && (() => {
    const id = outfit.top!
    const c = itemColor(id), c2 = shade(c, 0.8)
    const v = itemVar(id, 3)
    return (
      <g>
        <ellipse cx="100" cy={g.bcy - g.bry * 0.12} rx={g.brx * 0.97} ry={g.bry * 0.66} fill={c} />
        <path d={`M${100 - g.brx * 0.93} ${g.bcy + g.bry * 0.4} q${g.brx * 0.93} ${g.bry * 0.34} ${g.brx * 1.86} 0`} stroke={c2} strokeWidth="5" fill="none" strokeLinecap="round" />
        {v === 1 && <rect x={100 - g.brx * 0.8} y={g.bcy - g.bry * 0.18} width={g.brx * 1.6} height="9" rx="4.5" fill={c2} />}
        {v === 2 && <path d={`M100 ${g.bcy} c-7 -9 -20 0 0 13 c20 -13 7 -22 0 -13z`} fill="#FAF7F0" opacity="0.9" />}
      </g>
    )
  })()

  const bottomItem = outfit?.bottom && (() => {
    const id = outfit.bottom!
    const c = itemColor(id), c2 = shade(c, 0.8)
    return (
      <g>
        <path d={`M${100 - g.brx * 0.84} ${g.bcy + g.bry * 0.18} q${g.brx * 0.84} ${g.bry * 0.95} ${g.brx * 1.68} 0 q-${g.brx * 0.2} ${g.bry * 0.55} -${g.brx * 0.84} ${g.bry * 0.55} q-${g.brx * 0.64} 0 -${g.brx * 0.84} -${g.bry * 0.55}z`} fill={c} />
        {itemVar(id, 2) === 1 && <circle cx="100" cy={g.bcy + g.bry * 0.62} r="4" fill={c2} />}
      </g>
    )
  })()

  const heldItem = outfit?.held && (() => {
    const id = outfit.held!
    const c = itemColor(id), c2 = shade(c, 0.75)
    const v = itemVar(id, 4)
    return (
      <g transform={`translate(${134 + g.brx * 0.18} ${pawY - 2}) scale(${s})`}>
        {v === 0 && (<><path d="M0 0 q4 -14 0 -26" stroke="#8A5A33" strokeWidth="2" fill="none" /><circle cx="0" cy="-36" r="11" fill={c} /><path d="M-3 -40 a4 4 0 0 1 4 -3" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" /></>)}
        {v === 1 && (<><path d="M0 0 v-18" stroke="#5E8E4A" strokeWidth="3" strokeLinecap="round" /><g transform="translate(0 -24)">{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="0" cy="-6" rx="4" ry="7" fill={c} transform={`rotate(${a})`} />)}<circle r="4.5" fill="#F8D77E" /></g></>)}
        {v === 2 && (<><rect x="-10" y="-22" width="20" height="22" rx="3" fill={c} /><rect x="-10" y="-22" width="6" height="22" rx="2.5" fill={c2} /><path d="M0 -16 q4 -3 7 0 M0 -10 q4 -3 7 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></>)}
        {v === 3 && (<><rect x="-9" y="-20" width="18" height="18" rx="4" fill={c} /><path d="M9 -16 a6 6 0 0 1 0 10" stroke={c} strokeWidth="3.5" fill="none" /><path d="M-4 -24 q2 -4 0 -7 M3 -24 q2 -4 0 -7" stroke={c2} strokeWidth="2.5" fill="none" strokeLinecap="round" /></>)}
      </g>
    )
  })()

  const backItem = outfit?.back && (() => {
    const c = itemColor(outfit.back!)
    return (
      <g transform={`translate(${100 - g.brx - 4} ${g.bcy - 8}) scale(${s})`}>
        <rect x="-14" y="-18" width="26" height="34" rx="10" fill={c} />
        <rect x="-9" y="-2" width="16" height="12" rx="4" fill={shade(c, 0.78)} />
        <path d="M-10 -18 q9 -8 18 0" stroke={shade(c, 0.7)} strokeWidth="4" fill="none" />
      </g>
    )
  })()

  const shoeFor = (cx: number) => outfit?.feet && (
    <g key={cx}>
      <ellipse cx={cx} cy={pawY + 1} rx="17.5" ry="11" fill={itemColor(outfit.feet!)} />
      <ellipse cx={cx} cy={pawY - 4} rx="12" ry="5" fill={shade(itemColor(outfit.feet!), 0.78)} />
    </g>
  )

  const bounce = (begin: string) => walking && (
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 -7; 0 0" dur="0.55s" begin={begin} repeatCount="indefinite" additive="sum" />
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ animation: sleeping ? undefined : 'breathe 3.2s ease-in-out infinite', overflow: 'visible' }}
    >
      <defs>
        {grad('body', body)}
        {grad('ears', ears)}
        {grad('muzzle', muzzle)}
        {grad('paws', paws)}
        {grad('tail', tail)}
        {grad('tummy', tummy)}
      </defs>

      {/* ground shadow */}
      <ellipse cx="100" cy={pawY + 12} rx={g.brx * 0.82} ry="9" fill="#000" opacity="0.1" />

      <g>
        {walking && <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2.5; 0 0" dur="0.55s" repeatCount="indefinite" />}

        {/* tail */}
        <g transform={`translate(${tailX} ${g.bcy}) scale(${g.tail})`}>
          <path d="M0 0 q26 -8 22 -30" stroke={f('tail')} strokeWidth="14" fill="none" strokeLinecap="round">
            {!sleeping && (
              <animateTransform attributeName="transform" type="rotate" values="0 0 0; 10 0 0; 0 0 0" dur={state === 'happy' ? '0.45s' : '0.9s'} repeatCount="indefinite" />
            )}
          </path>
        </g>

        {backItem}

        {/* back paws peeking out */}
        <ellipse cx={100 - g.brx * 0.82} cy={pawY - 2} rx="13" ry="9" fill={shade(paws, 0.9)}>{bounce('0s')}</ellipse>
        <ellipse cx={100 + g.brx * 0.82} cy={pawY - 2} rx="13" ry="9" fill={shade(paws, 0.9)}>{bounce('0.27s')}</ellipse>

        {/* body */}
        <ellipse cx="100" cy={g.bcy} rx={g.brx} ry={g.bry} fill={f('body')} />
        <ellipse cx="100" cy={g.bcy + g.bry * 0.28} rx={g.brx * 0.61} ry={g.bry * 0.58} fill={f('tummy')} />
        {/* soft top highlight on the chest */}
        <ellipse cx={100 - g.brx * 0.28} cy={g.bcy - g.bry * 0.42} rx={g.brx * 0.34} ry={g.bry * 0.22} fill="#fff" opacity="0.16" />
        {bottomItem}
        {topItem}

        {/* front paws */}
        <g>{bounce('0.27s')}<ellipse cx="74" cy={pawY} rx="16" ry="10" fill={f('paws')} />{shoeFor(74)}</g>
        <g>{bounce('0s')}<ellipse cx="126" cy={pawY} rx="16" ry="10" fill={f('paws')} />{shoeFor(126)}</g>

        {/* head group (ears + face scale with stage) */}
        <g transform={`translate(100 ${hy}) scale(${s}) translate(-100 -78)`}>
          {/* long floppy ears framing the face (drawn behind the head) */}
          <g transform={`translate(72 50) scale(1 ${g.ear}) translate(-72 -50)`}>
            <path d="M74 48 C 44 42 26 82 40 116 C 50 138 78 132 79 104 C 80 78 88 54 74 48 Z" fill={f('ears')}>
              {!sleeping && <animateTransform attributeName="transform" type="rotate" values="0 74 50; 3 74 50; 0 74 50; -2 74 50; 0 74 50" dur="6s" repeatCount="indefinite" />}
            </path>
            <path d="M70 60 C 52 58 42 88 52 112 C 59 126 73 122 73 102 C 74 80 80 64 70 60 Z" fill={shade(ears, 0.82)} opacity="0.55" />
          </g>
          <g transform={`translate(128 50) scale(1 ${g.ear}) translate(-128 -50)`}>
            <path d="M126 48 C 156 42 174 82 160 116 C 150 138 122 132 121 104 C 120 78 112 54 126 48 Z" fill={f('ears')}>
              {!sleeping && <animateTransform attributeName="transform" type="rotate" values="0 126 50; -3 126 50; 0 126 50; 2 126 50; 0 126 50" dur="6.8s" repeatCount="indefinite" />}
            </path>
            <path d="M130 60 C 148 58 158 88 148 112 C 141 126 127 122 127 102 C 126 80 120 64 130 60 Z" fill={shade(ears, 0.82)} opacity="0.55" />
          </g>

          {/* head */}
          <circle cx="100" cy="78" r="52" fill={f('body')} />
          <ellipse cx="82" cy="56" rx="21" ry="14" fill="#fff" opacity="0.16" />
          <path d="M91 27 q9 -11 18 0 q-5 7 -9 7 q-4 0 -9 -7z" fill={tuft} />

          {/* soft little snout */}
          <ellipse cx="100" cy="101" rx="19" ry="13.5" fill={f('muzzle')} />
          <ellipse cx="100" cy="94" rx="6.8" ry="5.2" fill="#5C3A1E" />
          <ellipse cx="97.5" cy="92" rx="2.3" ry="1.5" fill="#fff" opacity="0.55" />
          {sleeping ? (
            <path d="M93 106 q7 4 14 0" stroke="#5C3A1E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          ) : state === 'happy' ? (
            <>
              <path d="M89 104 q11 11 22 0" stroke="#5C3A1E" strokeWidth="2.8" fill="none" strokeLinecap="round" />
              <path d="M97 106 q3 6 6 0 z" fill="#E2796B" />
            </>
          ) : (
            <path d="M100 99 v5 M100 104 q-5 5 -9 1 M100 104 q5 5 9 1" stroke="#5C3A1E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          )}

          {/* big glossy eyes */}
          {sleeping ? (
            <>
              <path d="M71 80 q9 6 18 0" stroke="#5C4326" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M111 80 q9 6 18 0" stroke="#5C4326" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : state === 'happy' ? (
            <>
              <path d="M71 82 q9 -9 18 0" stroke="#3E2B14" strokeWidth="4.4" fill="none" strokeLinecap="round" />
              <path d="M111 82 q9 -9 18 0" stroke="#3E2B14" strokeWidth="4.4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="80" cy="80" rx="8.6" ry="9.2" fill="#3E2B14">
                <animate attributeName="ry" values="9.2;9.2;1;9.2" keyTimes="0;0.9;0.95;1" dur="4.4s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="120" cy="80" rx="8.6" ry="9.2" fill="#3E2B14">
                <animate attributeName="ry" values="9.2;9.2;1;9.2" keyTimes="0;0.9;0.95;1" dur="4.4s" repeatCount="indefinite" />
              </ellipse>
              <circle cx="83.5" cy="76" r="3.4" fill="#fff" />
              <circle cx="123.5" cy="76" r="3.4" fill="#fff" />
              <circle cx="77" cy="83.5" r="1.6" fill="#fff" opacity="0.6" />
              <circle cx="117" cy="83.5" r="1.6" fill="#fff" opacity="0.6" />
            </>
          )}

          {/* cheeks */}
          <ellipse cx="66" cy="94" rx="9" ry="6" fill={cheeks} opacity="0.6" />
          <ellipse cx="134" cy="94" rx="9" ry="6" fill={cheeks} opacity="0.6" />

          {faceItem}
        </g>

        {!outfit?.neck && (
          <g transform={`translate(100 ${neckY}) scale(${s})`}>
            <path d="M-38 0 q38 18 76 0 l-3 10 q-35 15 -70 0z" fill="#8E6FC0" />
            <path d="M-34 3 q34 15 68 0" stroke="#A98BD4" strokeWidth="2.5" fill="none" opacity="0.7" />
          </g>
        )}
        {neckItem}
        {headItem}
        {heldItem}

        {sleeping && (
          <g>
            <text x="148" y="44" fontSize="22" fontWeight="700" fill="#8a5a33">z<animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" /></text>
            <text x="162" y="28" fontSize="15" fontWeight="700" fill="#b08552">z<animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="0.7s" repeatCount="indefinite" /></text>
          </g>
        )}
      </g>
    </svg>
  )
}
