'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/lib/i18n'
import { getProblems } from '@/lib/mock-data'
import type { Order, Tab } from '@/types'
import styles from './page.module.css'

type ServiceId = 'start' | 'wheel' | 'tow' | 'fuel' | 'unlock'
type Screen = 'home' | 'services' | 'sos' | 'cars' | 'reminders' | 'orders' | 'profile'

const copy = {
  ru: {
    emergency: 'SOS',
    emergencySub: 'Нужна срочная помощь на дороге?',
    popular: 'Популярные услуги',
    seeAll: 'Смотреть все',
    allServices: 'Все услуги',
    allServicesSub: 'Полный список услуг для вашего авто',
    promos: 'Акции и скидки',
    cars: 'Мои автомобили',
    add: 'Добавить',
    reminders: 'Напоминания',
    home: 'Главная',
    map: 'Карта',
    sto: 'СТО',
    orders: 'Заказы',
    profile: 'Профиль',
    jump: 'Прикурить аккумулятор',
    wheel: 'Замена колеса',
    tow: 'Эвакуатор',
    fuel: 'Доставка топлива',
    unlock: 'Вскрытие авто',
    oil: 'Замена масла со скидкой',
    tire: 'Шиномонтаж со скидкой',
    good: 'Всё хорошо',
    mileage: 'Пробег: 124 500 км',
    oilReminder: 'Замена масла',
    insurance: 'Страховка',
    battery: 'Аккумулятор',
    tireReminder: 'Шиномонтаж',
    inKm: 'через 1 200 км',
    inDays: 'через 9 дней',
    warranty: 'Гарантия 14 месяцев',
    inKmTire: 'через 3 500 км',
    days20: '≈ 20 дней',
    days45: '≈ 45 дней',
    or: 'или',
    noOrders: 'Заказов пока нет',
    noOrdersSub: 'Создайте заявку через SOS или выберите услугу.',
    urgentTitle: 'Что случилось?',
    urgentSub: 'Выберите ситуацию — JolDos найдёт подходящую помощь.',
    back: 'Назад',
  },
  kk: {
    emergency: 'SOS',
    emergencySub: 'Жолда шұғыл көмек керек пе?',
    popular: 'Танымал қызметтер',
    seeAll: 'Барлығын көру',
    allServices: 'Барлық қызметтер',
    allServicesSub: 'Көлігіңізге арналған қызметтердің толық тізімі',
    promos: 'Акциялар мен жеңілдіктер',
    cars: 'Менің көліктерім',
    add: 'Қосу',
    reminders: 'Еске салғыштар',
    home: 'Басты бет',
    map: 'Карта',
    sto: 'СТО',
    orders: 'Тапсырыстар',
    profile: 'Профиль',
    jump: 'Аккумуляторды іске қосу',
    wheel: 'Дөңгелек ауыстыру',
    tow: 'Эвакуатор',
    fuel: 'Жанармай жеткізу',
    unlock: 'Көлікті ашу',
    oil: 'Майды жеңілдікпен ауыстыру',
    tire: 'Шиномонтаж жеңілдікпен',
    good: 'Бәрі жақсы',
    mileage: 'Жүріс: 124 500 км',
    oilReminder: 'Май ауыстыру',
    insurance: 'Сақтандыру',
    battery: 'Аккумулятор',
    tireReminder: 'Шиномонтаж',
    inKm: '1 200 км кейін',
    inDays: '9 күннен кейін',
    warranty: 'Кепілдік 14 ай',
    inKmTire: '3 500 км кейін',
    days20: '≈ 20 күн',
    days45: '≈ 45 күн',
    or: 'немесе',
    noOrders: 'Тапсырыстар жоқ',
    noOrdersSub: 'SOS арқылы немесе қызметті таңдап өтінім жасаңыз.',
    urgentTitle: 'Не болды?',
    urgentSub: 'Жағдайды таңдаңыз — JolDos қажетті көмекті табады.',
    back: 'Артқа',
  },
  en: {
    emergency: 'SOS',
    emergencySub: 'Need urgent roadside assistance?',
    popular: 'Popular services',
    seeAll: 'See all',
    allServices: 'All services',
    allServicesSub: 'Complete service list for your car',
    promos: 'Offers and discounts',
    cars: 'My vehicles',
    add: 'Add',
    reminders: 'Reminders',
    home: 'Home',
    map: 'Map',
    sto: 'Service',
    orders: 'Orders',
    profile: 'Profile',
    jump: 'Jump start',
    wheel: 'Change wheel',
    tow: 'Tow truck',
    fuel: 'Fuel delivery',
    unlock: 'Unlock car',
    oil: 'Discount oil change',
    tire: 'Discount tire service',
    good: 'All good',
    mileage: 'Mileage: 124,500 km',
    oilReminder: 'Oil change',
    insurance: 'Insurance',
    battery: 'Battery',
    tireReminder: 'Tire service',
    inKm: 'in 1,200 km',
    inDays: 'in 9 days',
    warranty: '14-month warranty',
    inKmTire: 'in 3,500 km',
    days20: '≈ 20 days',
    days45: '≈ 45 days',
    or: 'or',
    noOrders: 'No orders yet',
    noOrdersSub: 'Create a request through SOS or select a service.',
    urgentTitle: 'What happened?',
    urgentSub: 'Choose the situation and JolDos will find suitable help.',
    back: 'Back',
  },
} as const

