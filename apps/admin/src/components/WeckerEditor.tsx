import { useState } from 'react'
import Icon from './Icon'
import { alarmSources, alarmZones, DAY_LABELS, type Alarm } from '../mockData'

const GROUPS = [
  { label: 'Werktage', days: [0, 1, 2, 3, 4] },
  { label: 'Wochenende', days: [5, 6] },
  { label: 'Täglich', days: [0, 1, 2, 3, 4, 5, 6] },
]

const sameDays = (a: number[], b: number[]) => a.length === b.length && a.every((d) => b.includes(d))

type Props = {
  alarm?: Alarm
  onSave: (alarm: Alarm) => void
  onDelete: (id: string) => void
  onClose: () => void
  defaultVolume?: number // from the settings (ADR-029), for a new alarm
}

export default function WeckerEditor({ alarm, onSave, onDelete, onClose, defaultVolume = 5 }: Props) {
  const isNew = !alarm
  const [draft, setDraft] = useState<Alarm>(
    alarm ?? {
      id: `a${Date.now()}`,
      time: '07:00',
      days: [0, 1, 2, 3, 4],
      zone: alarmZones[0],
      source: alarmSources[0],
      volume: defaultVolume,
      wakeTv: true,
      on: true,
    },
  )

  const set = <K extends keyof Alarm>(key: K, value: Alarm[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const toggleDay = (i: number) =>
    set('days', draft.days.includes(i) ? draft.days.filter((d) => d !== i) : [...draft.days, i].sort())

  const canSave = draft.time !== '' && draft.days.length > 0

  return (
    <section className="card editor" aria-label={isNew ? 'Neuer Wecker' : 'Wecker bearbeiten'}>
      <div className="card-head">
        <span className="label">{isNew ? 'Neuer Wecker' : 'Wecker bearbeiten'}</span>
        <button type="button" className="btn ghost" onClick={onClose}>
          Schliessen
        </button>
      </div>

      <label className="field-label" htmlFor="alarm-time">
        Uhrzeit
      </label>
      <input
        id="alarm-time"
        type="time"
        className="field time-field tabular"
        value={draft.time}
        onChange={(e) => set('time', e.target.value)}
      />

      <div className="field-label">Wochentage</div>
      <div className="chips">
        {DAY_LABELS.map((d, i) => (
          <button
            key={d}
            type="button"
            className={`chip${draft.days.includes(i) ? ' on' : ''}`}
            aria-pressed={draft.days.includes(i)}
            onClick={() => toggleDay(i)}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="chips chips-groups">
        {GROUPS.map((g) => (
          <button
            key={g.label}
            type="button"
            className={`chip${sameDays(draft.days, g.days) ? ' on' : ''}`}
            onClick={() => set('days', g.days)}
          >
            {g.label}
          </button>
        ))}
      </div>
      {draft.days.length === 0 && <div className="error">Mindestens ein Wochentag nötig.</div>}

      <label className="field-label" htmlFor="alarm-zone">
        Sonos-Zone
      </label>
      <select id="alarm-zone" className="field" value={draft.zone} onChange={(e) => set('zone', e.target.value)}>
        {alarmZones.map((z) => (
          <option key={z}>{z}</option>
        ))}
      </select>

      <label className="field-label" htmlFor="alarm-source">
        Spotify-Quelle
      </label>
      <select
        id="alarm-source"
        className="field"
        value={draft.source}
        onChange={(e) => set('source', e.target.value)}
      >
        {alarmSources.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <label className="field-label" htmlFor="alarm-volume">
        Lautstärke (fest)
      </label>
      <div className="volume-row">
        <input
          id="alarm-volume"
          type="range"
          min={1}
          max={100}
          value={draft.volume}
          onChange={(e) => set('volume', Number(e.target.value))}
        />
        <span className="tabular">{draft.volume}</span>
      </div>

      <div className="tv-row">
        <span>
          TV aufwecken
          <small>Morgenbildschirm beim Klingeln</small>
        </span>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={draft.wakeTv}
          aria-label="TV aufwecken"
          onClick={() => set('wakeTv', !draft.wakeTv)}
        >
          <i />
        </button>
      </div>

      <div className="hint">
        <Icon name="info" />
        Kein Schlummern. Beim Klingeln gibt es einen grossen „Stopp“-Knopf, nach 15 Minuten stoppt der Wecker von selbst.
      </div>

      <div className="editor-actions">
        {isNew ? (
          <span />
        ) : (
          <button type="button" className="btn ghost danger" onClick={() => onDelete(draft.id)}>
            Löschen
          </button>
        )}
        <div className="editor-actions-right">
          <button type="button" className="btn ghost" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn" disabled={!canSave} onClick={() => onSave(draft)}>
            Speichern
          </button>
        </div>
      </div>
    </section>
  )
}
