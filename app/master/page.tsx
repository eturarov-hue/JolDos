'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage, type Lang } from '@/lib/i18n'

type SharedOrder={id:string;problem:string;location:string;client:string;vehicle:string;price:number;status:string;master?:string;createdAt:string}
type Tab='home'|'orders'|'earnings'|'profile'

const copy={
 cabinet:{ru:'Кабинет мастера',kk:'Шебер кабинеті',en:'Specialist workspace'},
 online:{ru:'Онлайн',kk:'Желіде',en:'Online'},offline:{ru:'Офлайн',kk:'Офлайн',en:'Offline'},
 greeting:{ru:'Добрый день, Айбек',kk:'Қайырлы күн, Айбек',en:'Good afternoon, Aibek'},
 today:{ru:'Сегодня',kk:'Бүгін',en:'Today'}, income:{ru:'Доход',kk:'Табыс',en:'Earnings'}, orders:{ru:'Заказы',kk:'Тапсырыстар',en:'Jobs'}, rating:{ru:'Рейтинг',kk:'Рейтинг',en:'Rating'}, response:{ru:'Время ответа',kk:'Жауап беру уақыты',en:'Response time'},
 goOnline:{ru:'Выйти на линию',kk:'Желіге шығу',en:'Go online'},endShift:{ru:'Завершить смену',kk:'Ауысымды аяқтау',en:'End shift'},
 liveMap:{ru:'Карта заявок',kk:'Өтінімдер картасы',en:'Request map'},nearby:{ru:'Рядом с вами',kk:'Сізге жақын',en:'Near you'},radius:{ru:'Радиус поиска: 10 км',kk:'Іздеу радиусы: 10 км',en:'Search radius: 10 km'},
 quick:{ru:'Быстрые действия',kk:'Жылдам әрекеттер',en:'Quick actions'}, history:{ru:'История заказов',kk:'Тапсырыстар тарихы',en:'Job history'}, support:{ru:'Поддержка',kk:'Қолдау',en:'Support'}, documents:{ru:'Документы',kk:'Құжаттар',en:'Documents'},
 newOrder:{ru:'Новый заказ',kk:'Жаңа тапсырыс',en:'New job'}, clientNeeds:{ru:'Водителю нужна помощь',kk:'Жүргізушіге көмек қажет',en:'Driver needs help'},vehicle:{ru:'Автомобиль',kk:'Көлік',en:'Vehicle'},problem:{ru:'Проблема',kk:'Мәселе',en:'Problem'},distance:{ru:'Расстояние',kk:'Қашықтық',en:'Distance'},price:{ru:'Стоимость',kk:'Құны',en:'Price'},decline:{ru:'Отклонить',kk:'Бас тарту',en:'Decline'},accept:{ru:'Принять',kk:'Қабылдау',en:'Accept'},
 activeOrder:{ru:'Активный заказ',kk:'Белсенді тапсырыс',en:'Active job'},call:{ru:'Позвонить',kk:'Қоңырау шалу',en:'Call'},chat:{ru:'Чат',kk:'Чат',en:'Chat'},navigate:{ru:'Открыть маршрут',kk:'Бағытты ашу',en:'Open route'},
 completed:{ru:'Завершённые',kk:'Аяқталған',en:'Completed'}, noHistory:{ru:'История заказов пока пуста',kk:'Тапсырыстар тарихы әзірге бос',en:'No completed jobs yet'},
 week:{ru:'Неделя',kk:'Апта',en:'Week'},month:{ru:'Месяц',kk:'Ай',en:'Month'},payout:{ru:'Доступно к выводу',kk:'Шығаруға қолжетімді',en:'Available payout'},withdraw:{ru:'Вывести средства',kk:'Қаражатты шығару',en:'Withdraw'},
 profile:{ru:'Профиль мастера',kk:'Шебер профилі',en:'Specialist profile'},verified:{ru:'Проверен JolDos',kk:'JolDos тексерген',en:'Verified by JolDos'},specialties:{ru:'Специализации',kk:'Мамандықтар',en:'Specialties'},stats:{ru:'Показатели',kk:'Көрсеткіштер',en:'Performance'},accepted:{ru:'Принято заказов',kk:'Қабылданған тапсырыстар',en:'Accepted jobs'},cancelled:{ru:'Отменено',kk:'Бас тартылған тапсырыстар',en:'Cancelled'},experience:{ru:'Опыт',kk:'Тәжірибе',en:'Experience'},years:{ru:'7 лет',kk:'7 жыл',en:'7 years'},
 home:{ru:'Главная',kk:'Басты бет',en:'Home'}, earningsTab:{ru:'Доход',kk:'Табыс',en:'Earnings'},profileTab:{ru:'Профиль',kk:'Жеке кабинет',en:'Profile'}, roleBack:{ru:'Сменить роль',kk:'Рөлді ауыстыру',en:'Change role'},
 completedTitle:{ru:'Заказ завершён',kk:'Тапсырыс аяқталды',en:'Job completed'},great:{ru:'Отличная работа!',kk:'Керемет жұмыс!',en:'Great work!'},received:{ru:'Получено',kk:'Алынды',en:'Received'},backHome:{ru:'Вернуться на главную',kk:'Басты бетке оралу',en:'Back to home'}
} as const

