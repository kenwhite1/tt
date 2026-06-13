// Golden puppy — original flat-vector rig, v2.
// Growth stages, dyeable layers, outfit anchor slots, SMIL micro-animations
// (blink, ear twitch, tail wag, walking leg bounce). Backward compatible: { size, state }.
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
  /** itemId per anchor slot — rendered as iconic flat accessory shapes */
  outfit?: Partial<Record<OutfitSlot, string>>
}

// Proportions per growth stage: baby = compact & round, adult = taller, longer ears/tail.
const GEO: Record<Stage, { hr: number; hy: number; brx: number; bry: number; bcy: number; ear: number; tail: number }> = {
  baby:    { hr: 55, hy: 94, brx: 53, bry: 37, bcy: 152, ear: 0.75, tail: 0.72 },
  toddler: { hr: 53, hy: 86, brx: 58, bry: 42, bcy: 146, ear: 0.86, tail: 0.85 },
  child:   { hr: 52, hy: 78, brx: 62, bry: 48, bcy: 138, ear: 1.0,  tail: 1.0 },
  teen:    { hr: 49, hy: 69, brx: 60, bry: 55, bcy: 134, ear: 1.12, tail: 1.1 },
  adult:   { hr: 47, hy: 62, brx: 59, bry: 61, bcy: 131, ear: 1.22, tail: 1.2 },
}

const ACCENTS = ['#E2574C', '#4BA3DD', '#7FB069', '#8E6FC0', '#F2A93B', '#F2A7C3', '#5FA854', '#3D8E9E'] as const

