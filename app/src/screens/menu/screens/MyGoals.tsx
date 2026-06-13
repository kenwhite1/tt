// Мои цели: list active/paused/archived goals + an edit sheet (rename/emoji/sca/timesPerDay/
// pause/archive/delete). Add still happens on Home / Идеи целей via the core endpoint.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { useStore } from '../../../store'
import { haptic } from '../../../telegram'
import { Loading, Sub } from '../ui'
import type { MyGoal, MyGoalsDto, Sca } from '../types'

function EditSheet({ goal, scas, onClose, onChanged }: { goal: MyGoal; scas: Sca[]; onClose(): void; onChanged(): void }) {
  const [title, setTitle] = useState(goal.title)
  const [emoji, setEmoji] = useState(goal.emoji)
  const [sca, setSca] = useState<string | null>(goal.sca)
  const [times, setTimes] = useState(goal.timesPerDay)
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  async function patch(body: Record<string, unknown>, toast?: string) {
    if (busy) return
    setBusy(true)
    try {
      await req(`/activities/goals/${goal.id}`, body)
      haptic('success')
      if (toast) useStore.getState().showToast(toast)
      void useStore.getState().refresh()
      onChanged()
    } catch (e) {
      const msg = (e as { data?: { error?: string } }).data?.error
      useStore.getState().showToast(msg === 'plus_required' ? 'Свои эмодзи — в Плюсе' : 'Не получилось')
      setBusy(false)
    }
  }

  async function del() {
    if (busy) return
    setBusy(true)
    try {
      await req(`/activities/goals/${goal.id}/delete`, {})
      haptic('warn')
      useStore.getState().showToast('Цель удалена')
      void useStore.getState().refresh()
      onChanged()
    } catch { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 65, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))', maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ textAlign: 'center', marginBottom: 14 }}>Цель</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={emoji} onChange={e => setEmoji(e.target.value.slice(0, 4))}
            style={{ width: 56, textAlign: 'center', border: '2px solid var(--gold)', borderRadius: 12, padding: 10, fontSize: 20, fontFamily: 'inherit' }}
          />
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            style={{ flex: 1, border: '2px solid var(--gold)', borderRadius: 12, padding: '10px 12px', fontSize: 16, fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink-soft)', margin: '8px 2px 6px' }}>Сфера заботы</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button onClick={() => setSca(null)} style={chip(sca === null)}>— нет —</button>
          {scas.map(s => <button key={s.id} onClick={() => setSca(s.id)} style={chip(sca === s.id)}>{s.emoji} {s.ru}</button>)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 2px 4px' }}>
          <div style={{ flex: 1, fontWeight: 800 }}>Раз в день: {times}</div>
          <button className="btn ghost" style={{ padding: '6px 14px' }} onClick={() => setTimes(t => Math.max(1, t - 1))}>−</button>
          <button className="btn ghost" style={{ padding: '6px 14px' }} onClick={() => setTimes(t => Math.min(20, t + 1))}>+</button>
        </div>

        <button className="btn" style={{ width: '100%', marginTop: 12 }} disabled={busy}
          onClick={() => void patch({ title: title.trim() || goal.title, emoji, sca, timesPerDay: times }, 'Сохранено 💛')}>
          Сохранить
        </button>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn ghost" style={{ flex: 1 }} disabled={busy} onClick={() => void patch({ paused: !goal.paused }, goal.paused ? 'Цель снова активна' : 'Цель на паузе')}>
            {goal.paused ? '▶ Возобновить' : '⏸ Пауза'}
          </button>
          <button className="btn ghost" style={{ flex: 1 }} disabled={busy} onClick={() => void patch({ archived: !goal.archived }, goal.archived ? 'Из архива' : 'В архив')}>
            {goal.archived ? '↩ Вернуть' : '🗄 В архив'}
          </button>
        </div>

        {confirmDel ? (
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Удалить совсем? История этой цели исчезнет.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>Отмена</button>
              <button className="btn" style={{ flex: 1, background: 'var(--red)', boxShadow: '0 4px 0 #b8392f' }} disabled={busy} onClick={() => void del()}>Удалить</button>
            </div>
          </div>
        ) : (
          <button className="btn ghost" style={{ width: '100%', marginTop: 10, color: 'var(--red)' }} onClick={() => setConfirmDel(true)}>Удалить цель</button>
        )}
      </div>
    </div>
  )
}

function chip(active: boolean): React.CSSProperties {
  return {
    border: 'none', borderRadius: 999, padding: '7px 12px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    background: active ? 'var(--accent)' : 'var(--card-shade)', color: active ? '#fff' : 'var(--brown)',
  }
}

export function MyGoals({ onBack }: { onBack(): void }) {
  const [data, setData] = useState<MyGoalsDto | null>(null)
  const [editing, setEditing] = useState<MyGoal | null>(null)

  const load = () => { req<MyGoalsDto>('/activities/goals').then(setData).catch(() => {}) }
  useEffect(load, [])

  if (!data) return <Sub title="Мои цели" onBack={onBack}><Loading /></Sub>

  const active = data.goals.filter(g => !g.paused && !g.archived)
  const paused = data.goals.filter(g => g.paused && !g.archived)
  const archived = data.goals.filter(g => g.archived)

  const Group = ({ ru, list }: { ru: string; list: MyGoal[] }) => list.length === 0 ? null : (
    <>
      <h2 style={{ margin: '10px 4px 8px' }}>{ru}</h2>
      {list.map(g => (
        <button key={g.id} className="goal-row" style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, opacity: g.archived ? 0.6 : 1 }} onClick={() => { haptic('tap'); setEditing(g) }}>
          <span style={{ fontSize: 24 }}>{g.emoji}</span>
          <span style={{ flex: 1 }}>
            <span style={{ fontWeight: 800, display: 'block' }}>{g.title}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              {g.timesPerDay > 1 ? `${g.doneToday}/${g.timesPerDay} сегодня` : (g.doneToday > 0 ? 'сделано сегодня' : 'раз в день')}
            </span>
          </span>
          <span style={{ color: 'var(--ink-soft)', fontWeight: 800 }}>✎</span>
        </button>
      ))}
    </>
  )

  return (
    <Sub title="Мои цели" onBack={onBack}>
      {data.goals.length === 0 && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Целей пока нет. Добавь их на главном экране или из «Идей целей».</p>}
      <Group ru="Активные" list={active} />
      <Group ru="На паузе" list={paused} />
      <Group ru="Архив" list={archived} />
      {editing && <EditSheet goal={editing} scas={data.scas} onClose={() => setEditing(null)} onChanged={() => { setEditing(null); load() }} />}
    </Sub>
  )
}
