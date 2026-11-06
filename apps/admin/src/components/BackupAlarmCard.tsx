import { useState } from 'react'
import Icon from './Icon'
import { backupAlarm } from '../mockData'
import './BackupAlarmCard.css'

export default function BackupAlarmCard() {
  const [on, setOn] = useState(backupAlarm.on)

  return (
    <section className="card">
      <div className="card-head">
        <span className="label">
          <Icon name="shield" />
          Backup-Wecker
        </span>
      </div>
      <div className={`backup-state${on ? '' : ' off'}`}>
        <div>
          <b>{on ? 'Eingeschaltet' : 'Ausgeschaltet'}</b>
          <span>{on ? 'Sicherung ist aktiv' : 'Keine Sicherung bei Ausfall'}</span>
        </div>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={on}
          aria-label="Backup-Wecker"
          onClick={() => setOn((v) => !v)}
        >
          <i />
        </button>
      </div>
      <div className="backup-time">
        <div className="t tabular">{backupAlarm.time}</div>
        <div>
          <small>Eingestellte Zeit</small>
          <span>{backupAlarm.note}</span>
        </div>
      </div>
      <div className="hint">
        <Icon name="info" />
        Unabhängig vom Morgenbildschirm.
      </div>
    </section>
  )
}
