import type { Lang } from '@/lib/i18n'
import type { Tab } from '@/types'

const labels = {
  home: { kk: 'Басты бет', ru: 'Главная', en: 'Home' },
  map: { kk: 'Карта', ru: 'Карта', en: 'Map' },
  sto: { kk: 'Автосервис', ru: 'СТО', en: 'Services' },
  orders: { kk: 'Тапсырыстар', ru: 'Заказы', en: 'Orders' },
  profile: { kk: 'Профиль', ru: 'Профиль', en: 'Profile' },
} as const

function NavIcon({ id }: { id: Tab }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (id === 'home') return <svg {...common}><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>
  if (id === 'map') return <svg {...common}><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>
  if (id === 'sto') return <svg {...common}><path d="M4 21V9l8-5 8 5v12"/><path d="M8 21v-6h8v6"/><path d="M9 10h6"/></svg>
  if (id === 'orders') return <svg {...common}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="M8.5 9h7M8.5 13h7M8.5 17h5"/></svg>
  return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>
}

const items: Tab[] = ['home', 'map', 'sto', 'orders', 'profile']

export function BottomNav({ tab, onChange, lang }: { tab: Tab; onChange: (tab: Tab) => void; lang: Lang }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map((id) => (
        <button type="button" key={id} className={tab === id ? 'active' : ''} onClick={() => onChange(id)}>
          <span><NavIcon id={id} /></span>
          <small>{labels[id][lang]}</small>
        </button>
      ))}
    </nav>
  )
}
