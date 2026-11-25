import { useCallback, useEffect, useState } from 'react'
import IconSprite from './components/IconSprite'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import OverviewPage from './components/OverviewPage'
import WeckerPage from './components/WeckerPage'
import SystemPage from './components/SystemPage'
import KalenderPage from './components/KalenderPage'
import ProtokollPage from './components/ProtokollPage'
import EinstellungenPage from './components/EinstellungenPage'
import UpdatesDialog from './components/UpdatesDialog'
import Footer from './components/Footer'
import { describeError, updatesApi, type UpdatesStatus } from './api'
import './App.css'

export type PageId = 'overview' | 'wecker' | 'system' | 'kalender' | 'einstellungen' | 'protokoll'

const PAGE_LABELS: Record<PageId, string> = {
  einstellungen: 'Einstellungen',
  protokoll: 'Protokoll',
  overview: 'Übersicht',
  wecker: 'Wecker',
  system: 'System',
  kalender: 'Kalender-Import',
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [showUpdates, setShowUpdates] = useState(false)
  const [updates, setUpdates] = useState<UpdatesStatus | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Home Assistant decides what is pending and when installing is allowed (ADR-018/019).
  // While one runs, look more often; if the api does not answer, keep the last list.
  const running = updates?.updates.some((u) => u.inProgress) ?? false
  const refreshUpdates = useCallback(async () => {
    try {
      setUpdates(await updatesApi.list())
    } catch {
      // Keep what is on screen.
    }
  }, [])
  useEffect(() => {
    void refreshUpdates()
    const timer = setInterval(() => void refreshUpdates(), running ? 5_000 : 60_000)
    return () => clearInterval(timer)
  }, [refreshUpdates, running])

  async function install(id: string) {
    setBusyId(id)
    setUpdateError(null)
    try {
      await updatesApi.install(id)
    } catch (err) {
      setUpdateError(describeError(err))
    } finally {
      setBusyId(null)
      void refreshUpdates()
    }
  }

  return (
    <>
      <IconSprite />
      <div className="app">
        <Sidebar page={page} onNavigate={setPage} />
        <div className="main">
          <Topbar pageLabel={PAGE_LABELS[page]} pendingCount={updates?.updates.length ?? 0} onOpenUpdates={() => setShowUpdates(true)} />
          {page === 'wecker' ? (
            <WeckerPage />
          ) : page === 'system' ? (
            <SystemPage />
          ) : page === 'kalender' ? (
            <KalenderPage />
          ) : page === 'einstellungen' ? (
            <EinstellungenPage />
          ) : page === 'protokoll' ? (
            <ProtokollPage onBack={() => setPage('overview')} />
          ) : (
            <OverviewPage onNavigate={setPage} />
          )}
          <Footer />
        </div>
      </div>
      {showUpdates && (
        <UpdatesDialog
          updates={updates?.updates ?? []}
          blockedUntil={updates?.blockedUntil ?? null}
          loaded={updates !== null}
          busyId={busyId}
          error={updateError}
          onInstall={(id) => void install(id)}
          onClose={() => setShowUpdates(false)}
        />
      )}
    </>
  )
}
