import { useEffect, useState } from 'react'
import { req } from '../api'
import { haptic } from '../telegram'
import { useStore } from '../store'
import { EventCalendar } from './events/EventCalendar'
import { ChallengeSection } from './quests/ChallengeSection'
import { DailyQuests } from './quests/DailyQuests'
import { WeeklyStars } from './quests/WeeklyStars'
import { SpecialQuests } from './quests/SpecialQuests'
import { FriendshipStrip } from './quests/FriendshipStrip'
import type { ChallengeDto, QuestsResp, QuestsState } from './quests/types'

export function Quests() {
  const [qs, setQs] = useState<QuestsState | null>(null)
  const [celebrate, setCelebrate] = useState<ChallengeDto | null>(null)

  useEffect(() => {
    void req<QuestsResp>('/quests/state').then(r => setQs(r.state)).catch(() => {})
  }, [])

  async function act(path: string, body: unknown = {}): Promise<QuestsResp | null> {
    try {
      const r = await req<QuestsResp>(path, body)
      setQs(r.state)
      if (r.reward) {
        haptic('success')
        useStore.getState().showToast(`+${r.reward} 🦴`)
        void useStore.getState().refresh()
      }
      return r
    } catch (e) {
      const msg = (e as { data?: { error?: string } }).data?.error
      useStore.getState().showToast(
        msg === 'one_per_day' ? 'Сегодня уже отмечено — продолжим завтра 💛' : 'Не получилось — попробуй ещё раз',
      )
      return null
    }
  }

  async function checkChallenge(id: string, index: number) {
    haptic('tap')
    const r = await act(`/quests/challenge/${id}/check`, { index })
    if (r?.celebrate) {
      haptic('success')
      const ch = r.state.challenges.find(x => x.id === id)
      if (ch) setCelebrate(ch)
    }
  }

  if (!qs) {
    return (
      <div className="scroll" style={{ paddingTop: 8 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 14 }}>Задания</h1>
        <div className="card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Несу твои задания… 🐾</div>
      </div>
    )
  }

  return (
    <>
      <div className="scroll" style={{ paddingTop: 8 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 14 }}>Задания</h1>

        <EventCalendar />

        <ChallengeSection
          challenges={qs.challenges}
          onJoin={id => { void act(`/quests/challenge/${id}/join`).then(r => { if (r) { haptic('success'); useStore.getState().showToast('Ты в деле! 🎉') } }) }}
          onCheck={(id, i) => void checkChallenge(id, i)}
        />

        <DailyQuests
          daily={qs.daily}
          onClaim={id => void act(`/quests/daily/${id}/claim`)}
          onDone={id => void act(`/quests/daily/${id}/done`).then(r => { if (r) haptic('success') })}
          onAnswer={answer => void act('/quests/daily/answer', { answer })}
        />

        <WeeklyStars weekly={qs.weekly} onClaim={(sca, tier) => void act(`/quests/weekly/${sca}/claim`, { tier })} />

        <SpecialQuests special={qs.special} onClaim={id => void act(`/quests/special/${id}/claim`)} />

        <FriendshipStrip />
      </div>

      {celebrate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setCelebrate(null)}
        >
          <div className="card" style={{ textAlign: 'center', maxWidth: 320, margin: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{celebrate.badge}</div>
            <h2 style={{ marginBottom: 8 }}>Испытание «{celebrate.name}» пройдено!</h2>
            <p style={{ margin: '0 0 14px', color: 'var(--ink-soft)', fontSize: 14 }}>
              Ты сделал(а) все {celebrate.goals.length} дел — я тобой так горжусь! Значок уже в твоей коллекции, а памятная табличка ждёт в сумке 🏅
            </p>
            <button className="btn accent" style={{ width: '100%' }} onClick={() => setCelebrate(null)}>Ура!</button>
          </div>
        </div>
      )}
    </>
  )
}
