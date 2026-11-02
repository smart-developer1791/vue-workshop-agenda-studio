<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import { useDraft } from './services/draft'
import { download } from './services/files'
import {
  sample,
  parseWorkspace,
  editorFrom,
  exportWorkspace,
  exportMarkdown,
  timeLabel,
} from './domain/agenda'
import { useAgenda } from './composables/useAgenda'
const { draft, storageStatus } = useDraft('vue-workshop-agenda-studio:v1', sample, parseWorkspace)
const editor = ref(editorFrom(draft.value))
const { validation, plan } = useAgenda(editor, draft.value)
watch(validation, (next) => {
  if (next.workspace) draft.value = next.workspace
})
const selectedId = ref(editor.value.segments[0]!.id)
const selected = computed(
  () => editor.value.segments.find((s) => s.id === selectedId.value) ?? editor.value.segments[0]!,
)
const removeOpen = ref(false)
const marker = computed(() => exportWorkspace(draft.value).provenance.marker)
function replace(value: unknown) {
  const w = parseWorkspace(value)
  draft.value = w
  editor.value = editorFrom(w)
  selectedId.value = w.segments[0]!.id
}
const serialize = (value: unknown) => exportWorkspace(parseWorkspace(value))
function add() {
  if (validation.value.error) return
  const id = `segment-${crypto.randomUUID().slice(0, 8)}`
  editor.value.segments.push({
    id,
    title: 'A new conversation',
    minutes: '10',
    kind: 'activity',
    note: '',
  })
  selectedId.value = id
}
function move(delta: number) {
  const list = editor.value.segments,
    index = list.findIndex((s) => s.id === selected.value.id),
    target = index + delta
  if (validation.value.error || target < 0 || target >= list.length) return
  const item = list.splice(index, 1)[0]!
  list.splice(target, 0, item)
}
function remove() {
  editor.value.segments = editor.value.segments.filter((s) => s.id !== selected.value.id)
  selectedId.value = editor.value.segments[0]!.id
  removeOpen.value = false
}
function saveMarkdown() {
  download(`${marker.value}.md`, exportMarkdown(draft.value), 'text/markdown;charset=utf-8')
}
const position = computed(() => editor.value.segments.findIndex((s) => s.id === selected.value.id))
// Both views bind to the same draft fields; the computed timeline keeps its previous valid result.
const activeCount = computed(() => plan.value.rows.filter((s) => s.kind === 'activity').length)
</script>
<template>
  <div
    data-project="vue-workshop-agenda-studio"
    data-author="CodeSculptor"
    :data-marker="marker"
    class="min-h-screen"
  >
    <StudioHeader
      title="Workshop Agenda Studio"
      subtitle="A little structure. More room to share."
      code="WA"
    >
      <DataTools
        :workspace="draft"
        :sample="sample"
        :parse="parseWorkspace"
        :serialize="serialize"
        @replace="replace"
        ><button
          class="border-accent! bg-accent text-on-accent hover:brightness-110"
          :disabled="!!validation.error"
          @click="saveMarkdown"
        >
          Markdown
        </button></DataTools
      >
    </StudioHeader>
    <main class="mx-auto max-w-[1500px] px-5 py-7 md:px-8">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            THE SHAPE OF A MORNING
          </p>
          <h1 class="max-w-4xl break-words text-3xl font-semibold leading-tight sm:text-4xl">
            {{ draft.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Plan the moments, leave some breathing room, and make the next step clear.
          </p>
        </div>
        <span class="rounded-full border border-line bg-surface px-3 py-2 text-xs text-muted">{{
          storageStatus
        }}</span>
      </div>
      <div data-ui="workspace" class="grid min-w-0 gap-5 xl:grid-cols-[350px_minmax(0,1fr)_310px]">
        <section
          class="min-w-0 rounded-2xl border border-line bg-surface p-5"
          aria-labelledby="setup-heading"
        >
          <div class="mb-5 flex items-center justify-between">
            <h2 id="setup-heading" class="text-lg font-semibold">Set the scene</h2>
            <span class="text-xs text-muted">01 / PLAN</span>
          </div>
          <label>Workshop title<input v-model="editor.name" maxlength="80" /></label>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <label>Start time<input v-model="editor.start" type="time" /></label
            ><label
              >Time budget (min)<input v-model="editor.budget" inputmode="numeric" maxlength="3"
            /></label>
          </div>
          <div class="mt-5 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">The running order</h3>
            <button
              class="bg-soft px-2! text-xs! hover:bg-accent/10"
              :disabled="
                !!validation.error || editor.segments.length >= 16 || plan.rows.at(-1)!.end > 1430
              "
              @click="add"
            >
              Add segment
            </button>
          </div>
          <div
            data-ui="segment-list"
            class="mt-3 h-[340px] overflow-y-auto rounded-xl border border-line p-2"
            tabindex="0"
            role="region"
            aria-label="Agenda segments"
          >
            <button
              v-for="(segment, index) in editor.segments"
              :key="segment.id"
              class="mb-2 flex w-full min-w-0 items-center justify-between gap-3 text-left hover:bg-soft"
              :class="
                selected.id === segment.id
                  ? 'border-accent! bg-soft'
                  : 'border-transparent! bg-surface'
              "
              :aria-pressed="selected.id === segment.id"
              @click="selectedId = segment.id"
            >
              <span class="min-w-0"
                ><span class="block text-[10px] font-normal uppercase tracking-wider text-muted"
                  >{{ String(index + 1).padStart(2, '0') }} · {{ segment.kind }}</span
                ><span class="mt-1 block truncate">{{
                  segment.title || 'Untitled segment'
                }}</span></span
              ><span class="shrink-0 text-xs text-accent">{{ segment.minutes || '—' }}m</span>
            </button>
          </div>
          <p class="mt-4 h-14 overflow-auto text-xs leading-relaxed text-danger" role="alert">
            {{ validation.error ? `${validation.error} Last valid timeline and save kept.` : '' }}
          </p>
        </section>
        <section
          data-ui="timeline"
          class="min-w-0 rounded-2xl border border-line bg-surface p-5"
          aria-labelledby="timeline-heading"
        >
          <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 id="timeline-heading" class="text-lg font-semibold">A clear path through</h2>
            <span class="rounded-full bg-soft px-3 py-1.5 text-xs font-semibold text-accent"
              >{{ plan.total }} minutes planned</span
            >
          </div>
          <div class="grid grid-cols-3 gap-2 rounded-xl bg-background p-3">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-muted">START</p>
              <p class="mt-1 font-display text-xl font-semibold">
                {{ timeLabel(plan.workspace.start) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-muted">FINISH</p>
              <p data-ui="finish" class="mt-1 font-display text-xl font-semibold">
                {{ timeLabel(plan.rows.at(-1)!.end) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-muted">
                {{ plan.remaining < 0 ? 'OVER BUDGET' : 'TO SPARE' }}
              </p>
              <p
                data-ui="budget"
                class="mt-1 font-display text-xl font-semibold"
                :class="plan.remaining < 0 ? 'text-danger' : 'text-success'"
              >
                {{ Math.abs(plan.remaining) }}m
              </p>
            </div>
          </div>
          <ol class="mt-5 h-[446px] overflow-y-auto pr-1" tabindex="0" aria-label="Timeline">
            <li
              v-for="row in plan.rows"
              :key="row.id"
              class="relative mb-4 grid grid-cols-[53px_minmax(0,1fr)] gap-3 sm:grid-cols-[70px_minmax(0,1fr)]"
            >
              <div class="pt-3 font-mono text-xs text-muted">
                {{ timeLabel(row.start)
                }}<span class="mt-1 block text-[10px] text-muted/75">{{ timeLabel(row.end) }}</span>
              </div>
              <div
                class="min-w-0 rounded-xl border border-line p-4"
                :class="row.kind === 'break' ? 'border-dashed! bg-soft' : 'bg-surface'"
              >
                <div class="flex items-start justify-between gap-2">
                  <h3 class="min-w-0 break-words font-semibold">{{ row.title }}</h3>
                  <span
                    class="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] text-accent"
                    >{{ row.minutes }} min</span
                  >
                </div>
                <p class="mt-2 break-words text-xs leading-relaxed text-muted">
                  {{ row.note || 'A little room for what comes next.' }}
                </p>
              </div>
            </li>
          </ol>
          <p class="mt-3 text-xs text-muted">
            {{ activeCount }} activities · {{ plan.rows.length - activeCount }} breaks · Same-day
            local times
          </p>
        </section>
        <section
          data-ui="segment-editor"
          class="min-w-0 rounded-2xl border border-line bg-surface p-5"
          aria-labelledby="edit-heading"
        >
          <div class="mb-5 flex items-center justify-between">
            <h2 id="edit-heading" class="text-lg font-semibold">One moment at a time</h2>
            <span class="text-xs text-muted">02 / EDIT</span>
          </div>
          <div class="h-[445px] overflow-y-auto">
            <label>Segment title<input v-model="selected.title" maxlength="60" /></label>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <label
                >Duration (min)<input
                  v-model="selected.minutes"
                  inputmode="numeric"
                  maxlength="3" /></label
              ><label
                >Segment kind<select v-model="selected.kind">
                  <option value="activity">Activity</option>
                  <option value="break">Break</option>
                </select></label
              >
            </div>
            <label class="mt-4"
              >Facilitator note<textarea
                v-model="selected.note"
                maxlength="240"
                rows="5"
                class="resize-none"
              />
            </label>
            <p class="mt-4 text-xs leading-relaxed text-muted">
              Changes update the running order together. A partial duration keeps the last complete
              timeline visible.
            </p>
            <div class="mt-5 flex flex-wrap gap-2">
              <button
                class="hover:bg-soft"
                :disabled="!!validation.error || position === 0"
                @click="move(-1)"
              >
                Move earlier</button
              ><button
                class="hover:bg-soft"
                :disabled="!!validation.error || position === editor.segments.length - 1"
                @click="move(1)"
              >
                Move later
              </button>
            </div>
            <button
              class="mt-4 text-danger hover:bg-danger/5"
              :disabled="!!validation.error || editor.segments.length < 2"
              @click="removeOpen = true"
            >
              Remove segment
            </button>
          </div>
          <div class="mt-4 rounded-xl border border-dashed border-line bg-soft p-4">
            <p class="font-display text-lg">Leave a little margin.</p>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              The budget is a guide. An overrun is shown clearly; crossing midnight needs a shorter
              plan.
            </p>
          </div>
        </section>
      </div>
      <footer class="mt-6 flex flex-wrap justify-between gap-2 text-xs text-muted">
        <span>Same-day workshop plans · WA/1</span><span>{{ marker }} · CodeSculptor</span>
      </footer>
    </main>
    <AppDialog v-model="removeOpen" title="Remove this segment?"
      ><p class="break-words leading-relaxed text-muted">
        Remove “{{ selected.title }}” from the running order?
      </p>
      <div class="mt-6 flex justify-end gap-2">
        <button @click="removeOpen = false">Cancel</button
        ><button class="bg-danger text-white" @click="remove">Remove segment</button>
      </div></AppDialog
    >
  </div>
</template>
