// Питомец tab: profile card (ABOUT/DETAILS/TRAITS), streak card with repair,
// collections (микропитомцы → микропедия, локации, открытия, значки).
// Built by the micropets module agent.
import { useEffect, useState } from 'react'
import { C } from '@shared/constants'
import { req } from '../api'
import { useStore } from '../store'
import { haptic } from '../telegram'
import { Mascot } from '../art/Mascot'
import { Micropet } from '../art/Micropet'
import { Micropedia } from './micropets/Micropedia'
import type { MicropetsDto } from './micropets/MicropetsSection'

const STAGE_RU: Record<string, string> = {
 baby: 'Малыш', toddler: 'Кроха', child: 'Ребёнок', teen: 'Подросток', adult: 'Взрослый',
}
const PRONOUN_RU: Record<string, string> = { he: 'Он', she: 'Она', they: 'Они' }
const TRAIT_RU: Record<string, string> = {
 curiosity: 'Любопытный', confidence: 'Смелый', compassion: 'Добрый',
 logic: 'Рассудительный', resilience: 'Стойкий', security: 'Спокойный',
}
const DIM_RU: Record<string, string> = {
 confidence: 'Смелость', curiosity: 'Любопытство', security: 'Спокойствие',
 resilience: 'Стойкость', compassion: 'Доброта', logic: 'Рассудительность',
}
const DIMS = ['confidence', 'curiosity', 'security', 'resilience', 'compassion', 'logic']
const CATEGORY_RU: Record<string, string> = {
 food: 'Еда', drinks: 'Напитки', music: 'Музыка', books: 'Книги', films: 'Фильмы',
}

function plural(n: number, forms: [string, string, string]): string {
 const a = Math.abs(n) % 100
 const b = a % 10
 if (a > 10 && a < 20) return forms[2]
 if (b === 1) return forms[0]
 if (b >= 2 && b <= 4) return forms[1]
 return forms[2]
}

