import { Hono } from 'hono'
import type { Env } from '../env'

// Built by the activities module agent — see docs/ARCHITECTURE.md
export const activitiesRoutes = new Hono<Env>()
