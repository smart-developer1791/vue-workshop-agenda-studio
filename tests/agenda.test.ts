import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ref, isReactive } from 'vue'
import {
  sample,
  parseWorkspace,
  editorFrom,
  parseEditor,
  timeline,
  timeLabel,
  exportWorkspace,
  exportMarkdown,
} from '../src/domain/agenda.ts'
import { useAgenda } from '../src/composables/useAgenda.ts'
test('sample is complete, canonical, detached, and marker changes with content', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
  )
  assert.deepEqual(parseWorkspace(fixture), sample)
  assert.deepEqual(exportWorkspace(sample), fixture)
  const parsed = parseWorkspace(sample)
  parsed.segments[0]!.title = 'Changed'
  assert.notEqual(parsed.segments[0]!.title, sample.segments[0]!.title)
  assert.notEqual(exportWorkspace(parsed).provenance.marker, fixture.provenance.marker)
  assert.deepEqual(parseWorkspace({ ...sample, extra: 1, provenance: { marker: 'spoof' } }), sample)
})
test('strict schema rejects primitive coercion, identities, limits, and midnight overflow', () => {
  for (const value of [
    { ...sample, name: ['x'] },
    { ...sample, start: '570' },
    { ...sample, budget: 0 },
    { ...sample, start: 1439 },
    { ...sample, segments: [] },
    { ...sample, segments: [sample.segments[0], sample.segments[0]] },
    { ...sample, segments: [{ ...sample.segments[0], kind: ['activity'] }] },
    { ...sample, segments: [{ ...sample.segments[0], minutes: 1.5 }] },
    { ...sample, segments: [{ ...sample.segments[0], id: 'constructor' }] },
  ])
    assert.throws(() => parseWorkspace(value))
})
test('timeline keeps exact downstream boundaries and explicit time budget overruns', () => {
  const plan = timeline(sample)
  assert.equal(plan.total, 100)
  assert.equal(plan.remaining, 20)
  assert.equal(plan.rows.at(-1)!.end, 670)
  assert.deepEqual(
    plan.rows.map((r) => r.start),
    [570, 580, 605, 615, 650],
  )
  assert.equal(timeLabel(670), '11:10')
  const midnight = timeline({
    ...sample,
    start: 1430,
    budget: 5,
    segments: [{ ...sample.segments[0]!, minutes: 10 }],
  })
  assert.equal(midnight.remaining, -5)
  assert.equal(timeLabel(midnight.rows[0]!.end), '24:00')
})
test('textual editor accepts whole minute fields without blank/exponent coercion', () => {
  assert.deepEqual(parseEditor(editorFrom(sample)), sample)
  for (const value of ['', '1e2', '2.5', '-2']) {
    const e = editorFrom(sample)
    e.segments[0]!.minutes = value
    assert.throws(() => parseEditor(e))
  }
  for (const start of ['24:00', '9:30', '12:60', ''])
    assert.throws(() => parseEditor({ ...editorFrom(sample), start }))
})
test('Vue previous-value computed retains detached timeline and resumes after valid edits', () => {
  const editor = ref(editorFrom(sample)),
    { plan, validation } = useAgenda(editor, sample)
  const original = plan.value
  assert.equal(isReactive(original), false)
  editor.value.segments[0]!.minutes = ''
  assert.ok(validation.value.error)
  assert.equal(plan.value, original)
  editor.value.segments[0]!.title = 'A pending title'
  assert.equal(plan.value.rows[0]!.title, sample.segments[0]!.title)
  editor.value.segments[0]!.minutes = '15'
  assert.equal(validation.value.error, '')
  assert.equal(plan.value.total, 105)
  assert.equal(plan.value.rows[0]!.title, 'A pending title')
  assert.notEqual(plan.value, original)
})
test('Markdown exports complete notes, rows, provenance, and escaped user syntax', () => {
  const w = {
    ...sample,
    name: 'Name | <script>*',
    segments: [{ ...sample.segments[0]!, note: '[Hello] | `quote`' }],
  }
  const md = exportMarkdown(w)
  assert.ok(md.includes('Name \\| \\<script\\>\\*'))
  assert.ok(md.includes('\\[Hello\\] \\| \\`quote\\`'))
  assert.ok(md.includes('09:30–09:40'))
  assert.match(md, /WA-[A-F0-9]{8}/)
  assert.ok(md.includes('CodeSculptor'))
})