const sosItems = [
  { id: 'overheat', icon: '🌡️', ru: 'Перегрев двигателя', kk: 'Қозғалтқыш қызып кетті', en: 'Engine overheating' },
  { id: 'wheel', icon: '🛞', ru: 'Спущено колесо', kk: 'Дөңгелек жарылды', en: 'Flat tire' },
  { id: 'battery', icon: '🔋', ru: 'Разрядился аккумулятор', kk: 'Аккумулятор отырды', en: 'Dead battery' },
  { id: 'unlock', icon: '🔑', ru: 'Ключи остались в салоне', kk: 'Кілт салонда қалды', en: 'Keys locked inside' },
  { id: 'fuel', icon: '⛽', ru: 'Закончилось топливо', kk: 'Жанармай таусылды', en: 'Out of fuel' },
  { id: 'coolant', icon: '💧', ru: 'Закончилась охлаждающая жидкость', kk: 'Салқындатқыш сұйықтық жоқ', en: 'No coolant' },
  { id: 'oil', icon: '🛢️', ru: 'Утечка масла', kk: 'Май ағып жатыр', en: 'Oil leak' },
  { id: 'accident', icon: '⚠️', ru: 'Не заводится после ДТП или удара', kk: 'Соққыдан кейін оталмайды', en: 'Will not start after impact' },
  { id: 'engine', icon: '🚘', ru: 'Автомобиль не заводится', kk: 'Көлік оталмайды', en: 'Car will not start' },
  { id: 'tow', icon: '🚚', ru: 'Нужен эвакуатор', kk: 'Эвакуатор керек', en: 'Tow truck needed' },
  { id: 'other', icon: '🧰', ru: 'Другая проблема', kk: 'Басқа мәселе', en: 'Other problem' },
] as const

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    shop: <><path d="M3 10h18l-2-6H5l-2 6Z" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function ServiceArt({ id }: { id: ServiceId }) {
  if (id === 'start') return <div className={styles.artEmoji}>🔋</div>
  if (id === 'wheel') return <div className={styles.artEmoji}>🛞</div>
  if (id === 'tow') return <div className={styles.artEmoji}>🚚</div>
  if (id === 'fuel') return <div className={styles.artEmoji}>⛽</div>
  return <div className={styles.artEmoji}>🔐</div>
}

