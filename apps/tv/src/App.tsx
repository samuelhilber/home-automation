import type { CSSProperties } from 'react'
import IconSprite from './components/IconSprite'
import Sky from './components/Sky'
import WeatherPanel from './components/WeatherPanel'
import CalendarPanel from './components/CalendarPanel'
import TodayPanel from './components/TodayPanel'
import ClockPanel from './components/ClockPanel'
import PlayerPanel from './components/PlayerPanel'
import { usePolling } from './hooks/usePolling'
import { statusApi } from './lib/api'
import { useNow } from './hooks/useNow'
import { useScene } from './hooks/useScene'
import { useStage } from './hooks/useStage'
import './App.css'

export default function App() {
  const now = useNow()
  // One poll feeds both calendar panels. Events switched out in the admin app are not shown.
  const events = usePolling(statusApi.calendar, 5 * 60 * 1000)?.events.filter((e) => e.shown) ?? null
  const scene = useScene(now)
  const { scale, dx, dy } = useStage()

  return (
    <>
      <IconSprite />
      <Sky scene={scene} />
      <div className="screen">
        <main
          className="stage"
          style={{ '--s': scale.toFixed(4), '--dx': `${dx}px`, '--dy': `${dy}px` } as CSSProperties}
        >
          <WeatherPanel />
          <CalendarPanel now={now} events={events} />
          <TodayPanel now={now} events={events} />
          <ClockPanel now={now} />
          <PlayerPanel />
        </main>
      </div>
    </>
  )
}
