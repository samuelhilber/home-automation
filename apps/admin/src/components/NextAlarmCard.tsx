import Icon from './Icon'
import { statusApi } from '../api'
import { dayLabel, longDate, timezoneLabel, weekdayName } from '../format'
import { useStatus } from '../useStatus'
import './NextAlarmCard.css'

export default function NextAlarmCard() {
  const { data: next, loaded, failed } = useStatus(statusApi.nextAlarm)

  return (
    <section className="card focus">
      <div className="card-head">
        <span className="label">
          <Icon name="alarm" />
          Nächster Wecker
        </span>
        {next && (
          <span className="status">
            <i />
            Aktiv
          </span>
        )}
      </div>
      <div className="alarm">
        <div className="big tabular">{next ? next.time : '–'}</div>
        <div className="when">
          {next ? (
            <>
              <small>{dayLabel(next.inDays)}</small>
              <b>{weekdayName(next.weekday)}</b>
              <span className="tabular">{longDate(next.date)}</span>
            </>
          ) : (
            <small>
              {failed && !loaded ? 'Keine Verbindung zu Home Assistant' : loaded ? 'Kein Wecker eingeschaltet' : 'Lädt …'}
            </small>
          )}
        </div>
      </div>
      <div className="split">
        <div className="kv">
          <small>Zeitzone</small>
          <b>{timezoneLabel()}</b>
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