const statusMap:Record<string,Record<Lang,string>>={
 'Новый заказ':{kk:'Жаңа тапсырыс',ru:'Новый заказ',en:'New job'},
 'Мастер принял заказ':{kk:'Шебер тапсырысты қабылдады',ru:'Мастер принял заказ',en:'Job accepted'},
 'Мастер едет':{kk:'Шебер жолда',ru:'Мастер едет',en:'On the way'},
 'Мастер прибыл':{kk:'Шебер келді',ru:'Мастер прибыл',en:'Arrived'},
 'Работа выполняется':{kk:'Жұмыс орындалуда',ru:'Работа выполняется',en:'Work in progress'},
 'Завершён':{kk:'Аяқталды',ru:'Завершён',en:'Completed'}
}
const flow=['Мастер принял заказ','Мастер едет','Мастер прибыл','Работа выполняется','Завершён']
const historySeed=[
 {id:'h1',car:'Toyota Camry',service:{ru:'Запуск аккумулятора',kk:'Аккумуляторды іске қосу',en:'Battery jump-start'},price:7000,time:'10:40'},
 {id:'h2',car:'Kia Sportage',service:{ru:'Замена колеса',kk:'Дөңгелек ауыстыру',en:'Tire replacement'},price:6500,time:'08:15'}
]

