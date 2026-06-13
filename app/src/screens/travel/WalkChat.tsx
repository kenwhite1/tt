// Post-walk chat («Поговорить со щенком») — once a day after the walk.
// Rendered by Home when walk.completed && !walk.chatDone.
import { useEffect, useState } from 'react'
import { req } from '../../api'
import { useStore } from '../../store'
import { haptic } from '../../telegram'

interface ChatStory { ruText: string; replies: string[]; customAllowed: boolean }
interface ChatGetRes { done: boolean; story?: ChatStory }
interface DiscoveryCard { id: string; ruName: string; category: string; liked: boolean }
interface ChatPostRes { stones: number; discovery: DiscoveryCard | null }

const CAT_EMOJI: Record<string, string> = {
  food: '🍩', drinks: '🍹', music: '🎵', books: '📚', films: '🎬', activities: '🎈',
}
const CAT_RU: Record<string, string> = {
  food: 'Еда', drinks: 'Напитки', music: 'Музыка', books: 'Книги', films: 'Фильмы', activities: 'Занятия',
}

export function WalkChat({ walkId, onDone }: { walkId: number; onDone(): void }) {
  const petName = useStore(s => s.state?.pet.name ?? 'Дружок')
  const [open, setOpen] = useState(false)
  const [story, setStory] = useState<ChatStory | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [customText, setCustomText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ChatPostRes | null>(null)

  useEffect(() => {
    req<ChatGetRes>(`/travel/chat/${walkId}`)
      .then(r => { if (r.done) onDone(); else setStory(r.story ?? null) })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkId])

  async function send(body: { replyIdx: number } | { custom: string }) {
    if (sending) return
    setSending(true)
    try {
      const r = await req<ChatPostRes>(`/travel/chat/${walkId}`, body)
      haptic('success')
      setResult(r)
      void useStore.getState().refresh()
    } catch {
      setSending(false)
    }
  }

  function close() {
    setOpen(false)
    onDone()
  }

  if (!story) return null

  if (!open) {
    return (
      <button className="btn accent" style={{ marginTop: 8 }} onClick={() => { haptic('tap'); setOpen(true) }}>
        💬 Поговорить со щенком
      </button>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 45, display: 'flex', alignItems: 'flex-end', textAlign: 'left' }}
      onClick={() => { if (result) close() }}
    >
      <div
        className="card"
        style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {!result ? (
          <>
            <h2 style={{ marginBottom: 10 }}>🐾 {petName} вернулся с прогулки!</h2>
            <div className="card" style={{ background: 'var(--card-shade)', marginBottom: 12 }}>
              <p style={{ margin: 0, lineHeight: 1.45 }}>{story.ruText}</p>
            </div>
            {!customMode ? (
              <>
                {story.replies.map((r, i) => (
                  <button
                    key={i}
                    className="btn ghost"
                    style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start', textAlign: 'left' }}
                    disabled={sending}
                    onClick={() => void send({ replyIdx: i })}
                  >{r}</button>
                ))}
                {story.customAllowed && (
                  <button
                    className="btn ghost"
                    style={{ width: '100%', color: 'var(--ink-soft)' }}
                    disabled={sending}
                    onClick={() => setCustomMode(true)}
                  >✍️ Свой ответ</button>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 2px 8px' }}>
                  Свой ответ останется между вами — открытие в дневник не запишется.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Напиши щенку…"
                    style={{ flex: 1, border: '2px solid var(--gold)', borderRadius: 12, padding: '10px 12px', fontSize: 16, fontFamily: 'inherit' }}
                  />
                  <button
                    className="btn"
                    disabled={sending || !customText.trim()}
                    onClick={() => void send({ custom: customText.trim() })}
                  >➤</button>
                </div>
                <button
                  className="btn ghost"
                  style={{ width: '100%', marginTop: 8, color: 'var(--ink-soft)' }}
                  onClick={() => setCustomMode(false)}
                >← Назад к вариантам</button>
              </>
            )}
          </>
        ) : (
          <>
            {result.discovery ? (
              <div
                className="card"
                style={{
                  textAlign: 'center',
                  background: result.discovery.liked ? '#e3eefb' : '#fdeceb',
                  border: `3px solid ${result.discovery.liked ? '#4f86c6' : 'var(--red)'}`,
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 44 }}>{CAT_EMOJI[result.discovery.category] ?? '✨'}</div>
                <h2 style={{ margin: '6px 0 4px' }}>Открытие: {result.discovery.ruName}</h2>
                <div style={{ fontWeight: 800, color: result.discovery.liked ? '#4f86c6' : 'var(--red)' }}>
                  {result.discovery.liked ? `${petName} в восторге! 💙` : `${petName} не оценил… ❤️‍🩹`}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
                  {CAT_RU[result.discovery.category] ?? 'Открытие'} · записано в дневник открытий
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', background: 'var(--card-shade)', marginBottom: 12 }}>
                <div style={{ fontSize: 40 }}>🐶💛</div>
                <p style={{ margin: '6px 0 0', fontWeight: 800 }}>Щенку было важно поделиться этим с тобой.</p>
              </div>
            )}
            <p style={{ textAlign: 'center', fontWeight: 800, margin: '0 0 12px' }}>+{result.stones} 🦴 за тёплый разговор</p>
            <button className="btn accent" style={{ width: '100%' }} onClick={close}>Обнять щенка 🤗</button>
          </>
        )}
      </div>
    </div>
  )
}