export default function ClientPage() {
  const { lang, setLang } = useLanguage()
  const t = copy[lang]
  const problems = useMemo(() => getProblems(lang), [lang])
  const [screen, setScreen] = useState<Screen>('home')
  const [tab, setTab] = useState<Tab>('home')
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedSos, setSelectedSos] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('joldos-orders')
      if (raw) setOrders(JSON.parse(raw))
    } catch {}
  }, [])

  const openTab = (next: Tab) => {
    setTab(next)
    if (next === 'home') setScreen('home')
    if (next === 'orders') setScreen('orders')
    if (next === 'profile') setScreen('profile')
  }

  const createQuickOrder = async (problem: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          location: 'Астана, текущее местоположение',
          client: 'Ержан Т.',
          vehicle: 'Toyota Prado',
          price: 7000,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.order) throw new Error('order')
      const order: Order = {
        id: data.order.id,
        master: data.order.master || 'Ищем мастера',
        problem: data.order.problem,
        location: data.order.location,
        createdAt: new Date().toLocaleString(),
        status: data.order.status || 'Ищем мастера',
      }
      const next = [order, ...orders]
      setOrders(next)
      localStorage.setItem('joldos-orders', JSON.stringify(next))
      setScreen('orders')
      setTab('orders')
    } catch {
      alert(lang === 'kk' ? 'Өтінімді жіберу мүмкін болмады' : lang === 'en' ? 'Could not send request' : 'Не удалось отправить заявку')
    }
  }

  const services = [
    { id: 'start' as const, label: t.jump },
    { id: 'wheel' as const, label: t.wheel },
    { id: 'tow' as const, label: t.tow },
    { id: 'fuel' as const, label: t.fuel },
    { id: 'unlock' as const, label: t.unlock },
  ]

  const serviceProblem = (id: ServiceId) =>
    ({
      start: t.jump,
      wheel: t.wheel,
      tow: t.tow,
      fuel: t.fuel,
      unlock: t.unlock,
    })[id]

  return (
    <main className={styles.shell}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <button className={styles.iconButton} onClick={() => setScreen('profile')} aria-label="Menu">
            <Icon name="menu" />
          </button>

          <button className={styles.logo} onClick={() => openTab('home')}>JolDos</button>

          <div className={styles.headerRight}>
            <div className={styles.language}>
              {(['ru', 'kk', 'en'] as const).map(code => (
                <button key={code} className={lang === code ? styles.languageActive : ''} onClick={() => setLang(code)}>
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <button className={styles.iconButton} aria-label="Notifications">
              <Icon name="bell" />
              <span className={styles.badge}>3</span>
            </button>
          </div>
        </header>

        {screen === 'home' && (
          <>
            <button className={styles.sosBanner} onClick={() => setScreen('sos')}>
              <span className={styles.warning}>!</span>
              <span className={styles.sosText}>
                <strong>{t.emergency}</strong>
                <small>{t.emergencySub}</small>
              </span>
              <span className={styles.sosArrow}><Icon name="chevron" /></span>
            </button>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2>{t.popular}</h2>
                <button onClick={() => setScreen('services')}>{t.seeAll}<Icon name="chevron" /></button>
              </div>

              <div className={styles.servicesRow}>
                {services.map(service => (
                  <button key={service.id} className={styles.serviceCard} onClick={() => createQuickOrder(serviceProblem(service.id))}>
                    <ServiceArt id={service.id} />
                    <span>{service.label}</span>
                  </button>
                ))}
              </div>

              <button className={styles.allServices} onClick={() => setScreen('services')}>
                <span className={styles.gridIcon}><Icon name="grid" /></span>
                <span>
                  <strong>{t.allServices}</strong>
                  <small>{t.allServicesSub}</small>
                </span>
                <span className={styles.blueChevron}><Icon name="chevron" /></span>
              </button>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2>{t.promos}</h2>
                <button>{t.seeAll}<Icon name="chevron" /></button>
              </div>
              <div className={styles.promoRow}>
                <article className={`${styles.promo} ${styles.promoDark}`}>
                  <div><strong>{t.oil}</strong><span>-20%</span></div><div className={styles.promoArt}>🛢️</div>
                </article>
                <article className={`${styles.promo} ${styles.promoYellow}`}>
                  <div><strong>{t.tow}</strong><span>-15%</span></div><div className={styles.promoArt}>🚚</div>
                </article>
                <article className={`${styles.promo} ${styles.promoBlue}`}>
                  <div><strong>{t.tire}</strong><span>-10%</span></div><div className={styles.promoArt}>🛞</div>
                </article>
              </div>
              <div className={styles.dots}><i /><i /><i /><i /></div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2>{t.cars}</h2>
                <button onClick={() => setScreen('cars')}>{t.add}<Icon name="plus" /></button>
              </div>
              <button className={styles.carCard} onClick={() => setScreen('cars')}>
                <div className={styles.carPicture}>🚙</div>
                <div className={styles.carInfo}>
                  <strong>Toyota Prado</strong>
                  <span className={styles.plate}>🇰🇿 KZ 123 ABC 02</span>
                  <small>{t.mileage}</small>
                </div>
                <span className={styles.health}><b><Icon name="check" /></b>{t.good}</span>
                <span className={styles.carChevron}><Icon name="chevron" /></span>
              </button>
              <div className={styles.dots}><i /><i /><i /></div>
            </section>

            <section className={`${styles.section} ${styles.lastSection}`}>
              <div className={styles.sectionHead}>
                <h2>{t.reminders}</h2>
                <button onClick={() => setScreen('reminders')}>{t.seeAll}<Icon name="chevron" /></button>
              </div>
              <div className={styles.reminderCard}>
                <Reminder icon="🛢️" title={t.oilReminder} subtitle={t.inKm} right={t.days20} bottom={`${t.or} 15.06.2024`} progress />
                <Reminder icon="🛡️" title={t.insurance} subtitle={t.inDays} right="до 20.05.2024" />
                <Reminder icon="🔋" title={t.battery} subtitle={t.warranty} right="до 10.06.2025" />
                <Reminder icon="🛞" title={t.tireReminder} subtitle={t.inKmTire} right={t.days45} bottom={`${t.or} 10.07.2024`} />
              </div>
            </section>
          </>
        )}

        {screen === 'sos' && (
          <section className={styles.innerScreen}>
            <button className={styles.back} onClick={() => setScreen('home')}>← {t.back}</button>
            <h1>{t.urgentTitle}</h1>
            <p>{t.urgentSub}</p>
            <div className={styles.sosGrid}>
              {sosItems.map(item => (
                <button
                  key={item.id}
                  className={selectedSos === item.id ? styles.sosSelected : ''}
                  onClick={() => {
                    setSelectedSos(item.id)
                    createQuickOrder(item[lang])
                  }}
                >
                  <span>{item.icon}</span>
                  <strong>{item[lang]}</strong>
                  <Icon name="chevron" />
                </button>
              ))}
            </div>
          </section>
        )}

        {screen === 'services' && (
          <section className={styles.innerScreen}>
            <button className={styles.back} onClick={() => setScreen('home')}>← {t.back}</button>
            <h1>{t.allServices}</h1>
            <div className={styles.listCard}>
              {problems.map(problem => (
                <button key={problem.id} onClick={() => createQuickOrder(problem.title)}>
                  <span className={styles.listEmoji}>🧰</span>
                  <strong>{problem.title}</strong>
                  <Icon name="chevron" />
                </button>
              ))}
            </div>
          </section>
        )}

        {screen === 'cars' && (
          <section className={styles.innerScreen}>
            <button className={styles.back} onClick={() => setScreen('home')}>← {t.back}</button>
            <h1>{t.cars}</h1>
            <div className={styles.bigCarCard}>
              <div>🚙</div><h2>Toyota Prado</h2><span>🇰🇿 KZ 123 ABC 02</span><p>{t.mileage}</p>
            </div>
          </section>
        )}

        {screen === 'reminders' && (
          <section className={styles.innerScreen}>
            <button className={styles.back} onClick={() => setScreen('home')}>← {t.back}</button>
            <h1>{t.reminders}</h1>
            <div className={styles.reminderCard}>
              <Reminder icon="🛢️" title={t.oilReminder} subtitle={t.inKm} right={t.days20} bottom={`${t.or} 15.06.2024`} progress />
              <Reminder icon="🛡️" title={t.insurance} subtitle={t.inDays} right="до 20.05.2024" />
              <Reminder icon="🔋" title={t.battery} subtitle={t.warranty} right="до 10.06.2025" />
              <Reminder icon="🛞" title={t.tireReminder} subtitle={t.inKmTire} right={t.days45} bottom={`${t.or} 10.07.2024`} />
            </div>
          </section>
        )}

        {screen === 'orders' && (
          <section className={styles.innerScreen}>
            <h1>{t.orders}</h1>
            {orders.length === 0 ? (
              <div className={styles.empty}><span>📋</span><h2>{t.noOrders}</h2><p>{t.noOrdersSub}</p></div>
            ) : (
              <div className={styles.listCard}>
                {orders.map(order => (
                  <div className={styles.order} key={order.id}>
                    <strong>{order.problem}</strong>
                    <span>{order.master}</span>
                    <small>{order.status}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {screen === 'profile' && (
          <section className={styles.innerScreen}>
            <button className={styles.back} onClick={() => setScreen('home')}>← {t.back}</button>
            <h1>{t.profile}</h1>
            <div className={styles.profileCard}>
              <div className={styles.avatar}>Е</div><h2>Ержан</h2><p>Астана, Казахстан</p>
            </div>
          </section>
        )}

        <nav className={styles.bottomNav}>
          <NavButton active={tab === 'home'} icon="home" label={t.home} onClick={() => openTab('home')} />
          <NavButton active={tab === 'map'} icon="pin" label={t.map} onClick={() => openTab('map')} />
          <NavButton active={tab === 'sto'} icon="shop" label={t.sto} onClick={() => openTab('sto')} />
          <NavButton active={tab === 'orders'} icon="clipboard" label={t.orders} onClick={() => openTab('orders')} />
          <NavButton active={tab === 'profile'} icon="user" label={t.profile} onClick={() => openTab('profile')} />
        </nav>
      </div>
    </main>
  )
}

function Reminder({
  icon, title, subtitle, right, bottom, progress,
}: {
  icon: string
  title: string
  subtitle: string
  right: string
  bottom?: string
  progress?: boolean
}) {
  return (
    <button className={styles.reminder}>
      <span className={styles.reminderIcon}>{icon}</span>
      <span className={styles.reminderText}>
        <strong>{title}</strong>
        <small>{subtitle}</small>
        {progress && <i><b /></i>}
      </span>
      <span className={styles.reminderRight}>
        <strong>{right}</strong>
        {bottom && <small>{bottom}</small>}
      </span>
      <span className={styles.reminderChevron}><Icon name="chevron" /></span>
    </button>
  )
}

function NavButton({
  active, icon, label, onClick,
}: {
  active: boolean
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button className={active ? styles.navActive : ''} onClick={onClick}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  )
}
