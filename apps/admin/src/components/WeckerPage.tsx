import { useEffect, useState } from 'react'
import Icon from './Icon'
import WeckerEditor from './WeckerEditor'
import { alarmsApi, describeError, settingsApi } from '../api'
import { useStatus } from '../useStatus'
import { DAY_LABELS, type Alarm } from '../mockData'
import './WeckerPage.css'

// null = editor closed, 'new' = creating, otherwise the id being edited
type Editing = string | 'new' | null

const byTime = (list: Alarm[]) => [...list].sort((a, b) => a.time.localeCompare(b.time))

export default function WeckerPage() {
  const [alarms, setAlarms] = useState<Alarm[] | null>(null) // null = still loading
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const { data: settings } = useStatus(settingsApi.get, 300000)

  function load() {
    alarmsApi
      .list()
      .then((list) => {
        setLoadError(null)
        setAlarms(byTime(list))
      })
      .catch((err) => setLoadError(describeError(err)))
  }

  useEffect(load, [])

  const editedAlarm = alarms?.find((a) => a.id === editing)

  // Every change goes to the api first; the list only changes when it worked.
  async function run(action: () => Promise<void>) {
    setActionError(null)
    try {
      await action()
    } catch (err) {
      setActionError(describeError(err))
    }
  }

  const toggle = (alarm: Alarm) =>
    run(async () => {
      const updated = await alarmsApi.setOn(alarm.id, !alarm.on)
      setAlarms((list) => list && list.map((a) => (a.id === updated.id ? updated : a)))
    })

  const save = (alarm: Alarm) =>
    run(async () => {
      const { id: _id, ...input } = alarm
      const saved = editing === 'new' ? await alarmsApi.create(input) : await alarmsApi.update(alarm)
      setAlarms((list) => byTime([...(list ?? []).filter((a) => a.id !== saved.id), saved]))
      setEditing(null)
    })

  const remove = (id: string) =>
    run(async () => {
      await alarmsApi.remove(id)
      setAlarms((list) => list && list.filter((a) => a.id !== id))
      setEditing(null)
    })

  return (
    <main className="content">
      <div className="title-row">
        <div>
          <div className="eyebrow-path">Kontrollzentrum / Wecker</div>
          <h1>Deine Wecker.</h1>
          <p className="lede">Zeiten, Wochentage und Ton. Feiertage in St. Gallen werden übersprungen.</p>
        </div>
      </div>

      <div className="wecker-grid">
        <section className="card">
          <div className="card-head">
            <span className="label">
              <Icon name="alarm" />
              Wecker
            </span>
            <button type="button" className="btn" disabled={alarms === null} onClick={() => setEditing('new')}>
              + Neuer Wecker
            </button>
          </div>

          {actionError && (
            <div className="error" role="alert">
              {actionError}
            </div>
          )}

          <ul className="alarm-list">
            {loadError && (
              <li className="alarm-empty" role="alert">
                {loadError}{' '}
                <button type="button" className="btn ghost" onClick={load}>
                  Nochmal versuchen
                </button>
              </li>
            )}
            {!loadError && alarms === null && <li className="alarm-empty">Wecker werden geladen …</li>}
            {alarms?.length === 0 && <li className="alarm-empty">Noch kein Wecker angelegt.</li>}
            {alarms?.map((a) => (
              <li key={a.id} className={`alarm-row${a.on ? '' : ' off'}${editing === a.id ? ' sel' : ''}`}>
                <button type="button" className="alarm-open" onClick={() => setEditing(a.id)}>
                  <span className="alarm-time tabular">{a.time}</span>
                  <span className="alarm-mid">
                    <span className="alarm-days">
                      {DAY_LABELS.map((d, i) => (
                        <span key={d} className={`day${a.days.includes(i) ? ' on' : ''}`}>
                          {d}
                        </span>
                      ))}
                    </span>
                    <span className="alarm-meta">
                      {a.zone} · {a.source} · Lautstärke {a.volume} · TV {a.wakeTv ? 'an' : 'aus'}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className="switch"
                  role="switch"
                  aria-checked={a.on}
                  aria-label={`Wecker ${a.time}`}
                  onClick={() => toggle(a)}
                >
                  <i />
                </button>
              </li>
            ))}
          </ul>

          <div className="hint">
            <Icon name="info" />
            Der Backup-Wecker steht unter „System“, nicht hier.
          </div>
        </section>

        {editing && (
          <WeckerEditor
            key={editing}
            alarm={editedAlarm}
            onSave={save}
            onDelete={remove}
            onClose={() => setEditing(null)}
            defaultVolume={settings?.defaultVolume}
          />
        )}
      </div>
    </main>
  )
}
