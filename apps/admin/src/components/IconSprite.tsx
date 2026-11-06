// Shared <symbol> defs, mounted once; Icon.tsx references them via <use>.
export default function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="i-sunrise" viewBox="0 0 24 24">
        <path d="M17 18a5 5 0 0 0-10 0" />
        <line x1="2" y1="22" x2="22" y2="22" />
        <polyline points="8 6 12 2 16 6" />
        <line x1="12" y1="2" x2="12" y2="10" />
        <line x1="4.2" y1="11.2" x2="5.6" y2="12.6" />
        <line x1="19.8" y1="11.2" x2="18.4" y2="12.6" />
      </symbol>
      <symbol id="i-dashboard" viewBox="0 0 24 24">
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="5" rx="1" />
        <rect x="13" y="12" width="8" height="9" rx="1" />
        <rect x="3" y="15" width="8" height="6" rx="1" />
      </symbol>
      <symbol id="i-alarm" viewBox="0 0 24 24">
        <circle cx="12" cy="13" r="8" />
        <polyline points="12 9 12 13 14.5 15" />
        <line x1="5" y1="3" x2="2" y2="6" />
        <line x1="19" y1="3" x2="22" y2="6" />
      </symbol>
      <symbol id="i-monitor" viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="13" rx="1.5" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </symbol>
      <symbol id="i-monitor-play" viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="13" rx="1.5" />
        <polygon points="10 8 15 10.5 10 13" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </symbol>
      <symbol id="i-cpu" viewBox="0 0 24 24">
        <rect x="5" y="5" width="14" height="14" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="2" x2="9" y2="5" />
        <line x1="15" y1="2" x2="15" y2="5" />
        <line x1="9" y1="19" x2="9" y2="22" />
        <line x1="15" y1="19" x2="15" y2="22" />
        <line x1="2" y1="9" x2="5" y2="9" />
        <line x1="2" y1="15" x2="5" y2="15" />
        <line x1="19" y1="9" x2="22" y2="9" />
        <line x1="19" y1="15" x2="22" y2="15" />
      </symbol>
      <symbol id="i-sliders" viewBox="0 0 24 24">
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="17" x2="20" y2="17" />
        <circle cx="9" cy="7" r="2.5" fill="var(--sidebar)" />
        <circle cx="15" cy="17" r="2.5" fill="var(--sidebar)" />
      </symbol>
      <symbol id="i-calendar-import" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="16" rx="1.5" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <polyline points="9.5 15 12 17.5 14.5 15" />
        <line x1="12" y1="12.5" x2="12" y2="17.5" />
      </symbol>
      <symbol id="i-shield" viewBox="0 0 24 24">
        <path d="M12 2.5 4 5.5v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10v-6z" />
        <polyline points="8.5 12 11 14.5 16 9" />
      </symbol>
      <symbol id="i-activity" viewBox="0 0 24 24">
        <polyline points="2 13 7 13 9.5 6 14 19 16.5 13 22 13" />
      </symbol>
      <symbol id="i-list" viewBox="0 0 24 24">
        <line x1="9" y1="6" x2="21" y2="6" />
        <line x1="9" y1="12" x2="21" y2="12" />
        <line x1="9" y1="18" x2="21" y2="18" />
        <line x1="4" y1="6" x2="5" y2="6" />
        <line x1="4" y1="12" x2="5" y2="12" />
        <line x1="4" y1="18" x2="5" y2="18" />
      </symbol>
      <symbol id="i-terminal" viewBox="0 0 24 24">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </symbol>
      <symbol id="i-chevron-down" viewBox="0 0 24 24">
        <polyline points="6 9 12 15 18 9" />
      </symbol>
      <symbol id="i-arrow-right" viewBox="0 0 24 24">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </symbol>
      <symbol id="i-arrow-up-right" viewBox="0 0 24 24">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="8 7 17 7 17 16" />
      </symbol>
      <symbol id="i-play" viewBox="0 0 24 24">
        <polygon points="6 4 20 12 6 20" />
      </symbol>
      <symbol id="i-info" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="11" x2="12" y2="16.5" />
        <circle cx="12" cy="7.5" r="1" className="icon-fill" />
      </symbol>
    </svg>
  )
}
