import { useState } from 'react'
import Icon from './Icon'
import WeckerEditor from './WeckerEditor'
import { DAY_LABELS, initialAlarms, type Alarm } from '../mockData'
import './WeckerPage.css'

// null = editor closed, 'new' = creating, otherwise the id being edited
type Editing = string | 'new' | null

export default function WeckerPage() {
  const [alarms, setAlarms] = useState<Alarm[]>(initialAlarms)
  const [editing, setEditing] = useState<Editing>(null)

  const editedAlarm = alarms.find((a) => a.id === editing)

  function toggle(id: string) {
    setAlarms((list) => list.map((a) => (a.id === id ? { ...a, on: !a.on } : a)))
  }

  function save(alarm: Alarm) {
    setAlarms((list) => {
      const exists = list.some((a) => a.id === alarm.id)
      const next = exists ? list.map((a) => (a.id === alarm.id ? alarm : a)) : [...list, alarm]
      return next.sort((a, b) => a.time.localeCompare(b.time))
    })
    setEditing(null)
  }

  function remove(id: string) {
    setAlarms((list) => list.filter((a) => a.id !== id))
    setEditing(null)
  }

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
            <button type="button" className="btn" onClick={() => setEditing('new')}>
              + Neuer Wecker
            </button>
          </div>

          <ul className="alarm-list">
            {alarms.length === 0 && <li className="alarm-empty">Noch kein Wecker angelegt.</li>}
            {alarms.map((a) => (
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
                  onClick={() => toggle(a.id)}
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
          />
        )}
      </div>
    </main>
  )
}
