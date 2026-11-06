import Icon from './Icon'
import { statusApi } from '../api'
import { useStatus } from '../useStatus'
import './BackupAlarmCard.css'

export default function BackupAlarmCard() {
  const { data: backup, loaded } = useStatus(statusApi.backupAlarm)
  const on = backup?.on ?? false

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
          <b>{!backup ? (loaded ? 'Nicht gefunden' : 'Lädt …') : on ? 'Eingeschaltet' : 'Ausgeschaltet'}</b>
          <span>{on ? 'Sicherung ist aktiv' : 'Keine Sicherung bei Ausfall'}</span>
        </div>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={on}
          aria-label="Backup-Wecker"
          disabled
          title="Nur Anzeige: Home Assistant schaltet den Backup-Wecker selbst"
        >
          <i />
        </button>
      </div>
      <div className="backup-time">
        <div className="t tabular">{backup?.time ?? '–'}</div>
        <div>
          <small>Eingestellte Zeit</small>
          <span>{backup ? `${backup.minutesAfter} Min. nach Hauptwecker` : ''}</span>
        </div>
      </div>
      <div className="hint">
        <Icon name="info" />
        Unabhängig vom Morgenbildschirm.
      </div>
    </section>
  )
}
