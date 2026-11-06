import Icon from './Icon'
import { systemStatus } from '../mockData'
import './SystemStatusCard.css'

export default function SystemStatusCard() {
  return (
    <section className="card">
      <div className="card-head">
        <span className="label">
          <Icon name="activity" />
          Systemstatus
        </span>
        <span className="stamp">Zuletzt geprüft vor {systemStatus.checkedSecondsAgo} Sek.</span>
      </div>
      <div className="pair">
        <div className="tile">
          <div className="name">
            <Icon name="cpu" />
            Raspberry Pi
          </div>
          <div className="state">
            <i />
            {systemStatus.pi.online ? 'Online' : 'Offline'}
          </div>
          <div className="detail tabular">{systemStatus.pi.uptime}</div>
        </div>
        <div className="tile">
          <div className="name">
            <Icon name="shield" />
            Watchdog
          </div>
          <div className="state">
            <i />
            {systemStatus.watchdog.ok ? 'In Ordnung' : 'Fehler'}
          </div>
          <div className="detail tabular">{systemStatus.watchdog.lastSignal}</div>
        </div>
      </div>
      <div className="sys-foot tabular">
        <span>
          CPU {systemStatus.cpuTemp}&nbsp;°C &nbsp;·&nbsp; Speicher {systemStatus.memoryPercent}&nbsp;%
          &nbsp;·&nbsp; Netz {systemStatus.network}
        </span>
        <button type="button" className="link">
          Details
          <Icon name="arrow-right" />
        </button>
      </div>
    </section>
  )
}
