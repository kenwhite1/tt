import { Hono } from 'hono'
import type { Env } from '../env'

// Built by the micropets module agent — see docs/ARCHITECTURE.md
export const micropetsRoutes = new Hono<Env>()
