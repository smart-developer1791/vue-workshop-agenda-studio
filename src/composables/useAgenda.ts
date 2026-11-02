import { computed, type Ref } from 'vue'
import {
  parseEditor,
  timeline,
  type AgendaEditor,
  type Timeline,
  type Workspace,
} from '../domain/agenda.ts'
export function useAgenda(editor: Ref<AgendaEditor>, initial: Workspace) {
  const validation = computed(() => {
    try {
      return { workspace: parseEditor(editor.value), error: '' }
    } catch (error) {
      return { workspace: null, error: (error as Error).message }
    }
  })
  // Vue supplies the last returned value. Invalid drafts keep its detached timeline.
  const plan = computed<Timeline>((previous) =>
    validation.value.workspace
      ? timeline(validation.value.workspace)
      : (previous ?? timeline(initial)),
  )
  return { validation, plan }
}