export default function Master(){
 const {lang,setLang}=useLanguage(); const tx=(k:keyof typeof copy)=>copy[k][lang]; const st=(s:string)=>statusMap[s]?.[lang]||s; const locale=lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU'; const problemText=(v:string)=>{const key=v.toLowerCase();if(key.includes('отал')||key.includes('завод')||key.includes('start'))return lang==='kk'?'Көлік оталмай тұр':lang==='en'?"Won’t start":'Не заводится';if(key.includes('дөңгел')||key.includes('колес')||key.includes('tire'))return lang==='kk'?'Дөңгелек мәселесі':lang==='en'?'Tire problem':'Проблема с колесом';if(key.includes('эваку')||key.includes('tow'))return lang==='kk'?'Эвакуатор қажет':lang==='en'?'Tow truck needed':'Нужен эвакуатор';return v}
 const [tab,setTab]=useState<Tab>('home'),[online,setOnline]=useState(false),[order,setOrder]=useState<SharedOrder|null>(null),[toast,setToast]=useState(''),[earnings,setEarnings]=useState(38500),[completed,setCompleted]=useState(4),[countdown,setCountdown]=useState(20),[history,setHistory]=useState(historySeed)
 const notify=(v:string)=>{setToast(v);window.setTimeout(()=>setToast(''),2200)}
 useEffect(()=>{if(!online)return;const load=async()=>{try{const r=await fetch('/api/orders',{cache:'no-store'});const d=await r.json();setOrder(d.order||null)}catch{}};void load();const timer=window.setInterval(load,1000);return()=>window.clearInterval(timer)},[online])
 useEffect(()=>{if(!order||order.status!=='Новый заказ')return;setCountdown(20);const timer=window.setInterval(()=>setCountdown(v=>v>0?v-1:0),1000);return()=>window.clearInterval(timer)},[order?.id,order?.status])
 const current=order?flow.indexOf(order.status):-1;const next=useMemo(()=>flow[Math.min(current+1,flow.length-1)]||flow[0],[current])
 async function patch(data:Record<string,unknown>){const r=await fetch('/api/orders',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();setOrder(d.order);return d.order as SharedOrder}
 async function accept(){await patch({status:'Мастер принял заказ',master:'Айбек Нурланов'});notify(st('Мастер принял заказ'))}
 async function reject(){await fetch('/api/orders',{method:'DELETE'});setOrder(null);notify(tx('decline'))}
 async function advance(){const updated=await patch({status:next});notify(st(updated.status));if(updated.status==='Завершён'){setEarnings(v=>v+updated.price);setCompleted(v=>v+1);setHistory(v=>[{id:updated.id,car:updated.vehicle,service:{ru:updated.problem,kk:updated.problem,en:updated.problem},price:updated.price,time:new Date().toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})},...v])}}
 async function clearFinished(){await fetch('/api/orders',{method:'DELETE'});setOrder(null);setTab('home')}

 return <main className="master-shell"><section className="master-phone pro-master">
  <header className="master-header"><div className="master-header-left"><Link href="/" className="role-back" aria-label={tx('roleBack')}>←</Link><div className="master-brand"><img src="/joldos-logo.png" alt="JolDos"/><div><b>JolDos Master</b><small>{tx('cabinet')}</small></div></div></div><div className="master-header-tools"><LanguageSwitcher lang={lang} onChange={setLang} compact/><span className={online?'master-online':'master-offline'}>{online?tx('online'):tx('offline')}</span></div></header>

  {order?.status==='Новый заказ'&&<div className="incoming-job pro-incoming"><div className="incoming-badge">{tx('newOrder')} <b>{countdown}</b></div><div className="incoming-pulse">🚗</div><h1>{tx('clientNeeds')}</h1><article><small>{tx('vehicle')}</small><h2>{order.vehicle}</h2><div><span><small>{tx('problem')}</small><b>{problemText(order.problem)}</b></span><span><small>{tx('distance')}</small><b>{lang==='en'?'1.8 km':'1,8 км'}</b></span><span><small>{tx('price')}</small><b>{order.price.toLocaleString('ru-RU')} ₸</b></span></div><p>⌖ {order.location}</p></article><div className="job-actions"><button onClick={reject}>{tx('decline')}</button><button onClick={accept}>{tx('accept')}</button></div></div>}

  {order&&order.status!=='Новый заказ'&&order.status!=='Завершён'&&<div className="active-job pro-active"><div className="master-map"><span className="client-dot">К</span><span className="car-dot-master">М</span><i/></div><section><small>{tx('activeOrder')}</small><h1>{st(order.status)}</h1><div className="client-info"><b>{order.client}</b><span>{order.vehicle} · {problemText(order.problem)}</span></div><div className="active-tools"><a href="tel:+77071234567">☎<small>{tx('call')}</small></a><button onClick={()=>notify(tx('chat'))}>💬<small>{tx('chat')}</small></button><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.location)}`} target="_blank" rel="noreferrer">➤<small>{tx('navigate')}</small></a></div><p>⌖ {order.location}</p><div className="master-timeline">{flow.slice(0,4).map((s,i)=><div className={i<=current?'done':''} key={s}><i>{i<current?'✓':i+1}</i><span>{st(s)}</span></div>)}</div><button className="master-primary" onClick={advance}>{st(next)}<b>→</b></button></section></div>}

  {order?.status==='Завершён'&&<div className="master-complete"><span>✓</span><small>{tx('completedTitle')}</small><h1>{tx('great')}</h1><div><small>{tx('received')}</small><b>{order.price.toLocaleString('ru-RU')} ₸</b></div><button onClick={clearFinished}>{tx('backHome')}</button></div>}

  {!order&&<><div className="master-content pro-master-content">
   {tab==='home'&&<>
    <section className="master-welcome"><div><small>{tx('today')}</small><h1>{tx('greeting')}</h1><p>{online?tx('nearby'):tx('goOnline')}</p></div><button className={online?'is-on':''} onClick={()=>setOnline(v=>!v)}><i/>{online?tx('endShift'):tx('goOnline')}</button></section>
    <div className="master-stats master-stats-pro"><article><small>{tx('income')}</small><b>{earnings.toLocaleString('ru-RU')} ₸</b><em>+12%</em></article><article><small>{tx('orders')}</small><b>{completed}</b><em>+2</em></article><article><small>{tx('rating')}</small><b>★ 4.9</b><em>521</em></article><article><small>{tx('response')}</small><b>{lang==='en'?'8 sec':lang==='kk'?'8 сек':'8 сек'}</b><em>98%</em></article></div>
    <section className="master-live-map"><div className="map-head"><div><small>{tx('liveMap')}</small><h2>{online?tx('nearby'):tx('goOnline')}</h2></div><span>{tx('radius')}</span></div><div className="map-canvas"><i className="road r1"/><i className="road r2"/><span className="you-marker">М</span><span className="job-marker jm1">1</span><span className="job-marker jm2">2</span><span className="zone-ring"/></div></section>
    <section className="master-quick"><h2>{tx('quick')}</h2><div><button onClick={()=>setTab('orders')}>▤<span>{tx('history')}</span></button><a href="tel:+77000000000">☎<span>{tx('support')}</span></a><button onClick={()=>notify(tx('documents'))}>✓<span>{tx('documents')}</span></button></div></section>
   </>}
   {tab==='orders'&&<section className="master-page-section"><div className="page-heading"><small>{tx('orders')}</small><h1>{tx('completed')}</h1></div>{history.length===0?<p className="empty-state">{tx('noHistory')}</p>:history.map(h=><article className="history-card" key={h.id}><span>✓</span><div><b>{h.car}</b><small>{h.service[lang]} · {h.time}</small></div><strong>{h.price.toLocaleString('ru-RU')} ₸</strong></article>)}</section>}
   {tab==='earnings'&&<section className="master-page-section"><div className="earnings-hero"><small>{tx('payout')}</small><h1>{earnings.toLocaleString('ru-RU')} ₸</h1><button onClick={()=>notify(tx('withdraw'))}>{tx('withdraw')}</button></div><div className="earning-periods"><article><small>{tx('today')}</small><b>38 500 ₸</b></article><article><small>{tx('week')}</small><b>214 000 ₸</b></article><article><small>{tx('month')}</small><b>812 000 ₸</b></article></div><div className="income-chart">{[34,52,41,68,58,78,92].map((h,i)=><i key={i} style={{height:`${h}%`}}/> )}</div></section>}
   {tab==='profile'&&<section className="master-page-section"><div className="profile-hero"><div className="profile-avatar">АН</div><h1>Айбек Нурланов</h1><p>{tx('verified')} ✓</p><div><span>★ 4.9</span><span>521 {tx('orders').toLowerCase()}</span></div></div><h2>{tx('specialties')}</h2><div className="specialty-list"><span>⚡ {lang==='kk'?'Автоэлектрик':lang==='en'?'Auto electrician':'Автоэлектрик'}</span><span>🔧 {lang==='kk'?'Көшпелі механик':lang==='en'?'Mobile mechanic':'Выездной механик'}</span><span>🔋 {lang==='kk'?'Аккумулятор қызметі':lang==='en'?'Battery service':'Аккумулятор'}</span></div><h2>{tx('stats')}</h2><div className="profile-metrics"><article><small>{tx('accepted')}</small><b>98%</b></article><article><small>{tx('cancelled')}</small><b>2%</b></article><article><small>{tx('experience')}</small><b>{tx('years')}</b></article></div></section>}
  </div><nav className="master-bottom-nav">{([['home','⌂',tx('home')],['orders','▤',tx('orders')],['earnings','₸',tx('earningsTab')],['profile','○',tx('profileTab')]] as [Tab,string,string][]).map(([id,icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><b>{icon}</b><span>{label}</span></button>)}</nav></>}
  {toast&&<div className="toast">{toast}</div>}
 </section></main>
}
