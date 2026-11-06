import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Alarm } from './alarm.ts'
import type { HaClient, HaState } from './ha.ts'
import { ENTITIES, WEEKDAY_ALARM } from './mapping.ts'
import { addDays, weekdayOf, zurichClock } from './time.ts'

// ADR-029: a setting lives where it is used. Values that Home Assistant
// automations read are Home Assistant helpers (homeassistant/configuration.yaml);
// the default volume for new alarms is only used here and sits in a small JSON file.

export type Settings = {
  timeZone: string
  skipHolidays: boolean | null // null: Home Assistant does not answer or the helper is missing
  defaultVolume: number
  morningScreenMaxMinutes: number | null
  updateNotice: string | null // HH:MM
  installWindow: { from: string; to: string } // read only, computed from the alarms (ADR-019)
}

export type SettingsPatch = Partial<Pick<Settings, 'skipHolidays' | 'defaultVolume' | 'morningScreenMaxMinutes' | 'updateNotice'>>

export const DEFAULT_VOLUME = 5
const INSTALL_FROM = '21:00'
const INSTALL_AFTER_ALARM_MINUTES = 120
const INSTALL_WITHOUT_ALARM_TO = '10:00'
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

// The volume lives in a file in a Docker volume; losing it only resets it to the default.
export class SettingsStore {
  private defaultVolume = DEFAULT_VOLUME
  private file: string | undefined

  constructor(file: string | undefined) {
    this.file = file
    if (!file) return
    try {
      const v = (JSON.parse(readFileSync(file, 'utf8')) as { defaultVolume?: unknown }).defaultVolume
      if (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 100) this.defaultVolume = v
    } catch {
      // Missing or broken file: keep the default.
    }
  }

  getDefaultVolume() {
    return this.defaultVolume
  }

  setDefaultVolume(v: number) {
    this.defaultVolume = v
    if (!this.file) return
    mkdirSync(dirname(this.file), { recursive: true })
    const tmp = this.file + '.tmp'
    writeFileSync(tmp, JSON.stringify({ defaultVolume: v }, null, 2))
    renameSync(tmp, this.file)
  }
}

// Returns the cleaned changes, or a message for the first thing that is wrong.
// Time zone and install window are read only, so naming them is an error too.
export function parseSettingsPatch(body: unknown): { ok: true; value: SettingsPatch } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, error: 'Body must be an object' }
  const b = body as Record<string, unknown>
  const out: SettingsPatch = {}
  for (const key of Object.keys(b)) {
    const v = b[key]
    if (key === 'skipHolidays') {
      if (typeof v !== 'boolean') return { ok: false, error: 'skipHolidays must be true or false' }
      out.skipHolidays = v
    } else if (key === 'defaultVolume') {
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 100) {
        return { ok: false, error: 'defaultVolume must be a whole number from 1 to 100' }
      }
      out.defaultVolume = v
    } else if (key === 'morningScreenMaxMinutes') {
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 60) {
        return { ok: false, error: 'morningScreenMaxMinutes must be a whole number from 1 to 60' }
      }
      out.morningScreenMaxMinutes = v
    } else if (key === 'updateNotice') {
      if (typeof v !== 'string' || !TIME.test(v)) return { ok: false, error: 'updateNotice must be HH:MM' }
      out.updateNotice = v
    } else {
      return { ok: false, error: `${key} cannot be changed` }
    }
  }
  if (Object.keys(out).length === 0) return { ok: false, error: 'Nothing to change' }
  return { ok: true, value: out }
}

const stateOf = (states: HaState[], id: string) => {
  const s = states.find((x) => x.entity_id === id)?.state
  return s === undefined || s === 'unknown' || s === 'unavailable' ? null : s
}

const addMinutes = (time: string, minutes: number) => {
  const total = Math.min(23 * 60 + 59, Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + minutes)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// From 21:00 until 2 hours after the last alarm of tomorrow (10:00 without one) (ADR-019).
// Public holidays are not looked at: a holiday only makes the window end later, which is the safe side.
export function installWindow(alarms: Alarm[], states: HaState[], at: Date): { from: string; to: string } {
  const weekday = weekdayOf(addDays(zurichClock(at).date, 1))
  const times = alarms.filter((a) => a.on && a.days.includes(weekday)).map((a) => a.time)
  if (stateOf(states, WEEKDAY_ALARM.entity) === 'on' && WEEKDAY_ALARM.days.includes(weekday)) times.push(WEEKDAY_ALARM.time)
  const last = times.sort().at(-1)
  return { from: INSTALL_FROM, to: last ? addMinutes(last, INSTALL_AFTER_ALARM_MINUTES) : INSTALL_WITHOUT_ALARM_TO }
}

export function readSettings(store: SettingsStore, states: HaState[], alarms: Alarm[], at: Date): Settings {
  const holidays = stateOf(states, ENTITIES.ringOnHolidays)
  const max = Number(stateOf(states, ENTITIES.morningScreenMax))
  const notice = stateOf(states, ENTITIES.updateNotice)
  return {
    timeZone: 'Europe/Zurich',
    // The helper is "ring on holidays", so skipping is its opposite.
    skipHolidays: holidays === 'on' ? false : holidays === 'off' ? true : null,
    defaultVolume: store.getDefaultVolume(),
    morningScreenMaxMinutes: Number.isFinite(max) && max >= 1 && stateOf(states, ENTITIES.morningScreenMax) !== null ? Math.round(max) : null,
    updateNotice: notice && /^\d\d:\d\d/.test(notice) ? notice.slice(0, 5) : null,
    installWindow: installWindow(alarms, states, at),
  }
}

// Home Assistant first, the file last: if Home Assistant refuses, nothing here has changed yet.
export async function applySettings(ha: HaClient, store: SettingsStore, patch: SettingsPatch): Promise<void> {
  if (patch.skipHolidays !== undefined) {
    await ha.callService('input_boolean', patch.skipHolidays ? 'turn_off' : 'turn_on', { entity_id: ENTITIES.ringOnHolidays })
  }
  if (patch.morningScreenMaxMinutes !== undefined) {
    await ha.callService('input_number', 'set_value', { entity_id: ENTITIES.morningScreenMax, value: patch.morningScreenMaxMinutes })
  }
  if (patch.updateNotice !== undefined) {
    await ha.callService('input_datetime', 'set_datetime', { entity_id: ENTITIES.updateNotice, time: `${patch.updateNotice}:00` })
  }
  if (patch.defaultVolume !== undefined) store.setDefaultVolume(patch.defaultVolume)
}
