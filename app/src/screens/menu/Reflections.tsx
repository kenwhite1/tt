// Размышления: prompted reflections by tab, free-form journal, history list.
import { useEffect, useState } from 'react'
import { req } from '../../api'
import { ReflectionEditor } from './ReflectionEditor'
import { Chip, ChipRow, Loading, Sub, VALENCE_EMOJI, fmtDay, useContent } from './ui'
import type { PromptFull, ReflectionsDto } from './types'

const TAB_RU: Record<string, string> = {
  SOS: 'SOS', Calm: 'Спокойствие', Morning: 'Утро', DeepDives: 'Глубокие темы',
  Night: 'Вечер', BigPicture: 'Картина целиком', Energize: 'Заряд',
}
const TAB_ORDER = ['Morning', 'Calm', 'Night', 'Energize', 'DeepDives', 'BigPicture', 'SOS']

export function Reflections({ onBack }: { onBack(): void }) {
  const content = useContent()
  const [data, setData] = useState<ReflectionsDto | null>(null)
  const [tab, setTab] = useState<string>('Morning')
  const [editing, setEditing] = useState<PromptFull | null | 'free'>(null as never)
  const [open, setOpen] = useState(false)

  const load = () => { req<ReflectionsDto>('/activities/reflections').then(setData).catch(() => {}) }
  useEffect(load, [])

  if (open) {
    return (
      <Sub title="Размышления" onBack={() => { setOpen(false); load() }}>
        <ReflectionEditor
          prompt={editing === 'free' ? null : editing}
          onDone={() => { setOpen(false); load() }}
        />
      </Sub>
    )
  }

  const plus = content?.plus ?? true
  const prompts = data?.prompts.filter(p => p.tabs?.includes(tab)) ?? []

  return (
    <Sub title="Размышления" onBack={onBack}>
      <button
        className="card" style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}
        onClick={() => { setEditing('free'); setOpen(true) }}
      >
        <b>📝 Свободная запись</b>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Просто выговориться. 4–8⚡ — чем больше напишешь, тем больше энергии.</div>
      </button>

      <ChipRow>
        {TAB_ORDER.map(t => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{TAB_RU[t]}</Chip>
        ))}
        <Chip active={tab === 'history'} onClick={() => setTab('history')}>Дневник</Chip>
      </ChipRow>

      {!data && <Loading />}

      {tab === 'history' && data && (
        data.history.length === 0
          ? <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Записей пока нет. Начни с любой темы — я подскажу вопросы.</p>
          : data.history.map(h => (
            <div key={h.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-soft)', fontWeight: 800 }}>
                <span>{fmtDay(h.day)}</span>
                <span>{h.valence !== null ? VALENCE_EMOJI[String(h.valence)] : ''}</span>
              </div>
              <b>{h.title}</b>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', whiteSpace: 'pre-line' }}>{h.snippet}{h.snippet.length >= 140 ? '…' : ''}</div>
            </div>
          ))
      )}

      {tab !== 'history' && data && prompts.map(p => {
        const locked = p.plus && !plus
        return (
          <button
            key={p.id}
            className="goal-row"
            style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, opacity: locked ? 0.6 : 1 }}
            onClick={() => { if (!locked) { setEditing(p); setOpen(true) } }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ fontWeight: 800, display: 'block' }}>{p.title}{locked ? ' 🔒' : ''}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{p.steps.length > 1 ? `${p.steps.length} шагов` : 'один вопрос'}</span>
            </span>
            <span style={{ fontWeight: 800 }}>⚡ {p.energy}</span>
          </button>
        )
      })}
    </Sub>
  )
}
