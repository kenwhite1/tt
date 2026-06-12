import { Hono } from 'hono'
import type { Env } from '../env'

// Built by the quests module agent — see docs/ARCHITECTURE.md
export const questsRoutes = new Hono<Env>()
