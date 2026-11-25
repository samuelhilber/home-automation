import Icon from './Icon'
import { statusApi } from '../api'
import { useStatus } from '../useStatus'
import './ActivityFeedCard.css'

export default function ActivityFeedCard() {
  const { data, loaded, failed } = useStatus(() => statusApi.activity(3))
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
  return (
    <section className="card">
      <div className="card-head">
        <span className="label">
          <Icon name="list" />
          Letzte Aktivitäten
        </span>
      </div>
      <div className="feed tabular">
        {(data ?? []).map((entry) => (
          <div key={entry.date + entry.time + entry.title}>
            <time>
              {entry.time}
              {entry.date !== today && <small>{entry.date.slice(8)}.{entry.date.slice(5, 7)}.</small>}
            </time>
            <span>
              <b>{entry.title}</b>
              <small>{entry.detail}</small>
            </span>
          </div>
        ))}
        {loaded && !failed && data?.length === 0 && <small>Noch nichts aufgezeichnet.</small>}
        {failed && !data && <small>Home Assistant antwortet nicht.</small>}
      </div>
      <button type="button" className="link">
        Protokoll öffnen
        <Icon name="arrow-right" />
      </button>
      <img className="egg" src="/assets/egg-ichigo.png" alt="" />
    </section>
  )
}
