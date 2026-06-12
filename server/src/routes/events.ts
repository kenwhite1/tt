import { Hono } from 'hono'
import type { Env } from '../env'

// Built by the events module agent — see docs/ARCHITECTURE.md
export const eventsRoutes = new Hono<Env>()
