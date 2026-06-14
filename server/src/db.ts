import Database from 'better-sqlite3'
import cron from 'node-cron'
import { mkdirSync, readdirSync, readFileSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR ?? join(here, '..', '..', 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new Database(join(dataDir, 'druzhok.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('synchronous = NORMAL') // WAL-recommended: durable enough, far less fsync stalling
db.pragma('busy_timeout = 5000')  // wait instead of throwing SQLITE_BUSY under concurrent access

function migrate() {
  db.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT)')
  const dir = join(here, 'migrations')
  const applied = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[]).map(r => r.name),
  )
  for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    if (applied.has(f)) continue
    db.transaction(() => {
      db.exec(readFileSync(join(dir, f), 'utf8'))
      db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(f, new Date().toISOString())
    })()
    console.log(`migrated: ${f}`)
  }
}

// Run at module load so every importer sees a ready schema.
migrate()

// ---- automated daily backups (online snapshot + 7-day rotation) ----
// Guards against DB corruption / a bad deploy. NOTE: backups live on the same
// volume, so this does not protect against volume loss — for that, ship them
// off-box (e.g. S3) which needs storage creds.
const backupDir = join(dataDir, 'backups')
export async function backupNow(): Promise<string> {
  mkdirSync(backupDir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 10)
  const dest = join(backupDir, `druzhok-${stamp}.sqlite`)
  await db.backup(dest)
  const files = readdirSync(backupDir).filter(f => f.endsWith('.sqlite')).sort()
  for (const f of files.slice(0, Math.max(0, files.length - 7))) {
    try { unlinkSync(join(backupDir, f)) } catch { /* ignore */ }
  }
  return dest
}
cron.schedule('0 3 * * *', () => {
  backupNow().then(p => console.log(`db backup → ${p}`)).catch(e => console.error('db backup failed', e))
})
// one snapshot shortly after boot, so a fresh deploy always has a recent copy
setTimeout(() => { backupNow().catch(() => { /* ignore */ }) }, 30_000)
