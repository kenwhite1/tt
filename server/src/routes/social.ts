import { Hono } from 'hono'
import type { Env } from '../env'

// Built by the social module agent — see docs/ARCHITECTURE.md
export const socialRoutes = new Hono<Env>()