export function Puppy({ size = 180, state = 'idle', stage = 'child', dyes, outfit }: Props) {
  const sleeping = state === 'sleeping'
  const walking = state === 'walking'
  const g = GEO[stage] ?? GEO.child
  const s = g.hr / 52 // facial-feature scale relative to the original child head
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
  const tuft = shade(body, 0.92)

  const itemColor = (id: string) => pick(ACCENTS, hashStr(id))
  const itemVar = (id: string, n: number) => hashStr(id + '#v') % n

  // ---- outfit pieces (iconic flat shapes, anchored to the rig) ----
  const headItem = outfit?.head && (() => {
    const id = outfit.head!
    const c = itemColor(id), c2 = shade(c, 0.8)
    const v = itemVar(id, 4)
    return (
      <g transform={`translate(100 ${hy - g.hr + 2}) scale(${s})`}>
        {v === 0 && ( // кепка
          <>
            <path d="M-26 4 a26 20 0 0 1 52 0 z" fill={c} />
            <path d="M0 -2 h34 a6 6 0 0 1 0 10 l-34 -4z" fill={c2} />
            <circle cx="0" cy="-14" r="4" fill={c2} />
          </>
        )}
        {v === 1 && ( // шапочка с помпоном
          <>
            <path d="M-26 6 a26 24 0 0 1 52 0 z" fill={c} />
            <rect x="-27" y="2" width="54" height="8" rx="4" fill={c2} />
            <circle cx="0" cy="-20" r="6" fill="#FAF7F0" />
          </>
        )}
        {v === 2 && ( // венок
          <>
            {[-22, -11, 0, 11, 22].map(x => (
              <g key={x} transform={`translate(${x} ${Math.abs(x) * 0.18 - 2})`}>
                <circle r="5.5" fill={c} />
                <circle r="2.2" fill="#F8D77E" />
              </g>
            ))}
          </>
        )}
        {v === 3 && ( // колпачок
          <>
            <path d="M-16 6 L0 -26 L16 6 z" fill={c} />
            <circle cx="0" cy="-26" r="4.5" fill={c2} />
            <path d="M-16 6 q16 6 32 0" stroke={c2} strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
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
        {v === 2 && (
          <g fill={c} stroke="none">
            <path d="M-20 -10 l3.5 7 7.5 1 -5.5 5.5 1.5 7.5 -7 -4 -7 4 1.5 -7.5 -5.5 -5.5 7.5 -1z" />
            <path d="M20 -10 l3.5 7 7.5 1 -5.5 5.5 1.5 7.5 -7 -4 -7 4 1.5 -7.5 -5.5 -5.5 7.5 -1z" />
            <path d="M-7 -2 q7 -4 14 0" stroke={c} strokeWidth="3" fill="none" />
          </g>
        )}
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
        {v === 0 && ( // шарф
          <>
            <path d="M-38 0 q38 18 76 0 l-2 12 q-36 16 -72 0z" fill={c} />
            <rect x="14" y="6" width="14" height="30" rx="6" fill={c} />
            <path d="M16 30 h10 M16 24 h10" stroke={c2} strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {v === 1 && ( // бандана
          <>
            <path d="M-36 0 q36 16 72 0 l-26 6 -10 20 -10 -20z" fill={c} />
            <circle cx="0" cy="12" r="3" fill={c2} />
          </>
        )}
        {v === 2 && ( // бантик
          <>
            <path d="M-34 2 q34 14 68 0 l-2 9 q-32 12 -64 0z" fill={c2} />
            <path d="M0 8 l-16 -9 v18 z M0 8 l16 -9 v18 z" fill={c} />
            <circle cx="0" cy="8" r="4.5" fill={c2} />
          </>
        )}
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
        {v === 2 && (
          <path d={`M100 ${g.bcy} c-7 -9 -20 0 0 13 c20 -13 7 -22 0 -13z`} fill="#FAF7F0" opacity="0.9" />
        )}
      </g>
    )
  })()

  const bottomItem = outfit?.bottom && (() => {
    const id = outfit.bottom!
    const c = itemColor(id), c2 = shade(c, 0.8)
    return (
      <g>
        <path d={`M${100 - g.brx * 0.84} ${g.bcy + g.bry * 0.18} q${g.brx * 0.84} ${g.bry * 0.95} ${g.brx * 1.68} 0 q-${g.brx * 0.2} ${g.bry * 0.55} -${g.brx * 0.84} ${g.bry * 0.55} q-${g.brx * 0.64} 0 -${g.brx * 0.84} -${g.bry * 0.55}z`} fill={c} />
        {itemVar(outfit.bottom!, 2) === 1 && <circle cx="100" cy={g.bcy + g.bry * 0.62} r="4" fill={c2} />}
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

  // walking leg bounce, alternating phase
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
      <g>
        {walking && <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2.5; 0 0" dur="0.55s" repeatCount="indefinite" />}

        {/* tail */}
        <g transform={`translate(${tailX} ${g.bcy}) scale(${g.tail})`}>
          <path d="M0 0 q26 -8 22 -30" stroke={tail} strokeWidth="14" fill="none" strokeLinecap="round">
            {!sleeping && (
              <animateTransform attributeName="transform" type="rotate" values="0 0 0; 10 0 0; 0 0 0" dur={state === 'happy' ? '0.45s' : '0.9s'} repeatCount="indefinite" />
            )}
          </path>
        </g>

        {backItem}

        {/* back paws peeking out */}
        <ellipse cx={100 - g.brx * 0.82} cy={pawY - 2} rx="13" ry="9" fill={shade(paws, 0.92)}>{bounce('0s')}</ellipse>
        <ellipse cx={100 + g.brx * 0.82} cy={pawY - 2} rx="13" ry="9" fill={shade(paws, 0.92)}>{bounce('0.27s')}</ellipse>

        {/* body */}
        <ellipse cx="100" cy={g.bcy} rx={g.brx} ry={g.bry} fill={body} />
        <ellipse cx="100" cy={g.bcy + g.bry * 0.28} rx={g.brx * 0.61} ry={g.bry * 0.58} fill={tummy} />
        {bottomItem}
        {topItem}

        {/* front paws */}
        <g>{bounce('0.27s')}<ellipse cx="74" cy={pawY} rx="16" ry="10" fill={paws} />{shoeFor(74)}</g>
        <g>{bounce('0s')}<ellipse cx="126" cy={pawY} rx="16" ry="10" fill={paws} />{shoeFor(126)}</g>

        {/* head group (ears + face scale with stage) */}
        <g transform={`translate(100 ${hy}) scale(${s}) translate(-100 -78)`}>
          {/* ears (length scaled per stage, anchored at the top joint) */}
          <g transform={`translate(52 56) scale(1 ${g.ear}) translate(-52 -56)`}>
            <path d="M52 56 q-14 34 8 50 q16 -6 14 -34 q-4 -16 -22 -16z" fill={ears}>
              {!sleeping && (
                <animateTransform attributeName="transform" type="rotate" values="0 52 56; 0 52 56; -9 52 56; 0 52 56; 0 52 56" keyTimes="0; 0.86; 0.9; 0.94; 1" dur="5.6s" repeatCount="indefinite" />
              )}
            </path>
          </g>
          <g transform={`translate(148 56) scale(1 ${g.ear}) translate(-148 -56)`}>
            <path d="M148 56 q14 34 -8 50 q-16 -6 -14 -34 q4 -16 22 -16z" fill={ears}>
              {!sleeping && (
                <animateTransform attributeName="transform" type="rotate" values="0 148 56; 0 148 56; 8 148 56; 0 148 56; 0 148 56" keyTimes="0; 0.45; 0.49; 0.53; 1" dur="7.3s" repeatCount="indefinite" />
              )}
            </path>
          </g>

          <circle cx="100" cy="78" r="52" fill={body} />
          <path d="M92 28 q8 -10 16 0 q-4 6 -8 6 q-4 0 -8 -6z" fill={tuft} />

          {/* muzzle + nose + mouth */}
          <ellipse cx="100" cy="94" rx="24" ry="18" fill={muzzle} />
          <ellipse cx="100" cy="86" rx="9" ry="7" fill="#6F4322" />
          {sleeping ? (
            <path d="M92 102 q8 4 16 0" stroke="#6F4322" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : state === 'happy' ? (
            <>
              <path d="M88 99 q12 12 24 0" stroke="#6F4322" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M96 102 q4 7 8 0 z" fill="#E2796B" />
            </>
          ) : (
            <path d="M90 100 q5 7 10 0 q5 7 10 0" stroke="#6F4322" strokeWidth="3" fill="none" strokeLinecap="round" />
          )}

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
              <ellipse cx="80" cy="72" rx="6" ry="6" fill="#3E2B14">
                <animate attributeName="ry" values="6;6;0.8;6" keyTimes="0;0.9;0.95;1" dur="4.4s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="120" cy="72" rx="6" ry="6" fill="#3E2B14">
                <animate attributeName="ry" values="6;6;0.8;6" keyTimes="0;0.9;0.95;1" dur="4.4s" repeatCount="indefinite" />
              </ellipse>
              <circle cx="82" cy="70" r="2" fill="#fff" />
              <circle cx="122" cy="70" r="2" fill="#fff" />
            </>
          )}

          {/* cheeks */}
          <ellipse cx="64" cy="88" rx="8" ry="5" fill={cheeks} opacity="0.7" />
          <ellipse cx="136" cy="88" rx="8" ry="5" fill={cheeks} opacity="0.7" />

          {faceItem}
        </g>

        {/* collar (hidden when a neck item is worn) */}
        {!outfit?.neck && (
          <g transform={`translate(100 ${neckY}) scale(${s})`}>
            <path d="M-38 0 q38 18 76 0 l-3 10 q-35 15 -70 0z" fill="#8E6FC0" />
          </g>
        )}
        {neckItem}
        {headItem}
        {heldItem}

        {sleeping && (
          <g>
            <text x="148" y="44" fontSize="22" fontWeight="700" fill="#8a5a33">
              z
              <animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" />
            </text>
            <text x="162" y="28" fontSize="15" fontWeight="700" fill="#b08552">
              z
              <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="0.7s" repeatCount="indefinite" />
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}
