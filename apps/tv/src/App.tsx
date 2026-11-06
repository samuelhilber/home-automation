import type { CSSProperties } from 'react'
import IconSprite from './components/IconSprite'
import Sky from './components/Sky'
import WeatherPanel from './components/WeatherPanel'
import CalendarPanel from './components/CalendarPanel'
import TodayPanel from './components/TodayPanel'
import ClockPanel from './components/ClockPanel'
import PlayerPanel from './components/PlayerPanel'
import { useNow } from './hooks/useNow'
import { useScene } from './hooks/useScene'
import { useStage } from './hooks/useStage'
import './App.css'

export default function App() {
  const now = useNow()
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
          <CalendarPanel now={now} />
          <TodayPanel now={now} />
          <ClockPanel now={now} />
          <PlayerPanel />
        </main>
      </div>
    </>
  )
}
