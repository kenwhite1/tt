// Hamburger menu + activities hub — built by the activities module agent.
interface Props { onClose(): void }

export function Menu({ onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 60, padding: 'calc(var(--safe-top) + 16px) 16px 16px' }}>
      <button className="btn ghost" onClick={onClose}>✕</button>
      <h1 style={{ marginTop: 12 }}>Меню</h1>
      <p style={{ color: 'var(--ink-soft)' }}>Активности, цели, инсайты — скоро.</p>
    </div>
  )
}
