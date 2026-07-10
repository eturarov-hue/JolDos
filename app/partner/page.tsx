'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage, type Lang } from '@/lib/i18n'

type PartnerTab='dashboard'|'orders'|'team'|'services'|'analytics'
type Job={id:number;car:string;problem:Record<Lang,string>;distance:string;price:number;client:string;status:'new'|'active'|'done';master?:string}
type Staff={id:number;name:string;role:Record<Lang,string>;status:'online'|'busy'|'offline';rating:number;jobs:number}

const c={
 title:{ru:'JolDos Partner',kk:'JolDos Partner',en:'JolDos Partner'},sub:{ru:'Кабинет СТО',kk:'Автосервис кабинеті',en:'Service center dashboard'},roleBack:{ru:'Сменить роль',kk:'Рөлді ауыстыру',en:'Change role'},
 today:{ru:'Сегодня',kk:'Бүгін',en:'Today'},open:{ru:'Открыто до 22:00',kk:'22:00-ге дейін ашық',en:'Open until 22:00'},orders:{ru:'Заказы',kk:'Тапсырыстар',en:'Orders'},revenue:{ru:'Выручка',kk:'Түсім',en:'Revenue'},masters:{ru:'Мастера',kk:'Шеберлер',en:'Specialists'},rating:{ru:'Рейтинг',kk:'Рейтинг',en:'Rating'},
 newOrders:{ru:'Новые заявки',kk:'Жаңа өтінімдер',en:'New requests'},vehicle:{ru:'Автомобиль',kk:'Көлік',en:'Vehicle'},problem:{ru:'Проблема',kk:'Мәселе',en:'Problem'},price:{ru:'Цена',kk:'Баға',en:'Price'},activeOrders:{ru:'Активные заказы',kk:'Белсенді тапсырыстар',en:'Active jobs'},accept:{ru:'Принять',kk:'Қабылдау',en:'Accept'},decline:{ru:'Отклонить',kk:'Бас тарту',en:'Decline'},assign:{ru:'Назначить мастера',kk:'Шеберді тағайындау',en:'Assign specialist'},details:{ru:'Подробнее',kk:'Толығырақ',en:'Details'},
 team:{ru:'Команда',kk:'Қызметкерлер',en:'Team'},services:{ru:'Услуги',kk:'Қызметтер',en:'Services'},analytics:{ru:'Аналитика',kk:'Аналитика',en:'Analytics'},dashboard:{ru:'Обзор',kk:'Шолу',en:'Overview'},
 online:{ru:'Онлайн',kk:'Желіде',en:'Online'},busy:{ru:'Занят',kk:'Бос емес',en:'Busy'},offline:{ru:'Офлайн',kk:'Офлайн',en:'Offline'},all:{ru:'Все',kk:'Барлығы',en:'All'},
 addMaster:{ru:'Добавить мастера',kk:'Шебер қосу',en:'Add specialist'},schedule:{ru:'График',kk:'Кесте',en:'Schedule'},edit:{ru:'Изменить',kk:'Өзгерту',en:'Edit'},addService:{ru:'Добавить услугу',kk:'Қызмет қосу',en:'Add service'},
 popular:{ru:'Популярные услуги',kk:'Танымал қызметтер',en:'Popular services'},avgCheck:{ru:'Средний чек',kk:'Орташа тапсырыс сомасы',en:'Average order value'},load:{ru:'Загрузка',kk:'Жүктелу деңгейі',en:'Utilization'},repeat:{ru:'Повторные клиенты',kk:'Қайта келген клиенттер',en:'Repeat customers'},
 thisWeek:{ru:'За неделю',kk:'Осы апта',en:'This week'},month:{ru:'Месяц',kk:'Ай',en:'Month'},reviews:{ru:'Отзывы',kk:'Пікірлер',en:'Reviews'},
 noActive:{ru:'Нет активных заказов',kk:'Белсенді тапсырыс жоқ',en:'No active jobs'},toastAccepted:{ru:'Заказ принят',kk:'Тапсырыс қабылданды',en:'Job accepted'},toastDeclined:{ru:'Заявка отклонена',kk:'Өтінімнен бас тартылды',en:'Request declined'}
} as const

