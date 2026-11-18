import type { WatchdogStatus } from './api'
import { agoLabel, clockOf } from './format'

// What the cards show for the watchdog (ADR-032). Only "up" counts as OK: when the
// service cannot be reached or the state is unclear, the page says so and never "OK".
export type WatchdogView = {
  ok: boolean
  text: string // short state
  clock: string // time of the last check-in
  ago: string
  service: string // "Externer Dienst" line
}

export function watchdogView(w: WatchdogStatus | undefined, loaded: boolean, now = new Date()): WatchdogView {
  const none = { clock: '–', ago: '–' }
  if (!w) return { ok: false, text: loaded ? 'Unbekannt' : 'Lädt …', ...none, service: loaded ? 'nicht erreicht' : 'Lädt …' }
  if (!w.configured) return { ok: false, text: 'Nicht eingerichtet', ...none, service: 'nicht eingerichtet' }
  if (!w.reached) return { ok: false, text: 'Unbekannt', ...none, service: 'nicht erreicht' }
  const last = w.lastPing ? { clock: clockOf(w.lastPing), ago: agoLabel(w.lastPing, now) } : none
  const text =
    w.state === 'up'
      ? 'In Ordnung'
      : w.state === 'grace'
        ? 'Verspätet'
        : w.state === 'down'
          ? 'Keine Meldung'
          : w.state === 'new'
            ? 'Noch keine Meldung'
            : w.state === 'paused'
              ? 'Pausiert'
              : 'Unbekannt'
  return { ok: w.state === 'up', text, ...last, service: 'erreicht' }
}
