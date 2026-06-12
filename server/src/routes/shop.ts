import { Hono } from 'hono'
import type { Env } from '../env'

// Built by the shop module agent — see docs/ARCHITECTURE.md
export const shopRoutes = new Hono<Env>()