const initialJobs:Job[]=[
 {id:1,car:'Toyota Prado 120',problem:{ru:'Не заводится',kk:'Көлік оталмай тұр',en:"Won't start"},distance:'2,1 км',price:7000,client:'Ержан',status:'new'},
 {id:2,car:'Kia Sportage',problem:{ru:'Проблема с колесом',kk:'Дөңгелек мәселесі',en:'Flat tire'},distance:'3,4 км',price:6500,client:'Айдана',status:'new'},
 {id:3,car:'Hyundai Tucson',problem:{ru:'Диагностика',kk:'Диагностика',en:'Diagnostics'},distance:'1,2 км',price:9000,client:'Марат',status:'active',master:'Алибек'}
]
const initialStaff:Staff[]=[
 {id:1,name:'Алибек',role:{ru:'Автоэлектрик',kk:'Автоэлектрик',en:'Auto electrician'},status:'busy',rating:4.9,jobs:312},
 {id:2,name:'Диас',role:{ru:'Шиномонтаж',kk:'Шиномонтаж',en:'Tire specialist'},status:'online',rating:4.8,jobs:245},
 {id:3,name:'Руслан',role:{ru:'Механик',kk:'Механик',en:'Mechanic'},status:'offline',rating:4.7,jobs:198},
 {id:4,name:'Ермек',role:{ru:'Эвакуатор',kk:'Эвакуатор',en:'Tow truck'},status:'online',rating:4.9,jobs:426}
]
const serviceSeed=[
 {id:1,name:{ru:'Компьютерная диагностика',kk:'Компьютерлік диагностика',en:'Computer diagnostics'},price:8000,time:'40 мин',enabled:true},
 {id:2,name:{ru:'Запуск аккумулятора',kk:'Аккумуляторды іске қосу',en:'Battery jump-start'},price:7000,time:'25 мин',enabled:true},
 {id:3,name:{ru:'Выездной шиномонтаж',kk:'Көшпелі шиномонтаж',en:'Mobile tire service'},price:6500,time:'35 мин',enabled:true},
 {id:4,name:{ru:'Эвакуатор',kk:'Эвакуатор',en:'Tow truck'},price:12000,time:'45 мин',enabled:false}
]

