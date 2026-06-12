import { Hono } from 'hono'
import type { Env } from '../env'

// Built by the payments module agent — see docs/ARCHITECTURE.md
export const paymentsRoutes = new Hono<Env>()
