import type { HaState } from './ha.ts'

// Pending updates come straight from Home Assistant's own `update.*` entities (core,
// HACS components, ...). Nothing is stored here (ADR-018: Samuel confirms each one by hand).

export type PendingUpdate = {
  id: string // the entity id, e.g. update.home_assistant_core_update
  name: string
  from: string
  to: string
  notesUrl: string | null
  inProgress: boolean
}

const text = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null)

export function pendingUpdates(states: HaState[]): PendingUpdate[] {
  const out: PendingUpdate[] = []
  for (const s of states) {
    if (!s.entity_id.startsWith('update.') || s.state !== 'on') continue
    const from = text(s.attributes.installed_version)
    const to = text(s.attributes.latest_version)
    if (!from || !to) continue
    const url = text(s.attributes.release_url)
    out.push({
      id: s.entity_id,
      name: text(s.attributes.title) ?? text(s.attributes.friendly_name) ?? s.entity_id,
      from,
      to,
      // The page renders this as a link, so only a plain web address gets through.
      notesUrl: url && /^https:\/\//i.test(url) ? url : null,
      inProgress: s.attributes.in_progress === true || typeof s.attributes.in_progress === 'number',
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}
