import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import './db'
import './jobs'
import { api } from './api'
import { bot, botWebhook } from './bot'
import { DEV_MODE } from './auth'

const app = new Hono()
app.route('/api', api)

const WEBHOOK_PATH = `/bot/${process.env.WEBHOOK_SECRET ?? 'hook'}`
const hook = botWebhook
if (hook) app.post(WEBHOOK_PATH, c => hook(c))

// static SPA (app/dist), path must be relative to process cwd for serveStatic
const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', '..', 'app', 'dist')
if (existsSync(dist)) {
 const rel = relative(process.cwd(), dist)
 app.use('/*', serveStatic({ root: rel }))
 app.get('*', serveStatic({ path: join(rel, 'index.html') }))
}

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, async () => {
 console.log(`druzhok server on :${port}${DEV_MODE ? ' (DEV MODE, no bot token)' : ''}`)
 if (bot && process.env.APP_URL) {
 const hookUrl = `${process.env.APP_URL.replace(/\/$/, '')}${WEBHOOK_PATH}`
 try {
 await bot.api.setWebhook(hookUrl)
 console.log(`webhook set: ${hookUrl}`)
 } catch (e) {
 console.error('setWebhook failed', e)
 }
 }
})
