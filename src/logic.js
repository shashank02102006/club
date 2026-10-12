export const HOUSES = [
  { name: 'ALPHA', glyph: 'α', color: '#ff7a1a', tagline: 'First in, fastest out' },
  { name: 'INFER', glyph: '∴', color: '#19d3a2', tagline: 'Reasoning at light speed' },
  { name: 'MATRIX', glyph: '▦', color: '#8b6bff', tagline: 'Every cell counts' },
  { name: 'LAYER', glyph: '≡', color: '#ff4d8d', tagline: 'Deep, then deeper' },
]

export const MAX_POINTS = 10000

// Validate the points field. Returns {ok:true,value} or {ok:false,error}.
export function parsePoints(text) {
  const s = String(text ?? '').trim()
  if (s === '') return { ok: false, error: 'Enter the points earned.' }
  if (!/^\d+$/.test(s)) return { ok: false, error: 'Use whole numbers only, like 25.' }
  const value = Number(s)
  if (value < 1) return { ok: false, error: 'Points must be at least 1.' }
  if (value > MAX_POINTS) return { ok: false, error: `Maximum is ${MAX_POINTS.toLocaleString()} points per entry.` }
  return { ok: true, value }
}

// Sum of every entry per house.
export function totalsOf(entries) {
  const t = Object.fromEntries(HOUSES.map((h) => [h.name, 0]))
  for (const e of entries) if (e.house in t) t[e.house] += e.points
  return t
}

// Highest to lowest; ties share a rank (1, 2, 2, 4) and sort alphabetically.
export function rankHouses(totals) {
  const list = HOUSES.map((h) => ({ ...h, points: totals[h.name] ?? 0 })).sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name)
  )
  list.forEach((r, i) => {
    r.rank = i > 0 && r.points === list[i - 1].points ? list[i - 1].rank : i + 1
  })
  return list
}

// Houses sharing first place. Empty until someone has scored.
export function leaders(ranked) {
  return ranked.filter((r) => r.rank === 1 && r.points > 0)
}

export const leaderKey = (entries) =>
  leaders(rankHouses(totalsOf(entries))).map((l) => l.name).join('+')

// Running total per house after each entry (index 0 is the start, all zeros).
export function seriesOf(entries) {
  const run = Object.fromEntries(HOUSES.map((h) => [h.name, 0]))
  const lines = Object.fromEntries(HOUSES.map((h) => [h.name, [0]]))
  for (const e of entries) {
    run[e.house] += e.points
    for (const h of HOUSES) lines[h.name].push(run[h.name])
  }
  const max = Math.max(1, ...Object.values(run))
  return { lines, max }
}
