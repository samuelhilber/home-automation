import Icon from './Icon'
import { nextAlarm } from '../mockData'
import './NextAlarmCard.css'

export default function NextAlarmCard() {
  return (
    <section className="card focus">
      <div className="card-head">
        <span className="label">
          <Icon name="alarm" />
          Nächster Wecker
        </span>
        <span className="status">
          <i />
          Aktiv
        </span>
      </div>
      <div className="alarm">
        <div className="big tabular">{nextAlarm.time}</div>
        <div className="when">
          <small>{nextAlarm.dayLabel}</small>
          <b>{nextAlarm.weekday}</b>
          <span className="tabular">{nextAlarm.date}</span>
        </div>
      </div>
      <div className="split">
        <div className="kv">
          <small>Zeitzone</small>
          <b>{nextAlarm.timezone}</b>
        </div>
        <button type="button" className="link">
          Wecker verwalten
          <Icon name="arrow-right" />
        </button>
      </div>
      <img className="egg" src="/assets/egg-asta.png" alt="" />
    </section>
  )
}
