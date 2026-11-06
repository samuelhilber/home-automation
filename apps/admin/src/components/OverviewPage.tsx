import { useEffect, useState } from 'react'
import NextAlarmCard from './NextAlarmCard'
import BackupAlarmCard from './BackupAlarmCard'
import TvCallToActionCard from './TvCallToActionCard'
import SystemStatusCard from './SystemStatusCard'
import ActivityFeedCard from './ActivityFeedCard'
import './OverviewPage.css'

const TIME_ZONE = 'Europe/Zurich'

function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])

  return now
}

export default function OverviewPage() {
  const now = useClock()
  const systemTime = new Intl.DateTimeFormat('de-DE', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)
  const longDate = new Intl.DateTimeFormat('de-DE', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now)

  return (
    <main className="content">
      <div className="title-row">
        <div>
          <div className="eyebrow-path">Kontrollzentrum / Übersicht</div>
          <h1>Alles bereit für morgen.</h1>
          <p className="lede">Dein Morgenbildschirm. Ein Blick auf alles Wichtige.</p>
        </div>
        <div className="clockline tabular">
          <span>{longDate}</span>
          <small>
            Systemzeit <span>{systemTime}</span> · MEZ
          </small>
        </div>
      </div>

      <div className="grid">
        <NextAlarmCard />
        <BackupAlarmCard />
      </div>

      <TvCallToActionCard />

      <div className="grid">
        <SystemStatusCard />
        <ActivityFeedCard />
      </div>
    </main>
  )
}
