import assert from 'node:assert/strict'
import { parsePoints, totalsOf, rankHouses, leaders, seriesOf, leaderKey } from './logic.js'

const E = (house, points) => ({ house, points })

// validation
assert.equal(parsePoints('').ok, false)
assert.equal(parsePoints('abc').ok, false)
assert.equal(parsePoints('2.5').ok, false)
assert.equal(parsePoints('-5').ok, false)
assert.equal(parsePoints('0').ok, false)
assert.equal(parsePoints('10001').ok, false)
assert.deepEqual(parsePoints(' 25 '), { ok: true, value: 25 })

// totals + ranking
const entries = [E('ALPHA', 40), E('INFER', 25), E('MATRIX', 40), E('LAYER', 10), E('INFER', 20)]
const t = totalsOf(entries)
assert.deepEqual(t, { ALPHA: 40, INFER: 45, MATRIX: 40, LAYER: 10 })
const r = rankHouses(t)
assert.deepEqual(r.map((x) => [x.name, x.rank]), [['INFER', 1], ['ALPHA', 2], ['MATRIX', 2], ['LAYER', 4]])
assert.deepEqual(leaders(r).map((x) => x.name), ['INFER'])

// ties for first and the empty state
assert.deepEqual(leaders(rankHouses(totalsOf([E('ALPHA', 5), E('LAYER', 5)]))).map((x) => x.name), ['ALPHA', 'LAYER'])
assert.deepEqual(leaders(rankHouses(totalsOf([]))), [])
assert.equal(leaderKey([]), '')

// chart series
const s = seriesOf(entries)
assert.deepEqual(s.lines.INFER, [0, 0, 25, 25, 25, 45])
assert.equal(s.max, 45)

console.log('All logic tests passed')
