import type { UserRow } from './engine/rows'

export type Env = { Variables: { user: UserRow } }

export function hasPlus(user: UserRow): boolean {
  if (process.env.PLUS_ENFORCED !== '1') return true // dormant paywall: everyone passes
  const today = user.last_day ?? ''
  return !!user.plus_until && user.plus_until >= today
}
