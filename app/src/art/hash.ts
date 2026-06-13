// Tiny deterministic helpers shared by procedural art components (art module only).

/** FNV-1a string hash → unsigned 32-bit int. Deterministic across sessions. */
export function hashStr(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Pick an element of `arr` from a hash (or any uint). */
export function pick<T>(arr: readonly T[], h: number): T {
  return arr[h % arr.length]
}

/** Lighten (f > 1) or darken (f < 1) a #rrggbb hex color. */
export function shade(hex: string, f: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)))
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
