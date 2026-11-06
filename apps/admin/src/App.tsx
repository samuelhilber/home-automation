import { useState } from 'react'
import IconSprite from './components/IconSprite'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import OverviewPage from './components/OverviewPage'
import WeckerPage from './components/WeckerPage'
import SystemPage from './components/SystemPage'
import KalenderPage from './components/KalenderPage'
import EinstellungenPage from './components/EinstellungenPage'
import UpdatesDialog, { type ScheduledUpdate } from './components/UpdatesDialog'
import Footer from './components/Footer'
import { initialPendingUpdates, initialUpdateHistory } from './mockData'
import './App.css'

export type PageId = 'overview' | 'wecker' | 'system' | 'kalender' | 'einstellungen'

const PAGE_LABELS: Record<PageId, string> = {
  einstellungen: 'Einstellungen',
  overview: 'Übersicht',
  wecker: 'Wecker',
  system: 'System',
  kalender: 'Kalender-Import',
}

// Mock rule: the last alarm is 06:30, so installs are queued from 21:00 until 08:30 (2 h later).
const NIGHT_START = 21 * 60
const NIGHT_END = 8 * 60 + 30

function zurichParts(date: Date) {
  const get = (opt: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Zurich', ...opt }).format(date)
  const [h, m] = get({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).split(':').map(Number)
  return { minutes: h * 60 + m, short: get({ day: '2-digit', month: '2-digit' }) }
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [showUpdates, setShowUpdates] = useState(false)
  const [pending, setPending] = useState(initialPendingUpdates)
  const [scheduled, setScheduled] = useState<ScheduledUpdate[]>([])
  const [history, setHistory] = useState(initialUpdateHistory)

  const now = new Date()
  const { minutes, short } = zurichParts(now)
  const isNight = minutes >= NIGHT_START || minutes < NIGHT_END
  const installDay = minutes >= NIGHT_START ? zurichParts(new Date(now.getTime() + 24 * 3600 * 1000)).short : short
  const nightLabel = isNight ? `${installDay} um 08:30` : null

  function install(id: string) {
    const update = pending.find((u) => u.id === id)
    if (!update) return
    setPending((list) => list.filter((u) => u.id !== id))
    if (nightLabel) {
      setScheduled((list) => [...list, { ...update, when: nightLabel.replace(' um ', ', ') }])
    } else {
      setHistory((list) => [{ id: `h-${id}`, name: update.name, from: update.from, to: update.to, ok: true, date: short }, ...list])
    }
  }

  return (
    <>
      <IconSprite />
      <div className="app">
        <Sidebar page={page} onNavigate={setPage} />
        <div className="main">
          <Topbar pageLabel={PAGE_LABELS[page]} pendingCount={pending.length} onOpenUpdates={() => setShowUpdates(true)} />
          {page === 'wecker' ? (
            <WeckerPage />
          ) : page === 'system' ? (
            <SystemPage />
          ) : page === 'kalender' ? (
            <KalenderPage />
          ) : page === 'einstellungen' ? (
            <EinstellungenPage />
          ) : (
            <OverviewPage />
          )}
          <Footer />
        </div>
      </div>
      {showUpdates && (
        <UpdatesDialog
          pending={pending}
          scheduled={scheduled}
          history={history}
          nightLabel={nightLabel}
          onInstall={install}
          onClose={() => setShowUpdates(false)}
        />
      )}
    </>
  )
}
