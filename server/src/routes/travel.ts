import { Hono } from 'hono'
import type { Env } from '../env'

// Built by the travel module agent — see docs/ARCHITECTURE.md
export const travelRoutes = new Hono<Env>()
