import { useState, useEffect, useMemo } from 'react'
import { HOUSES, parsePoints, totalsOf, rankHouses, leaders, leaderKey, seriesOf } from './logic.js'

const KEY = 'tachyon-house-cup-v1'
const ROW = 84
const QUICK = [5, 10, 25, 50]
const CONFETTI_COLORS = [...HOUSES.map((h) => h.color), '#ffd23f']
const DEMO = [
  ['ALPHA', 40, 'Hackathon win'], ['INFER', 25, 'Quiz round'], ['MATRIX', 35, 'Code sprint'],
  ['LAYER', 30, 'Debate'], ['INFER', 30, 'Robotics demo'], ['ALPHA', 15, 'Clean lab'],
  ['LAYER', 25, 'Poster contest'], ['MATRIX', 20, 'Peer teaching'], ['INFER', 10, 'Attendance'],
  ['LAYER', 20, 'Relay race'],
]

const fmt = (n) => n.toLocaleString()
const byName = Object.fromEntries(HOUSES.map((h) => [h.name, h]))
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    if (!Array.isArray(v)) return []
    return v.filter((e) => e && byName[e.house] && Number.isInteger(e.points) && e.points > 0)
  } catch {
    return []
  }
}

function Confetti({ burst }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        drift: (Math.random() - 0.5) * 220,
        spin: (Math.random() - 0.5) * 900,
        delay: Math.random() * 0.4,
        dur: 1.8 + Math.random() * 1.2,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [burst]
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  )
}

function Chart({ entries }) {
  const W = 640, H = 230, PX = 16, PY = 20
  const n = entries.length
  if (n === 0) return <p className="empty">The race chart appears after the first entry.</p>
  const { lines, max } = seriesOf(entries)
  const x = (i) => PX + (i / n) * (W - PX * 2)
  const y = (v) => H - PY - (v / max) * (H - PY * 2)
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Running total of points for each house">
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1={PX} x2={W - PX} y1={y(max * f)} y2={y(max * f)} className="grid" />
      ))}
      {HOUSES.map((h) => {
        const pts = lines[h.name]
        const d = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
        return (
          <g key={h.name} style={{ '--c': h.color }}>
            <path d={d} className="line" />
            <circle cx={x(n)} cy={y(pts[n])} r="5" className="dot" />
          </g>
        )
      })}
      <text x={PX} y={12} className="axis">{fmt(max)}</text>
      <text x={PX} y={H - 4} className="axis">0</text>
    </svg>
  )
}

