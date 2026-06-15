// Lightweight Russian case declension for pet/person names (animate nouns).
// Heuristic by ending; falls back to the nominative for indeclinable or
// unrecognised forms, so it never reads worse than leaving the name unchanged.
//   gen  родительный  «для Сони, от Бублика»
//   dat  дательный    «Соне, Бублику»
//   prep предложный   «о Соне, о Бублике»
//   ins  творительный «с Соней, с Бубликом»
export type RuCase = 'gen' | 'dat' | 'prep' | 'ins'

const HUSH = 'жчшщ'
const VELAR = 'гкх'

export function declineName(name: string, c: RuCase): string {
  const n = (name ?? '').trim()
  if (n.length < 2) return n
  const low = n.toLowerCase()
  const last = low.slice(-1)
  const prev = low.slice(-2, -1)
  const stem = n.slice(0, -1)

  // …а (Луна, Кнопа, Тоша)
  if (last === 'а') {
    if (c === 'gen') return stem + (HUSH.includes(prev) || VELAR.includes(prev) ? 'и' : 'ы')
    if (c === 'ins') return stem + (HUSH.includes(prev) ? 'ей' : 'ой')
    return stem + 'е' // dat, prep
  }
  // …я (Соня, Шуня)
  if (last === 'я') {
    if (c === 'gen') return stem + 'и'
    if (c === 'ins') return stem + 'ей'
    return stem + 'е'
  }
  // indeclinable vowel endings (Барни, Лео, Бьянку…) — leave as-is
  if ('еёиоуыэю'.includes(last)) return n
  // …й (Андрей)
  if (last === 'й') {
    if (c === 'gen') return stem + 'я'
    if (c === 'dat') return stem + 'ю'
    if (c === 'ins') return stem + 'ем'
    return stem + 'е'
  }
  // …ь (soft masculine default)
  if (last === 'ь') {
    if (c === 'gen') return stem + 'я'
    if (c === 'dat') return stem + 'ю'
    if (c === 'ins') return stem + 'ем'
    return stem + 'е'
  }
  // consonant → hard masculine, with fleeting -о/-е/-ё before final к (Пирожок → Пирожк-)
  const fleet = /^(.+)[оеё]к$/i.exec(n)
  const base = fleet ? fleet[1] + 'к' : n
  const tail = base.slice(-1).toLowerCase()
  if (c === 'gen') return base + 'а'
  if (c === 'dat') return base + 'у'
  if (c === 'ins') return base + (HUSH.includes(tail) || tail === 'ц' ? 'ем' : 'ом')
  return base + 'е' // prep
}
