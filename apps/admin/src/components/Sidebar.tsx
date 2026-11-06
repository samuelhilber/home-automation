import Icon from './Icon'
import type { PageId } from '../App'
import './Sidebar.css'

// The morning screen is its own app (apps/tv). Dev default is its dev server; set VITE_TV_URL for the Pi.
const TV_URL = import.meta.env.VITE_TV_URL ?? 'http://localhost:5176'

// Items with an `id` switch the page, items with an `href` open in a new tab.
const NAV_ITEMS: { label: string; icon: string; id?: PageId; href?: string; desktopOnly?: boolean }[] = [
  { label: 'Übersicht', icon: 'dashboard', id: 'overview' },
  { label: 'Wecker', icon: 'alarm', id: 'wecker' },
  { label: 'TV-Anzeige', icon: 'monitor', href: TV_URL, desktopOnly: true },
  { label: 'System', icon: 'cpu', id: 'system' },
  { label: 'Einstellungen', icon: 'sliders', id: 'einstellungen' },
  { label: 'Kalender-Import', icon: 'calendar-import', id: 'kalender' },
]

export default function Sidebar({ page, onNavigate }: { page: PageId; onNavigate: (page: PageId) => void }) {
  return (
    <aside className="sidebar">
      <div className="side-nav">
        <div className="brand">
          <span className="mark">
            <Icon name="sunrise" />
          </span>
          <span>
            <b>morgen_</b>
            <small>Verwaltung</small>
          </span>
        </div>
        <div className="nav-label">Arbeitsbereich</div>
        <nav className="nav" aria-label="Verwaltung">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={item.desktopOnly ? 'desktop-only' : undefined}
              aria-current={item.id === page ? 'page' : undefined}
              aria-label={item.href ? `${item.label} (öffnet in neuem Tab)` : undefined}
              onClick={
                item.id
                  ? () => onNavigate(item.id!)
                  : item.href
                    ? () => window.open(item.href, '_blank', 'noopener')
                    : undefined
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="device">
        <div className="forest">
          <span>
            // Ein guter Morgen
            <br />
            beginnt am Abend.
          </span>
          <img className="egg" src="/assets/egg-tanjiro.png" alt="" />
        </div>
        <div className="device-row">
          <Icon name="cpu" />
          <span>
            <b>morgenpi</b>
            <small>morgenpi.local</small>
          </span>
          <i className="online" title="Online" />
        </div>
      </div>
    </aside>
  )
}
