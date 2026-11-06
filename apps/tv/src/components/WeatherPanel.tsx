import Icon from './Icon'
import { forecast, weather as w } from '../mockData'
import { DAYS, addDays, utcDate, type ZurichNow } from '../lib/time'
import './WeatherPanel.css'

export default function WeatherPanel({ now }: { now: ZurichNow }) {
  const today = utcDate(now.y, now.m, now.d)

  return (
    <section className="panel p-weather">
      <div className="head">
        Wetter &mdash; {w.place} &middot; {w.source}
      </div>
      <div className="now">
        <div className="now-icon">
          <Icon name={w.icon} />
        </div>
        <div>
          <div className="temp tabular">{w.tempC}&deg;C</div>
          <div className="cond">{w.condition}</div>
          <div className="meta tabular">
            <div>
              Wind<b>{w.windKmh} km/h</b>
            </div>
            <div>
              Regen<b>{w.rainPercent} %</b>
            </div>
            <div>
              Luftf.<b>{w.humidityPercent} %</b>
            </div>
            <div>
              Gef&uuml;hlt<b>{w.feelsLikeC} &deg;C</b>
            </div>
          </div>
        </div>
      </div>
      <hr className="rule" />
      <div className="forecast tabular">
        {forecast.map((f, i) => (
          <div key={i} className="d">
            <span>{DAYS[addDays(today, i + 1).getUTCDay()]}</span>
            <Icon name={f.icon} />
            <b>{f.hi}&deg;</b>
            <span className="lo">{f.lo}&deg;</span>
          </div>
        ))}
      </div>
      <img className="egg" src="/assets/egg-asta.png" alt="" />
    </section>
  )
}
