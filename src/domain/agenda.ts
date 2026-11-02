import { record, list, unique, choice } from './validation.ts'
import { single, id, integer, provenance } from './shared.ts'
export type Segment = {
  id: string
  title: string
  minutes: number
  kind: 'activity' | 'break'
  note: string
}
export type Workspace = {
  version: 1
  name: string
  start: number
  budget: number
  segments: Segment[]
}
export type AgendaEditor = Omit<Workspace, 'start' | 'budget' | 'segments'> & {
  start: string
  budget: string
  segments: (Omit<Segment, 'minutes'> & { minutes: string })[]
}
export const sample: Workspace = {
  version: 1,
  name: 'The community ideas morning',
  start: 570,
  budget: 120,
  segments: [
    {
      id: 'welcome',
      title: 'A warm welcome',
      minutes: 10,
      kind: 'activity',
      note: 'Names, a shared intention, and one small hope.',
    },
    {
      id: 'discover',
      title: 'Map the possibilities',
      minutes: 25,
      kind: 'activity',
      note: 'Work in pairs. Capture ideas before choosing a direction.',
    },
    {
      id: 'pause',
      title: 'Tea & a little pause',
      minutes: 10,
      kind: 'break',
      note: 'Step away from the table and stretch.',
    },
    {
      id: 'make',
      title: 'Make something small',
      minutes: 35,
      kind: 'activity',
      note: 'Turn one idea into a sketch that someone else can try.',
    },
    {
      id: 'share',
      title: 'Share and reflect',
      minutes: 20,
      kind: 'activity',
      note: 'One observation, one question, and a next step.',
    },
  ],
}
export function parseWorkspace(value: unknown): Workspace {
  const o = record(value, 'Workspace')
  if (o.version !== 1) throw new Error('Expected WA/1 workspace.')
  const segments = list(o.segments, 'Segments', 16).map((v) => {
    const s = record(v, 'Segment')
    return {
      id: id(s.id),
      title: single(s.title, 'Segment title', 60),
      minutes: integer(s.minutes, 'Duration', 1, 180),
      kind: choice(s.kind, 'Segment kind', ['activity', 'break']),
      note: single(s.note, 'Segment note', 240, true),
    }
  })
  if (!segments.length) throw new Error('Keep at least one segment.')
  unique(
    segments.map((s) => s.id),
    'Segment identities',
  )
  const w: Workspace = {
    version: 1,
    name: single(o.name, 'Workspace title', 80),
    start: integer(o.start, 'Start time', 0, 1439),
    budget: integer(o.budget, 'Time budget', 1, 720),
    segments,
  }
  if (w.start + segments.reduce((sum, s) => sum + s.minutes, 0) > 1440)
    throw new Error('Agenda must finish by midnight on the same day.')
  return w
}
export function timeLabel(minutes: number) {
  return minutes === 1440
    ? '24:00'
    : `${Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
}
export function editorFrom(w: Workspace): AgendaEditor {
  return {
    ...w,
    start: timeLabel(w.start),
    budget: String(w.budget),
    segments: w.segments.map((s) => ({ ...s, minutes: String(s.minutes) })),
  }
}
export function parseEditor(e: AgendaEditor): Workspace {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.start))
    throw new Error('Start time must use HH:MM, from 00:00 to 23:59.')
  const number = (v: string, label: string) => {
    if (!/^\d{1,3}$/.test(v)) throw new Error(`${label} must be whole minutes.`)
    return Number(v)
  }
  const [hours, minutes] = e.start.split(':').map(Number)
  return parseWorkspace({
    ...e,
    start: hours! * 60 + minutes!,
    budget: number(e.budget, 'Time budget'),
    segments: e.segments.map((s) => ({ ...s, minutes: number(s.minutes, 'Duration') })),
  })
}
export type Timeline = {
  workspace: Workspace
  rows: (Segment & { start: number; end: number })[]
  total: number
  remaining: number
}
export function timeline(w: Workspace): Timeline {
  const workspace = parseWorkspace(w)
  let cursor = workspace.start
  const rows = workspace.segments.map((s) => {
    const start = cursor
    cursor += s.minutes
    return { ...s, start, end: cursor }
  })
  return {
    workspace,
    rows,
    total: cursor - workspace.start,
    remaining: workspace.budget - (cursor - workspace.start),
  }
}
export function exportWorkspace(value: Workspace) {
  const w = parseWorkspace(value)
  return { ...w, provenance: provenance('WA', 'vue-workshop-agenda-studio', w) }
}
function md(value: string) {
  return value.replace(/[\\`*_[\]<>|]/g, '\\$&')
}
export function exportMarkdown(value: Workspace) {
  const w = parseWorkspace(value),
    plan = timeline(w),
    identity = exportWorkspace(w).provenance
  return `# ${md(w.name)}\n\nStart: ${timeLabel(w.start)} · Planned: ${plan.total} min · Budget: ${w.budget} min\n\n| Time | Segment | Minutes | Kind |\n| --- | --- | ---: | --- |\n${plan.rows.map((s) => `| ${timeLabel(s.start)}–${timeLabel(s.end)} | ${md(s.title)} | ${s.minutes} | ${s.kind} |`).join('\n')}\n\n${plan.rows
    .filter((s) => s.note)
    .map((s) => `**${md(s.title)}** — ${md(s.note)}`)
    .join('\n\n')}\n\n${identity.marker} · ${identity.author} · ${identity.project}\n`
}
