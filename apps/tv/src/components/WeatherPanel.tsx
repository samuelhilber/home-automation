import Icon from './Icon'
import { statusApi } from '../lib/api'
import { usePolling } from '../hooks/usePolling'
import { describeCondition } from '../lib/weather'
import { DAYS } from '../lib/time'
import './WeatherPanel.css'

const FIVE_MINUTES = 5 * 60 * 1000
const dash = '–'

export default function WeatherPanel() {
  const data = usePolling(statusApi.weather, FIVE_MINUTES)
  const w = data?.now
  const cond = describeCondition(w?.condition ?? null)

  return (
    <section className="panel p-weather">
      <div className="head">
        Wetter &mdash; {w?.place ?? 'St. Gallen'} &middot; {w?.source ?? dash}
      </div>
      <div className="now">
        <div className="now-icon">
          <Icon name={cond.icon} />
        </div>
        <div>
          <div className="temp tabular">{w?.tempC != null ? `${Math.round(w.tempC)}°C` : dash}</div>
          <div className="cond">{w ? cond.text : dash}</div>
          <div className="meta tabular">
            <div>
              Wind<b>{w?.windKmh != null ? `${w.windKmh} km/h` : dash}</b>
            </div>
            <div>
              Regen<b>{w?.rainMm != null ? `${w.rainMm} mm` : dash}</b>
            </div>
            <div>
              Luftf.<b>{w?.humidityPercent != null ? `${w.humidityPercent} %` : dash}</b>
            </div>
            <div>
              Druck<b>{w?.pressureHpa != null ? `${w.pressureHpa} hPa` : dash}</b>
            </div>
          </div>
        </div>
      </div>
      <hr className="rule" />
      <div className="forecast tabular">
        {(data?.forecast ?? []).map((f) => (
          <div key={f.date} className="d">
            <span>{DAYS[new Date(`${f.date}T00:00:00Z`).getUTCDay()]}</span>
            <Icon name={describeCondition(f.condition).icon} />
            <b>{f.hiC ?? dash}&deg;</b>
            <span className="lo">{f.loC ?? dash}&deg;</span>
          </div>
        ))}
      </div>
      <img className="egg" src="/assets/egg-asta.png" alt="" />
    </section>
  )
}