function ruDate(day: string): string {
 try {
 return new Date(`${day}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
 } catch { return day }
}

interface ProfileDto { lifetimeStones: number; personality: Record<string, number>; trait: string }
interface BadgeDto { id: string; ts: number }
interface DiscoveryEntry { id?: string; ruName?: string; ru_name?: string; name?: string; category?: string; liked?: boolean | number; locationId?: string }
interface LogbookInfo { visited: number; total: number; firstName: string; firstPct: number }

function normalizeLogbook(r: unknown): LogbookInfo | null {
 const o = r as Record<string, unknown>
 const list = (o?.locations ?? o?.logbook ?? null) as Record<string, unknown>[] | null
 if (!Array.isArray(list)) return null
 const visited = list.filter(l => (l.visited as boolean) || (Number(l.pct) || 0) > 0 || l.firstVisitDay || l.first_visit_day)
 const first = visited[0] ?? list[0]
 return {
 visited: Math.max(1, visited.length),
 total: Number(o?.total) || list.length || 27,
 firstName: String(first?.ruName ?? first?.ru_name ?? first?.name ?? 'Тёплый лес'),
 firstPct: Math.round(Number(first?.pct) || 0),
 }
}

export function Pet() {
 const state = useStore(s => s.state)
 const showToast = useStore(s => s.showToast)
 const [view, setView] = useState<'main' | 'pedia' | 'discoveries'>('main')
 const [tab, setTab] = useState<'about' | 'details' | 'traits'>('about')
 const [profile, setProfile] = useState<ProfileDto | null>(null)
 const [mpets, setMpets] = useState<MicropetsDto | null>(null)
 const [logbook, setLogbook] = useState<LogbookInfo | null>(null)
 const [discoveries, setDiscoveries] = useState<DiscoveryEntry[] | null>(null)
 const [badges, setBadges] = useState<BadgeDto[]>([])
 const [dCat, setDCat] = useState<string>('all')
 const [repairing, setRepairing] = useState(false)

 useEffect(() => {
 req<ProfileDto>('/micropets/profile').then(setProfile).catch(() => {})
 req<MicropetsDto>('/micropets').then(setMpets).catch(() => {})
 req<{ badges: BadgeDto[] }>('/micropets/badges').then(r => setBadges(r.badges)).catch(() => {})
 req<unknown>('/travel/logbook').then(r => setLogbook(normalizeLogbook(r))).catch(() => {})
 req<{ discoveries?: DiscoveryEntry[] }>('/travel/discoveries')
 .then(r => setDiscoveries(Array.isArray(r?.discoveries) ? r.discoveries : []))
 .catch(() => setDiscoveries([]))
 }, [])

 if (!state) return null
 const { pet, user } = state

 if (view === 'pedia') {
 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <Micropedia onBack={() => setView('main')} />
 </div>
 )
 }

 if (view === 'discoveries') {
 const list = discoveries ?? []
 const cats = ['all', ...Array.from(new Set(list.map(d => d.category).filter((x): x is string => !!x)))]
 const shown = dCat === 'all' ? list : list.filter(d => d.category === dCat)
 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 12px' }}>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={() => setView('main')}>‹</button>
 <h1 style={{ flex: 1 }}>🔍 Открытия</h1>
 <span style={{ fontWeight: 800, color: 'var(--brown)' }}>{list.length}</span>
 </div>
 <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }}>
 {cats.map(cat => (
 <button key={cat} className={dCat === cat ? 'btn' : 'btn ghost'} style={{ padding: '8px 14px', whiteSpace: 'nowrap' }} onClick={() => { haptic('tap'); setDCat(cat) }}>
 {cat === 'all' ? 'Все' : (CATEGORY_RU[cat] ?? cat)}
 </button>
 ))}
 </div>
 {shown.length === 0 && (
 <div className="card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
 Пока пусто, открытия появляются после прогулок и бесед с питомцем ✨
 </div>
 )}
 {shown.map((d, i) => {
 const liked = !!d.liked
 return (
 <div key={d.id ?? i} className="goal-row" style={{ borderLeft: `6px solid ${liked ? '#6fa8dc' : 'var(--red)'}` }}>
 <span style={{ fontSize: 20 }}>{liked ? '💙' : '❤️‍🩹'}</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>{d.ruName ?? d.ru_name ?? d.name ?? d.id}</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
 {(d.category && (CATEGORY_RU[d.category] ?? d.category)) ?? ''} · {liked ? 'нравится' : 'не нравится'}
 </div>
 </div>
 </div>
 )
 })}
 </div>
 )
 }

 // ---------- main ----------
 const ageDays = Math.max(0, Math.round((Date.parse(state.day) - Date.parse(pet.hatchDay)) / 86_400_000))
 const personality = profile?.personality ?? {}
 const maxDim = Math.max(10, ...DIMS.map(d => Number(personality[d]) || 0))
 const streakBroke = user.streak <= 1 && user.streakBest > 1
 const ownedPets = mpets?.pets ?? []
 const previewPets = ownedPets.slice(0, 3)

 async function repairStreak() {
 setRepairing(true)
 try {
 await req('/activities/streak/repair', {})
 haptic('success')
 showToast('Серия восстановлена! 🌞')
 await useStore.getState().refresh()
 } catch {
 haptic('warn')
 showToast('Пока не получилось починить серию')
 } finally {
 setRepairing(false)
 }
 }

 function copyCode() {
 haptic('tap')
 try {
 void navigator.clipboard?.writeText(user.friendCode)
 showToast('Код друга скопирован ⧉')
 } catch { /* clipboard unavailable */ }
 }

 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 {/* profile card */}
 <div className="card">
 <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
 <div className="portrait-frame">
 <Mascot species={pet.species} size={104} />
 </div>
 <div style={{ flex: 1 }}>
 <h1>{STAGE_RU[pet.stage]} {pet.name}</h1>
 <div style={{ color: 'var(--ink-soft)', fontWeight: 700 }}>{PRONOUN_RU[pet.pronouns]}</div>
 <button onClick={copyCode} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
 <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-deep)', marginTop: 8 }}>КОД ДРУГА</div>
 <div className="copy-chip">{user.friendCode} ⧉</div>
 </button>
 </div>
 </div>

 <div style={{ display: 'flex', gap: 6, margin: '14px 0 10px' }}>
 {([['about', 'О питомце'], ['details', 'Детали'], ['traits', 'Характер']] as const).map(([id, ru]) => (
 <button key={id} className={tab === id ? 'btn' : 'btn ghost'} style={{ flex: 1, padding: '8px 0', fontSize: 14 }} onClick={() => { haptic('tap'); setTab(id) }}>
 {ru}
 </button>
 ))}
 </div>

 {tab === 'about' && (
 <div style={{ display: 'grid', gap: 8 }}>
 <Row label="🎂 День рождения" value={ruDate(pet.hatchDay)} />
 <Row label="🌱 Возраст" value={`${ageDays} ${plural(ageDays, ['день', 'дня', 'дней'])}`} />
 <Row label="🌳 Прогулок" value={String(pet.walks)} />
 </div>
 )}
 {tab === 'details' && (
 <div style={{ display: 'grid', gap: 8 }}>
 <Row label="💫 Характер" value={TRAIT_RU[pet.trait] ?? pet.trait} />
 <Row label="🦴 Косточек собрано" value={profile ? String(profile.lifetimeStones) : '…'} />
 <Row label="🌞 Лучшая серия" value={`${user.streakBest} ${plural(user.streakBest, ['день', 'дня', 'дней'])}`} />
 </div>
 )}
 {tab === 'traits' && (
 <div style={{ display: 'grid', gap: 10 }}>
 {DIMS.map(d => {
 const v = Number(personality[d]) || 0
 return (
 <div key={d}>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, marginBottom: 3 }}>
 <span>{DIM_RU[d]}</span><span style={{ color: 'var(--ink-soft)' }}>{v}</span>
 </div>
 <div className="energy-track" style={{ height: 10 }}>
 <div className="energy-fill" style={{ width: `${Math.min(100, (v / maxDim) * 100)}%` }} />
 </div>
 </div>
 )
 })}
 <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Характер растёт из твоих ответов на прогулках ✨</div>
 </div>
 )}
 </div>

 {/* streak card */}
 <div className="card">
 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <span className="stat-orb">🌞</span>
 <div style={{ flex: 1 }}>
 <b style={{ fontSize: 20 }}>{user.streak} </b>
 {plural(user.streak, ['день подряд', 'дня подряд', 'дней подряд'])}
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Лучшая серия заботы о себе: {user.streakBest}</div>
 </div>
 <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)' }}>🔧 {user.repairs}</span>
 </div>
 {streakBroke && (
 <div style={{ marginTop: 10, background: 'var(--card-shade)', borderRadius: 14, padding: 12 }}>
 <div style={{ fontWeight: 800, marginBottom: 6 }}>Серия прервалась, бывает! 💛</div>
 <button className="btn accent" style={{ width: '100%' }} disabled={user.repairs === 0 || repairing} onClick={() => void repairStreak()}>
 🔧 Починить серию ({user.repairs} {plural(user.repairs, ['починка', 'починки', 'починок'])})
 </button>
 </div>
 )}
 </div>

 <h2 style={{ margin: '8px 4px 10px' }}>Коллекция</h2>

 {/* micropets → micropedia */}
 <button className="card" style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => { haptic('tap'); setView('pedia') }}>
 <h2 style={{ marginBottom: 10 }}>Микропитомцы</h2>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
 {[0, 1, 2].map(i => {
 const p = previewPets[i]
 return (
 <div key={i} className={'slot' + (p ? '' : ' locked')} style={{ fontSize: 30 }}>
 {p ? <Micropet speciesId={p.speciesId} variantHex={p.variantHex} adult={p.adult} size={56} /> : '❓'}
 </div>
 )
 })}
 </div>
 <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 800, color: 'var(--brown)' }}>
 {mpets?.ownedSpecies ?? 0} / {mpets?.speciesTotal ?? 62} ›
 </div>
 </button>

 {/* locations preview */}
 <div className="card">
 <h2 style={{ marginBottom: 10 }}>Локации</h2>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
 <div className="slot-live" style={{ fontSize: 26 }}>
 🌲
 <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{logbook?.firstPct ?? 1}%</span>
 </div>
 {[0, 1].map(i => (
 <div key={i} className="slot locked" style={{ fontSize: 30 }}>❓</div>
 ))}
 </div>
 <div style={{ fontSize: 13, textAlign: 'center', marginTop: 6, fontWeight: 700 }}>
 {logbook?.firstName ?? 'Тёплый лес'}, {logbook?.firstPct ?? 1}%
 </div>
 <div style={{ textAlign: 'center', marginTop: 6, fontWeight: 800, color: 'var(--brown)' }}>
 {logbook?.visited ?? 1} / {logbook?.total ?? 27} ›
 </div>
 </div>

 {/* discoveries */}
 <button className="card" style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => { haptic('tap'); setView('discoveries') }}>
 <h2 style={{ marginBottom: 6 }}>Открытия</h2>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
 Что питомец любит и не любит, узнаётся в беседах после прогулок
 </div>
 <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 800, color: 'var(--brown)' }}>
 {discoveries?.length ?? 0} ›
 </div>
 </button>

 {/* badges */}
 <div className="card">
 <h2 style={{ marginBottom: 10 }}>Значки испытаний</h2>
 {badges.length === 0 ? (
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Пока нет значков, загляни в задания, там ждут испытания! 🏅</div>
 ) : (
 <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
 {badges.map(b => (
 <div key={b.id} style={{ textAlign: 'center', minWidth: 64 }}>
 <div className="badge-orb">🏅</div>
 <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)' }}>{b.id}</div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )
}

function Row({ label, value }: { label: string; value: string }) {
 return (
 <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--card-shade)', borderRadius: 12, padding: '10px 12px' }}>
 <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>{label}</span>
 <span style={{ fontWeight: 800 }}>{value}</span>
 </div>
 )
}