export default function App() {
  const [entries, setEntries] = useState(load)
  const [house, setHouse] = useState(HOUSES[0].name)
  const [pts, setPts] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [burst, setBurst] = useState(0)
  const [toast, setToast] = useState('')

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(entries)) } catch {}
  }, [entries])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(0), 3200)
    return () => clearTimeout(t)
  }, [burst])

  const ranked = useMemo(() => rankHouses(totalsOf(entries)), [entries])
  const lead = leaders(ranked)
  const total = ranked.reduce((s, r) => s + r.points, 0)
  const top = ranked[0].points
  const biggest = entries.reduce((b, e) => (!b || e.points > b.points ? e : b), null)
  const tiedRanks = new Set(ranked.filter((r, i, a) => a.some((o, j) => j !== i && o.rank === r.rank)).map((r) => r.rank))

  function submit(e) {
    e.preventDefault()
    const p = parsePoints(pts)
    if (!p.ok) return setError(p.error)
    const entry = { id: newId(), house, points: p.value, reason: reason.trim().slice(0, 60), ts: Date.now() }
    const next = [...entries, entry]
    const before = leaderKey(entries)
    const after = leaderKey(next)
    setEntries(next)
    setError('')
    setPts('')
    setReason('')
    if (after && after !== before) {
      setBurst(Date.now())
      setToast(`${after.replace('+', ' & ')} ${after.includes('+') ? 'share' : 'takes'} the lead!`)
    } else {
      setToast(`+${fmt(p.value)} for ${house}`)
    }
  }

  const undo = () => setEntries((list) => list.slice(0, -1))
  const remove = (id) => setEntries((list) => list.filter((x) => x.id !== id))
  const reset = () => {
    if (entries.length && window.confirm('Clear all points for every house?')) setEntries([])
  }
  const loadDemo = () => {
    const now = Date.now()
    setEntries(DEMO.map(([h, p, r], i) => ({ id: newId(), house: h, points: p, reason: r, ts: now - (DEMO.length - i) * 600000 })))
  }
  async function copy() {
    const text = ['Tachyon House Cup', ...ranked.map((r) => `${r.rank}. ${r.name} - ${fmt(r.points)}`)].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setToast('Results copied')
    } catch {
      setToast('Copy is not available in this browser')
    }
  }

  return (
    <>
      <div className="streaks" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
      </div>
      {burst > 0 && <Confetti burst={burst} />}
      <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>

      <main>
        <header>
          <p className="kicker">Tachyon</p>
          <h1>House Cup</h1>
          <div className="banner" aria-live="polite">
            {lead.length === 0 ? (
              <span>No points yet. The race starts with your first entry.</span>
            ) : (
              <>
                <span className="crown">♛</span>
                <span>
                  {lead.length > 1 ? 'Tied for first: ' : 'Winning house: '}
                  <b>{lead.map((l) => l.name).join(' & ')}</b> with {fmt(top)} points{lead.length > 1 ? ' each' : ''}
                </span>
              </>
            )}
          </div>
        </header>

        <section className="panel">
          <h2>Award points</h2>
          <form onSubmit={submit} noValidate>
            <div className="houses" role="radiogroup" aria-label="House">
              {HOUSES.map((h) => (
                <button
                  type="button"
                  key={h.name}
                  role="radio"
                  aria-checked={house === h.name}
                  className={`pick ${house === h.name ? 'on' : ''}`}
                  style={{ '--c': h.color }}
                  onClick={() => setHouse(h.name)}
                >
                  <span className="glyph">{h.glyph}</span>
                  {h.name}
                </button>
              ))}
            </div>
            <div className="fields">
              <label>
                Points earned
                <input
                  value={pts}
                  onChange={(e) => { setPts(e.target.value); setError('') }}
                  inputMode="numeric"
                  placeholder="e.g. 25"
                  aria-invalid={!!error}
                  aria-describedby="err"
                />
              </label>
              <label>
                Reason (optional)
                <input value={reason} maxLength={60} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Quiz round" />
              </label>
            </div>
            <div className="chips">
              {QUICK.map((q) => (
                <button type="button" key={q} onClick={() => { setPts(String(q)); setError('') }}>+{q}</button>
              ))}
            </div>
            <p id="err" className="error" role="alert">{error}</p>
            <button className="go" type="submit" style={{ '--c': byName[house].color }}>
              Add points to {house}
            </button>
          </form>
        </section>

        <section className="stats">
          <div><span>Total points</span><b>{fmt(total)}</b></div>
          <div><span>Entries</span><b>{entries.length}</b></div>
          <div>
            <span>Biggest award</span>
            <b>{biggest ? `+${fmt(biggest.points)}` : '-'}</b>
            {biggest && <small>{biggest.house}</small>}
          </div>
        </section>

        <section className="panel">
          <h2>The arena</h2>
          <div className="arena">
            {HOUSES.map((h) => {
              const r = ranked.find((x) => x.name === h.name)
              const pct = top ? (r.points / top) * 100 : 0
              return (
                <div className="col" key={h.name} style={{ '--c': h.color }}>
                  <span className="val">{fmt(r.points)}</span>
                  <div className="track"><div className="fill" style={{ height: `${pct}%` }} /></div>
                  <span className="glyph big">{h.glyph}</span>
                  <span className="cname">{h.name}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <h2>Leaderboard</h2>
          <ol className="board" style={{ height: ranked.length * ROW }}>
            {ranked.map((r, i) => (
              <li
                key={r.name}
                className={`row ${r.rank === 1 && r.points > 0 ? 'lead' : ''}`}
                style={{ '--c': r.color, transform: `translateY(${i * ROW}px)`, height: ROW - 10 }}
              >
                <span className="rank">{r.rank === 1 && r.points > 0 ? '♛' : r.rank}</span>
                <span className="glyph">{r.glyph}</span>
                <span className="who">
                  <b>{r.name}</b>
                  <small>
                    {tiedRanks.has(r.rank) ? `Tied for ${r.rank === 1 ? 'first' : `place ${r.rank}`}` : r.tagline}
                    {total > 0 && ` · ${Math.round((r.points / total) * 100)}% of all points`}
                  </small>
                </span>
                <span className="pts">{fmt(r.points)}</span>
                <span className="bar"><i style={{ width: `${top ? (r.points / top) * 100 : 0}%` }} /></span>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <h2>Race to the top</h2>
          <Chart entries={entries} />
          <div className="legend">
            {HOUSES.map((h) => (
              <span key={h.name} style={{ '--c': h.color }}><i />{h.name}</span>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Activity</h2>
          {entries.length === 0 ? (
            <div className="empty">
              <p>Nothing recorded yet.</p>
              <button type="button" onClick={loadDemo}>Load demo data</button>
            </div>
          ) : (
            <ul className="feed">
              {entries.slice().reverse().map((e) => (
                <li key={e.id} style={{ '--c': byName[e.house].color }}>
                  <span className="tag">+{fmt(e.points)}</span>
                  <span className="what">
                    <b>{e.house}</b>
                    {e.reason && <small>{e.reason}</small>}
                  </span>
                  <time>{new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  <button type="button" className="x" onClick={() => remove(e.id)} aria-label={`Remove ${e.points} points for ${e.house}`}>×</button>
                </li>
              ))}
            </ul>
          )}
          <div className="actions">
            <button type="button" onClick={undo} disabled={!entries.length}>Undo last</button>
            <button type="button" onClick={copy}>Copy results</button>
            <button type="button" onClick={reset} disabled={!entries.length}>Reset all</button>
          </div>
        </section>

        <footer>
          Ranking: each house's total is the sum of its entries. Houses are sorted high to low, ties share a rank, and rank 1 wins.
        </footer>
      </main>
    </>
  )
}
