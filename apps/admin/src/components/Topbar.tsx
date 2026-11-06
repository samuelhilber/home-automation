import Icon from './Icon'
import './Topbar.css'

type Props = { pageLabel: string; pendingCount: number; onOpenUpdates: () => void }

export default function Topbar({ pageLabel, pendingCount, onOpenUpdates }: Props) {
  return (
    <header className="topbar">
      <div className="crumb">
        <Icon name="terminal" />
        Morgenbildschirm
        <span className="sep">/</span>
        <span className="here">{pageLabel}</span>
      </div>
      <div className="top-right">
        <button type="button" className="updates" onClick={onOpenUpdates}>
          <i />
          {pendingCount > 0 ? `${pendingCount} Updates warten` : 'Updates'}
        </button>
        <div className="who">
          <span className="avatar">AD</span>
          Admin
          <Icon name="chevron-down" />
        </div>
      </div>
    </header>
  )
}