export default function Partner(){
 const {lang,setLang}=useLanguage(); const tr=(v:Record<Lang,string>)=>v[lang]; const locale=lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU'; const duration=(v:string)=>{const n=v.split(' ')[0];return lang==='en'?`${n} min`:`${n} мин`}
 const [tab,setTab]=useState<PartnerTab>('dashboard'),[jobs,setJobs]=useState(initialJobs),[staff]=useState(initialStaff),[services,setServices]=useState(serviceSeed),[toast,setToast]=useState('')
 const notify=(s:string)=>{setToast(s);window.setTimeout(()=>setToast(''),2200)}
 const newJobs=useMemo(()=>jobs.filter(j=>j.status==='new'),[jobs]); const active=useMemo(()=>jobs.filter(j=>j.status==='active'),[jobs]);
 function acceptJob(id:number){const available=staff.find(s=>s.status==='online');setJobs(v=>v.map(j=>j.id===id?{...j,status:'active',master:available?.name||(lang==='kk'?'Автосервис':lang==='en'?'Service center':'СТО')}:j));notify(c.toastAccepted[lang])}
 function declineJob(id:number){setJobs(v=>v.filter(j=>j.id!==id));notify(c.toastDeclined[lang])}

 return <main className="partner-shell"><section className="partner-app pro-partner">
  <header className="partner-header"><div><Link href="/" className="role-back" aria-label={c.roleBack[lang]}>←</Link><img src="/joldos-logo.png" alt="JolDos"/><div><b>{c.title[lang]}</b><small>{c.sub[lang]}</small></div></div><LanguageSwitcher lang={lang} onChange={setLang} compact/></header>
  <div className="partner-layout"><aside className="partner-sidebar"><div className="partner-company"><span>AE</span><div><b>AutoExpert Astana</b><small>Кабанбай батыр, 18</small></div></div>{([['dashboard','⌂',c.dashboard[lang]],['orders','▤',c.orders[lang]],['team','♙',c.team[lang]],['services','⚙',c.services[lang]],['analytics','◫',c.analytics[lang]]] as [PartnerTab,string,string][]).map(([id,icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><b>{icon}</b><span>{label}</span>{id==='orders'&&newJobs.length>0?<i>{newJobs.length}</i>:null}</button>)}</aside>
   <section className="partner-main"><div className="partner-mobile-tabs">{([['dashboard','⌂'],['orders','▤'],['team','♙'],['services','⚙'],['analytics','◫']] as [PartnerTab,string][]).map(([id,icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{icon}{id==='orders'&&newJobs.length>0?<i>{newJobs.length}</i>:null}</button>)}</div>
    {tab==='dashboard'&&<div className="partner-content pro-partner-content">
     <section className="partner-hero pro-partner-hero"><div><small>{c.today[lang]}</small><h1>AutoExpert Astana</h1><p>Кабанбай батыр, 18 · {c.open[lang]}</p></div><span>● {c.online[lang]}</span></section>
     <div className="partner-stats"><article><small>{c.orders[lang]}</small><b>17</b><em>+21%</em></article><article><small>{c.revenue[lang]}</small><b>186 000 ₸</b><em>+14%</em></article><article><small>{c.masters[lang]}</small><b>{staff.length}</b><em>{staff.filter(s=>s.status!=='offline').length} {c.online[lang].toLowerCase()}</em></article><article><small>{c.rating[lang]}</small><b>★ 4.9</b><em>428 {c.reviews[lang].toLowerCase()}</em></article></div>
     <div className="partner-dashboard-grid"><section className="partner-section"><div className="partner-title"><h2>{c.newOrders[lang]}</h2><span>{newJobs.length}</span></div>{newJobs.map(j=><article className="partner-job" key={j.id}><div><small>{j.distance}</small><h3>{j.car}</h3><p>{tr(j.problem)} · {j.client}</p><b>{j.price.toLocaleString(locale)} ₸</b></div><div><button onClick={()=>declineJob(j.id)}>{c.decline[lang]}</button><button onClick={()=>acceptJob(j.id)}>{c.accept[lang]}</button></div></article>)}</section>
      <section className="partner-section"><div className="partner-title"><h2>{c.activeOrders[lang]}</h2><span>{active.length}</span></div>{active.length===0?<p className="empty-state">{c.noActive[lang]}</p>:active.map(j=><article className="active-partner-job" key={j.id}><span>🔧</span><div><h3>{j.car}</h3><p>{tr(j.problem)} · {j.master}</p></div><button onClick={()=>setTab('orders')}>{c.details[lang]}</button></article>)}</section></div>
     <section className="partner-section"><div className="partner-title"><h2>{c.team[lang]}</h2><button className="text-action" onClick={()=>setTab('team')}>{c.details[lang]} →</button></div><div className="team-list compact-team">{staff.slice(0,4).map(s=><article key={s.id}><span>{s.name[0]}</span><div><b>{s.name}</b><small>{tr(s.role)} · ★ {s.rating}</small></div><i className={`status-${s.status}`}>{c[s.status][lang]}</i></article>)}</div></section>
    </div>}

    {tab==='orders'&&<div className="partner-content pro-partner-content"><div className="partner-page-head"><div><small>{c.orders[lang]}</small><h1>{c.orders[lang]}</h1></div><div className="segmented"><button className="active">{c.all[lang]}</button><button>{c.newOrders[lang]}</button><button>{c.activeOrders[lang]}</button></div></div><section className="order-table"><div className="order-row order-row-head"><span>ID</span><span>{c.vehicle[lang]}</span><span>{c.problem[lang]}</span><span>{c.masters[lang]}</span><span>{c.price[lang]}</span><span></span></div>{jobs.map(j=><article className="order-row" key={j.id}><b>#{j.id.toString().padStart(4,'0')}</b><span>{j.car}<small>{j.client}</small></span><span>{tr(j.problem)}<small>{j.distance}</small></span><span>{j.master||'—'}</span><strong>{j.price.toLocaleString(locale)} ₸</strong><button onClick={()=>j.status==='new'?acceptJob(j.id):notify(c.details[lang])}>{j.status==='new'?c.accept[lang]:c.open?.[lang]||c.details[lang]}</button></article>)}</section></div>}

    {tab==='team'&&<div className="partner-content pro-partner-content"><div className="partner-page-head"><div><small>{c.team[lang]}</small><h1>{c.team[lang]}</h1></div><button className="partner-primary" onClick={()=>notify(c.addMaster[lang])}>+ {c.addMaster[lang]}</button></div><div className="staff-grid">{staff.map(s=><article className="staff-card" key={s.id}><div className="staff-avatar">{s.name.slice(0,2)}</div><span className={`staff-dot ${s.status}`}/><h3>{s.name}</h3><p>{tr(s.role)}</p><div><span>★ {s.rating}</span><span>{s.jobs} {c.orders[lang].toLowerCase()}</span></div><small className={`staff-status ${s.status}`}>{c[s.status][lang]}</small><button onClick={()=>notify(c.schedule[lang])}>{c.schedule[lang]}</button></article>)}</div></div>}

    {tab==='services'&&<div className="partner-content pro-partner-content"><div className="partner-page-head"><div><small>{c.services[lang]}</small><h1>{c.services[lang]}</h1></div><button className="partner-primary" onClick={()=>notify(c.addService[lang])}>+ {c.addService[lang]}</button></div><section className="service-admin">{services.map(s=><article key={s.id}><div><h3>{tr(s.name)}</h3><p>{duration(s.time)}</p></div><strong>{s.price.toLocaleString(locale)} ₸</strong><label className="switch"><input type="checkbox" checked={s.enabled} onChange={()=>setServices(v=>v.map(x=>x.id===s.id?{...x,enabled:!x.enabled}:x))}/><span/></label><button onClick={()=>notify(c.edit[lang])}>{c.edit[lang]}</button></article>)}</section></div>}

    {tab==='analytics'&&<div className="partner-content pro-partner-content"><div className="partner-page-head"><div><small>{c.analytics[lang]}</small><h1>{c.analytics[lang]}</h1></div><div className="segmented"><button className="active">{c.thisWeek[lang]}</button><button>{c.month[lang]}</button></div></div><div className="analytics-cards"><article><small>{c.revenue[lang]}</small><b>1 284 000 ₸</b><em>+18.4%</em></article><article><small>{c.avgCheck[lang]}</small><b>9 450 ₸</b><em>+6.2%</em></article><article><small>{c.load[lang]}</small><b>78%</b><em>+9%</em></article><article><small>{c.repeat[lang]}</small><b>41%</b><em>+4%</em></article></div><section className="analytics-panel"><div className="chart-head"><h2>{c.revenue[lang]}</h2><b>1 284 000 ₸</b></div><div className="partner-chart">{[45,62,51,76,66,88,72,96,82,74,90,100].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></section><section className="partner-section"><div className="partner-title"><h2>{c.popular[lang]}</h2></div>{services.slice(0,3).map((s,i)=><div className="popular-service" key={s.id}><b>{i+1}</b><span>{tr(s.name)}</span><strong>{[42,31,19][i]}%</strong></div>)}</section></div>}
   </section>
  </div>{toast&&<div className="toast">{toast}</div>}
 </section></main>
}
