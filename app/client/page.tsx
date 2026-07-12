'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { ChatSheet } from '@/components/ChatSheet'
import { MapView } from '@/components/MapView'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n'
import { getMasters, getProblems, getStations, statusSteps, statusText } from '@/lib/mock-data'
import type { Order, Stage, Tab } from '@/types'

type ServiceType = 'road_assistance' | 'tow_truck' | 'battery' | 'tire_service' | 'fuel_delivery' | 'car_unlock' | 'car_wash' | 'service_station'
type ProviderType = 'master' | 'tow_truck' | 'electrician' | 'tire_service' | 'fuel_delivery' | 'locksmith' | 'car_wash' | 'service_station'
type ClientOrder = Order & { serviceType?: ServiceType; providerType?: ProviderType }
type ServiceRoute = { problemId: string; serviceType: ServiceType; providerType: ProviderType }

const serviceRoutes: Record<string, ServiceRoute> = {
  tow: { problemId: 'tow', serviceType: 'tow_truck', providerType: 'tow_truck' },
  battery: { problemId: 'start', serviceType: 'battery', providerType: 'electrician' },
  wheel: { problemId: 'wheel', serviceType: 'tire_service', providerType: 'tire_service' },
  fuel: { problemId: 'fuel', serviceType: 'fuel_delivery', providerType: 'fuel_delivery' },
  unlock: { problemId: 'other', serviceType: 'car_unlock', providerType: 'locksmith' },
  repair: { problemId: 'other', serviceType: 'road_assistance', providerType: 'master' },
  wash: { problemId: 'other', serviceType: 'car_wash', providerType: 'car_wash' },
  station: { problemId: 'other', serviceType: 'service_station', providerType: 'service_station' },
}

function routeForProblem(problemId: string): ServiceRoute {
  if (problemId === 'tow') return serviceRoutes.tow
  if (problemId === 'start') return serviceRoutes.battery
  if (problemId === 'wheel') return serviceRoutes.wheel
  if (problemId === 'fuel') return serviceRoutes.fuel
  return serviceRoutes.repair
}

const ACTIVE_ORDER_STATUSES = new Set([
  'Новый заказ',
  'Ищем мастера',
  'Мастер принял заказ',
  'Мастер едет',
  'Мастер прибыл',
  'Работа выполняется',
])

function isActiveOrderStatus(status: unknown) {
  return ACTIVE_ORDER_STATUSES.has(String(status))
}

export default function Home(){
  const {lang,setLang}=useLanguage()
  const ui={
    title:{ru:'Что случилось',kk:'Не болды',en:'What happened'}, car:{ru:'с автомобилем?',kk:'көлікке?',en:'to your car?'},
    subtitle:{ru:'Выберите проблему — найдём проверенного мастера рядом.',kk:'Мәселені таңдаңыз — жақын жерден тексерілген шебер табамыз.',en:'Choose the problem — we will find a trusted specialist nearby.'},
    choose:{ru:'Выберите проблему',kk:'Мәселені таңдаңыз',en:'Choose a problem'}, required:{ru:'Обязательно',kk:'Міндетті',en:'Required'}, selected:{ru:'Выбрано',kk:'Таңдалды',en:'Selected'},
    location:{ru:'Ваше местоположение',kk:'Сіздің орналасқан жеріңіз',en:'Your location'}, find:{ru:'Найти ближайшую помощь',kk:'Жақын көмекті табу',en:'Find nearby help'}, searching:{ru:'Ищем ближайшего мастера',kk:'Жақын шеберді іздеп жатырмыз',en:'Searching for a nearby specialist'}, cancel:{ru:'Отменить поиск',kk:'Іздеуді тоқтату',en:'Cancel search'},
    nearest:{ru:'Ближайший мастер',kk:'Ең жақын шебер',en:'Nearest specialist'}, call:{ru:'Вызвать мастера',kk:'Шеберді шақыру',en:'Request specialist'}, current:{ru:'Текущий заказ',kk:'Ағымдағы тапсырыс',en:'Current order'},
    home:{ru:'Главная',kk:'Басты бет',en:'Home'}, map:{ru:'Карта',kk:'Карта',en:'Map'}, sto:{ru:'СТО',kk:'Автосервис',en:'Services'}, orders:{ru:'Заказы',kk:'Тапсырыстар',en:'Orders'}, profile:{ru:'Профиль',kk:'Профиль',en:'Profile'}, roleBack:{ru:'Сменить роль',kk:'Рөлді ауыстыру',en:'Change role'},
    availability:{ru:'Помощь доступна 24/7',kk:'Көмек тәулік бойы қолжетімді',en:'Help is available 24/7'}, emergency:{ru:'Экстренная помощь',kk:'Шұғыл көмек',en:'Emergency assistance'}, call112:{ru:'Позвонить 112',kk:'112 нөміріне қоңырау шалу',en:'Call 112'}, step1:{ru:'Шаг 1',kk:'1-қадам',en:'Step 1'},
    ratingWord:{ru:'рейтинг',kk:'рейтинг',en:'rating'}, arrival:{ru:'прибытие',kk:'келу уақыты',en:'arrival'}, verified:{ru:'проверены',kk:'тексерілген',en:'verified'}, firstChoose:{ru:'Сначала выберите проблему',kk:'Алдымен мәселені таңдаңыз',en:'Choose a problem first'}, geoUnsupported:{ru:'Геолокация не поддерживается',kk:'Геолокацияға қолдау көрсетілмейді',en:'Geolocation is not supported'}, geoHttps:{ru:'На телефоне геолокация работает только через HTTPS',kk:'Телефонда геолокация тек HTTPS арқылы жұмыс істейді',en:'On mobile, geolocation requires HTTPS'}, geoFound:{ru:'Местоположение определено',kk:'Орналасқан жер анықталды',en:'Location detected'}, geoAllow:{ru:'Разрешите доступ к геолокации',kk:'Геолокацияға рұқсат беріңіз',en:'Allow location access'},
    helpRoad:{ru:'Помощь на дороге',kk:'Жолдағы көмек',en:'Roadside assistance'}, searchingMaster:{ru:'Ищем мастера',kk:'Шебер ізделуде',en:'Searching for a specialist'}, requestSent:{ru:'Заявка отправлена мастерам',kk:'Өтінім шеберлерге жіберілді',en:'Request sent to specialists'}, requestFailed:{ru:'Не удалось отправить заявку',kk:'Өтінімді жіберу мүмкін болмады',en:'Could not send request'}, cancelOrder:{ru:'Отменить заказ',kk:'Тапсырысты болдырмау',en:'Cancel order'}, cancelConfirm:{ru:'Отменить текущий заказ?',kk:'Ағымдағы тапсырысты болдырмау керек пе?',en:'Cancel the current order?'}, cancelSuccess:{ru:'Заказ отменён',kk:'Тапсырыс болдырылмады',en:'Order cancelled'}, cancelFailed:{ru:'Не удалось отменить заказ',kk:'Тапсырысты болдырмау мүмкін болмады',en:'Could not cancel the order'}, workDoneRate:{ru:'Работа завершена — оцените мастера',kk:'Жұмыс аяқталды — шеберді бағалаңыз',en:'Work completed — rate the specialist'}, rateRequired:{ru:'Поставьте оценку мастеру',kk:'Шеберге баға беріңіз',en:'Rate the specialist'}, thanksRating:{ru:'Спасибо за оценку!',kk:'Бағаңызға рақмет!',en:'Thank you for your rating!'}, messageSent:{ru:'Сообщение отправлено',kk:'Хабарлама жіберілді',en:'Message sent'},
    findPrefix:{ru:'Найти помощь',kk:'Көмек табу',en:'Find help'}, reviews:{ru:'отзывов',kk:'пікір',en:'reviews'}, toYou:{ru:'до вас',kk:'сізге дейін',en:'to you'}, distanceWord:{ru:'расстояние',kk:'қашықтық',en:'distance'}, yourProblem:{ru:'Ваша проблема',kk:'Сіздің мәселеңіз',en:'Your problem'}, calloutCost:{ru:'Стоимость выезда',kk:'Шақыру құны',en:'Call-out price'}, expectedArrival:{ru:'Ожидаемое прибытие',kk:'Күтілетін келу уақыты',en:'Expected arrival'}, onSite:{ru:'Мастер на месте',kk:'Шебер орнында',en:'Specialist is on site'}, waitUpdate:{ru:'Ожидать обновление от мастера',kk:'Шебердің жаңартуын күту',en:'Wait for specialist update'}, statusByMaster:{ru:'Статус меняет мастер в JolDos Master',kk:'Мәртебені JolDos Master қолданбасындағы шебер өзгертеді',en:'The specialist updates the status in JolDos Master'}, howWas:{ru:'Как всё прошло?',kk:'Қызмет қалай өтті?',en:'How did it go?'}, rateWork:{ru:'Оцените работу мастера',kk:'Шебердің жұмысын бағалаңыз',en:'Rate the specialist’s work'}, finishHome:{ru:'Завершить и вернуться на главную',kk:'Аяқтап, басты бетке оралу',en:'Finish and return home'},
    mapHelp:{ru:'Карта помощи',kk:'Көмек картасы',en:'Assistance map'}, chooseNearest:{ru:'Выберите ближайшего мастера',kk:'Ең жақын шеберді таңдаңыз',en:'Choose the nearest specialist'}, catalog:{ru:'Каталог СТО',kk:'Автосервистер каталогы',en:'Service center directory'}, trustedAstana:{ru:'Проверенные сервисы Астаны',kk:'Астанадағы тексерілген автосервистер',en:'Verified service centers in Astana'}, cardOpened:{ru:'Карточка открыта',kk:'Карточка ашылды',en:'Card opened'}, myOrders:{ru:'Мои заказы',kk:'Менің тапсырыстарым',en:'My orders'}, historyCurrent:{ru:'История и текущие заявки',kk:'Тарих және ағымдағы өтінімдер',en:'History and active requests'}, noOrders:{ru:'Заказов пока нет',kk:'Әзірге тапсырыс жоқ',en:'No orders yet'}, noOrdersDesc:{ru:'Выберите проблему на главной и вызовите мастера.',kk:'Басты беттен мәселені таңдап, шебер шақырыңыз.',en:'Choose a problem on the home screen and request a specialist.'}, openOrder:{ru:'Открыть заказ',kk:'Тапсырысты ашу',en:'Open order'}, settingsTitle:{ru:'Настройки JolDos',kk:'JolDos баптаулары',en:'JolDos settings'}, userName:{ru:'Пользователь JolDos',kk:'JolDos пайдаланушысы',en:'JolDos user'}, supportCall:{ru:'Позвонить в поддержку',kk:'Қолдау қызметіне қоңырау шалу',en:'Call support'}, cars:{ru:'Мои автомобили',kk:'Менің көліктерім',en:'My vehicles'}, payment:{ru:'Способы оплаты',kk:'Төлем тәсілдері',en:'Payment methods'}, notifications:{ru:'Уведомления',kk:'Хабарландырулар',en:'Notifications'}, astanaCurrent:{ru:'Астана, текущее местоположение',kk:'Астана, ағымдағы орналасқан жер',en:'Astana, current location'}, incomingMessage:{ru:'Здравствуйте! Я уже выезжаю к вам.',kk:'Сәлеметсіз бе! Сізге қарай жолға шықтым.',en:'Hello! I am on my way to you.'}
  } as const
  const tx=(k:keyof typeof ui)=>ui[k][lang]
  const problems=useMemo(()=>getProblems(lang),[lang])
  const masters=useMemo(()=>getMasters(lang),[lang])
  const stations=useMemo(()=>getStations(lang),[lang])
  const statusLabel=(value:Order['status'])=>statusText[value]?.[lang]||value
  const locale=lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU'
  const [tab,setTab]=useState<Tab>('home')
  const [stage,setStage]=useState<Stage>('start')
  const [selected,setSelected]=useState('')
  const [serviceType,setServiceType]=useState<ServiceType>('road_assistance')
  const [providerType,setProviderType]=useState<ProviderType>('master')
  const [locationText,setLocationText]=useState<string>(tx('astanaCurrent'))
  const [geoLoading,setGeoLoading]=useState(false)
  const [activeMaster,setActiveMaster]=useState(0)
  const [toast,setToast]=useState('')
  const [orders,setOrders]=useState<ClientOrder[]>([])
  const [activeOrderId,setActiveOrderId]=useState('')
  const [rating,setRating]=useState(0)
  const [coords,setCoords]=useState<[number,number]>([51.1282,71.4304])
  const [chatOpen,setChatOpen]=useState(false)
  const [chatText,setChatText]=useState('')
  const [messages,setMessages]=useState<string[]>([tx('incomingMessage')])

  const problem=useMemo(()=>problems.find(p=>p.id===selected),[selected])
  const master=masters[activeMaster]
  const activeOrder=orders.find(o=>o.id===activeOrderId)
  const handleMapSelect = useCallback((index:number)=>{ setActiveMaster(index); setStage('result'); setTab('home') },[])

  useEffect(()=>{
    try{ localStorage.removeItem('joldos-orders') }catch{}
  },[])

  useEffect(()=>{
    let cancelled=false
    const loadHistory=async()=>{
      try{
        const response=await fetch(`/api/orders?client=${encodeURIComponent('Ержан Т.')}`,{cache:'no-store'})
        const data=await response.json()
        if(cancelled||!Array.isArray(data.orders)) return
        const apiOrders:ClientOrder[]=data.orders.map((item:any)=>({
          id:item.id,
          master:item.master||tx('searchingMaster'),
          problem:item.problem,
          location:item.location,
          createdAt:new Date(item.createdAt).toLocaleString(locale),
          status:item.status,
          serviceType:item.serviceType,
          providerType:item.providerType
        }))
        setOrders(apiOrders)
        const active=apiOrders.find(item=>isActiveOrderStatus(item.status))
        if(active){
          setActiveOrderId(active.id)
          setStage('active')
          setTab('home')
        }else{
          setActiveOrderId('')
          setStage('start')
          setTab('home')
        }
      }catch{
        if(!cancelled){
          setActiveOrderId('')
          setStage('start')
        }
      }
    }
    void loadHistory()
    return()=>{cancelled=true}
  },[locale,lang])

  useEffect(()=>{
    if(!activeOrderId) return
    const timer=window.setInterval(async()=>{
      try{
        const response=await fetch(`/api/orders?id=${encodeURIComponent(activeOrderId)}`,{cache:'no-store'})
        const data=await response.json()
        if(!data.order||data.order.id!==activeOrderId){
          setActiveOrderId('')
          setStage('start')
          return
        }
        const updatedStatus=String(data.order.status)
        setOrders(prev=>prev.map(o=>o.id===activeOrderId?{...o,master:data.order.master||o.master,status:data.order.status}:o))
        if(updatedStatus==='Отменён'){
          setActiveOrderId('')
          setStage('start')
          setTab('home')
        }
      }catch{}
    },1000)
    return ()=>window.clearInterval(timer)
  },[activeOrderId])

  function notify(text:string){ setToast(text); window.setTimeout(()=>setToast(''),2300) }
  function vibrate(){ if('vibrate' in navigator) navigator.vibrate(25) }
  function goHome(){ setTab('home'); setStage('start'); setSelected(''); setServiceType('road_assistance'); setProviderType('master'); setActiveMaster(0); setActiveOrderId(''); setRating(0) }
  function chooseProblem(id:string){ vibrate(); const route=routeForProblem(id); setSelected(id); setServiceType(route.serviceType); setProviderType(route.providerType) }
  function findHelp(problemId?:string, route?:ServiceRoute){
    const nextProblem=problemId||selected
    if(!nextProblem){ notify(tx('firstChoose')); return }
    const nextRoute=route||routeForProblem(nextProblem)
    vibrate()
    setSelected(nextProblem)
    setServiceType(nextRoute.serviceType)
    setProviderType(nextRoute.providerType)
    setTab('home')
    setStage('searching')
    window.setTimeout(()=>setStage('result'),1500)
  }
  function openService(serviceId:string){
    const route=serviceRoutes[serviceId]
    if(!route) return
    if(serviceId==='station'){ setTab('sto'); return }
    findHelp(route.problemId,route)
  }
  function useLocation(){
    if(!navigator.geolocation){ notify(tx('geoUnsupported')); return }
    if(!window.isSecureContext && window.location.hostname!=='localhost'){ notify(tx('geoHttps')); return }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      p=>{setCoords([p.coords.latitude,p.coords.longitude]);setLocationText(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`);setGeoLoading(false);notify(tx('geoFound'))},
      ()=>{setGeoLoading(false);notify(tx('geoAllow'))},
      {enableHighAccuracy:true,timeout:10000}
    )
  }
  async function createOrder(){
    try{
      const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({problem:problem?.title||tx('helpRoad'),location:locationText,client:'Ержан Т.',vehicle:'Toyota Prado 120',price:7000,serviceType,providerType})})
      const data=await response.json()
      if(!response.ok||!data.order) throw new Error(data.error||'Create order failed')
      const order:ClientOrder={id:data.order.id,master:tx('searchingMaster'),problem:data.order.problem,location:data.order.location,createdAt:new Date(data.order.createdAt).toLocaleString(locale),status:data.order.status,serviceType:data.order.serviceType,providerType:data.order.providerType}
      setOrders(prev=>[order,...prev]); setActiveOrderId(order.id); setStage('active'); notify(tx('requestSent'))
    }catch{ notify(tx('requestFailed')) }
  }
  async function cancelActiveOrder(){
    if(!activeOrder)return
    if(!window.confirm(tx('cancelConfirm')))return
    try{
      const params=new URLSearchParams({
        id:activeOrder.id,
        client:'Ержан Т.',
        cancelledBy:'driver',
        cancellationReason:'Отменено водителем'
      })
      const response=await fetch(`/api/orders?${params.toString()}`,{method:'DELETE'})
      const data=await response.json().catch(()=>null)
      if(!response.ok)throw new Error(data?.error||'Cancel order failed')
      setOrders(prev=>prev.map(o=>o.id===activeOrder.id?{...o,status:'Отменён' as Order['status']}:o))
      setActiveOrderId('')
      setStage('start')
      setTab('home')
      setSelected('')
      setRating(0)
      notify(tx('cancelSuccess'))
    }catch{
      notify(tx('cancelFailed'))
    }
  }
  function advanceOrder(){
    if(!activeOrder) return
    const index=statusSteps.indexOf(activeOrder.status)
    const next=statusSteps[Math.min(index+1,statusSteps.length-1)]
    setOrders(prev=>prev.map(o=>o.id===activeOrder.id?{...o,status:next}:o))
    if(next==='Завершён') notify(tx('workDoneRate'))
    else notify(next)
  }
  function finishAndHome(){
    if(!rating){ notify(tx('rateRequired')); return }
    notify(tx('thanksRating')); window.setTimeout(goHome,550)
  }

  function sendMessage(){
    const text=chatText.trim()
    if(!text) return
    setMessages(prev=>[...prev,text])
    setChatText('')
    notify(tx('messageSent'))
  }


  function BellIcon(){
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
  }

  function PinIcon(){
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>
  }
  function ServiceIcon({id}:{id:string}){
    const common={width:54,height:54,viewBox:'0 0 64 64',fill:'none',xmlns:'http://www.w3.org/2000/svg'} as const
    if(id==='tow') return <svg {...common}><path d="M8 40h31l8-10h7v16H8z" fill="#F5A800"/><path d="M13 30h22v10H13z" fill="#FFC928"/><circle cx="18" cy="49" r="6" fill="#17202B"/><circle cx="47" cy="49" r="6" fill="#17202B"/><path d="M39 31h7l5 7H39z" fill="#D7E8F8"/><path d="M5 26h14v4H5z" fill="#17202B"/></svg>
    if(id==='battery') return <svg {...common}><rect x="12" y="17" width="40" height="35" rx="7" fill="#17202B"/><rect x="20" y="11" width="9" height="7" rx="2" fill="#17202B"/><rect x="36" y="11" width="9" height="7" rx="2" fill="#17202B"/><path d="M33 21l-8 14h8l-3 10 11-16h-8z" fill="#FFC928"/><path d="M17 27h7M20.5 23.5v7M42 27h7" stroke="#FFC928" strokeWidth="3" strokeLinecap="round"/></svg>
    if(id==='wheel') return <svg {...common}><circle cx="32" cy="32" r="25" fill="#15181D"/><circle cx="32" cy="32" r="14" fill="#E9EDF1"/><circle cx="32" cy="32" r="5" fill="#15181D"/><path d="M32 18v9M32 37v9M18 32h9M37 32h9M22 22l6 6M36 36l6 6M42 22l-6 6M28 36l-6 6" stroke="#737C87" strokeWidth="3" strokeLinecap="round"/></svg>
    if(id==='fuel') return <svg {...common}><path d="M15 10h31l4 8v36H14V18z" fill="#FFC928"/><path d="M20 16h22v14H20z" fill="#FFF5D0"/><path d="M47 20h5c4 0 6 3 6 7v13" stroke="#17202B" strokeWidth="4" strokeLinecap="round"/><path d="M31 35c5 6 7 9 7 12a7 7 0 1 1-14 0c0-3 2-6 7-12z" fill="#17202B"/></svg>
    if(id==='unlock') return <svg {...common}><rect x="13" y="29" width="38" height="27" rx="6" fill="#FFC928"/><path d="M22 29v-7c0-8 5-14 13-14 6 0 10 3 12 8" stroke="#17202B" strokeWidth="7" strokeLinecap="round"/><circle cx="32" cy="41" r="4" fill="#17202B"/><path d="M32 44v6" stroke="#17202B" strokeWidth="4" strokeLinecap="round"/></svg>
    if(id==='repair') return <svg {...common}><path d="M14 35c0-11 8-19 18-19s18 8 18 19v11H14z" fill="#E7EDF3"/><path d="M18 35h28l5 10H13z" fill="#17202B"/><circle cx="20" cy="47" r="5" fill="#FFC928"/><circle cx="44" cy="47" r="5" fill="#FFC928"/><path d="M25 12l3 5M39 12l-3 5" stroke="#17202B" strokeWidth="3" strokeLinecap="round"/><path d="M22 31h20" stroke="#6BAFE8" strokeWidth="3"/></svg>
    if(id==='wash') return <svg {...common}><path d="M14 35c0-11 8-19 18-19s18 8 18 19v11H14z" fill="#DCE8F2"/><path d="M18 35h28l5 10H13z" fill="#17202B"/><circle cx="20" cy="47" r="5" fill="#FFC928"/><circle cx="44" cy="47" r="5" fill="#FFC928"/><path d="M19 10l2-4M31 9V4M43 10l2-4" stroke="#46B8FF" strokeWidth="4" strokeLinecap="round"/></svg>
    return <svg {...common}><path d="M10 26l22-17 22 17v29H10z" fill="#17202B"/><rect x="20" y="32" width="24" height="23" rx="3" fill="#FFC928"/><path d="M25 43h14M32 36v14" stroke="#17202B" strokeWidth="4" strokeLinecap="round"/></svg>
  }

  const homeServices=[
    {id:'tow',title:{ru:'Эвакуатор',kk:'Эвакуатор',en:'Tow truck'},price:'от 5 000 ₸'},
    {id:'battery',title:{ru:'Прикурить аккумулятор',kk:'Аккумуляторды іске қосу',en:'Jump start'},price:'от 2 000 ₸'},
    {id:'wheel',title:{ru:'Замена колеса',kk:'Дөңгелек ауыстыру',en:'Tire change'},price:'от 2 500 ₸'},
    {id:'fuel',title:{ru:'Доставка топлива',kk:'Жанармай жеткізу',en:'Fuel delivery'},price:'от 3 000 ₸'},
    {id:'unlock',title:{ru:'Вскрытие авто',kk:'Көлікті ашу',en:'Car unlock'},price:'от 3 000 ₸'},
    {id:'repair',title:{ru:'Техпомощь на месте',kk:'Жолдағы техкөмек',en:'Road assistance'},price:'от 3 000 ₸'},
    {id:'wash',title:{ru:'Автомойка',kk:'Автожуу',en:'Car wash'},price:'от 3 000 ₸'},
    {id:'station',title:{ru:'СТО и ремонт',kk:'СТО және жөндеу',en:'Service & repair'},price:'—'}
  ]

  function StartScreen(){ return <div className="home-screen">
    <header className="home-header">
      <button type="button" className="menu-button" aria-label="Меню" onClick={()=>setTab('profile')}>☰</button>
      <div className="wordmark"><b>Jol</b><strong>Dos</strong><small>{lang==='kk'?'ЖОЛДАҒЫ КӨМЕК':lang==='en'?'ROADSIDE ASSISTANCE':'ПОМОЩЬ НА ДОРОГЕ'}</small></div>
      <button type="button" className="notify-button" aria-label="Уведомления" onClick={()=>notify(tx('notifications'))}><BellIcon/><i>3</i></button>
    </header>

    <a className="home-sos" href="tel:112"><span className="phone-mark">☎</span><b>SOS</b><div><strong>{tx('emergency')}</strong><small>{lang==='kk'?'Шақыру үшін басыңыз':lang==='en'?'Tap to request help':'Нажмите для вызова'}</small></div><em>›</em></a>

    <section className="services-section">
      <div className="home-section-title"><h2>{lang==='kk'?'Танымал қызметтер':lang==='en'?'Popular services':'Популярные услуги'}</h2><button type="button" onClick={()=>notify(lang==='kk'?'Барлық қызметтер төменде көрсетілген':lang==='en'?'All services are shown below':'Все услуги показаны ниже')}>{lang==='kk'?'Барлық қызметтер':lang==='en'?'All services':'Все услуги'} ›</button></div>
      <div className="service-grid">{homeServices.map(service=><button type="button" key={service.id} className="service-card" onClick={()=>openService(service.id)}><ServiceIcon id={service.id}/><strong>{service.title[lang]}</strong><small>{service.price}</small></button>)}</div>
    </section>

    <section className="home-location">
      <div className="location-head"><span>●</span><div><b>{lang==='kk'?'Менің орналасқан жерім':lang==='en'?'My location':'Мое местоположение'}</b><small>{locationText}</small></div><button type="button" onClick={useLocation}>{lang==='kk'?'Өзгерту':lang==='en'?'Change':'Изменить'}</button></div>
      <div className="home-map"><MapView lang={lang} coords={coords} masters={[]} activeMaster={0} onSelectMaster={()=>{}} onUseLocation={useLocation} geoLoading={geoLoading}/></div>
    </section>

    <section className="home-benefits"><div><i>◷</i><span><small>{lang==='kk'?'Жеткізу':lang==='en'?'Arrival':'Подача'}</small><b>10–15 мин</b></span></div><div><i>▣</i><span><small>{lang==='kk'?'Мин. баға':lang==='en'?'Min. price':'Мин. цена'}</small><b>от 2 000 ₸</b></span></div><div><i>♢</i><span><small>{lang==='kk'?'Қауіпсіз':lang==='en'?'Safe':'Безопасно'}</small><b>{lang==='kk'?'Тексерілген шеберлер':lang==='en'?'Verified specialists':'Проверенные мастера'}</b></span></div></section>
  </div> }

  function Searching(){ return <section className="searching-screen"><div className="radar"><span className="pulse one"/><span className="pulse two"/><span className="pulse three"/><div className="car-dot">🚗</div></div><h1>{tx('searching')}</h1><p>{problem?.title}</p><small>{locationText}</small><div className="loading-line"><i/></div><button type="button" onClick={()=>setStage('start')}>{tx('cancel')}</button></section> }

  function Result(){ return <section className="result-screen"><MapView lang={lang} coords={coords} masters={masters} activeMaster={activeMaster} onSelectMaster={handleMapSelect} onUseLocation={useLocation} geoLoading={geoLoading}/><div className="bottom-sheet"><div className="handle"/><div className="master-head"><div className="master-avatar">{master.initials}</div><div><small>{tx('nearest')}</small><h2>{master.name} <span>✓</span></h2><p>{master.role}</p></div><div className="master-actions"><button type="button" onClick={()=>setChatOpen(true)}>✉</button><a href={`tel:${master.phone}`} className="round-call">☎</a></div></div><div className="stats"><span><b>★ {master.rating}</b>{master.reviews} {tx('reviews')}</span><span><b>{master.eta}</b>{tx('toYou')}</span><span><b>{master.distance}</b>{tx('distanceWord')}</span></div><div className="summary"><span>{tx('yourProblem')}</span><b>{problem?.title}</b><small>{locationText}</small></div><div className="price-actions"><div><small>{tx('calloutCost')}</small><b>{master.price}</b></div><button type="button" onClick={createOrder}>{tx('call')} <strong>→</strong></button></div><div className="master-tabs">{masters.map((m,i)=><button type="button" className={i===activeMaster?'active':''} key={m.name} onClick={()=>setActiveMaster(i)}>{m.eta}</button>)}</div></div></section> }

  function ActiveOrder(){
    if(!activeOrder) return <StartScreen/>
    const currentIndex=statusSteps.indexOf(activeOrder.status)
    return <section className="active-screen"><MapView lang={lang} coords={coords} masters={masters} activeMaster={activeMaster} onSelectMaster={handleMapSelect} onUseLocation={useLocation} geoLoading={geoLoading}/><div className="order-sheet"><div className="handle"/><div className="order-top"><span className="live-dot"/><div><small>{tx('current')}</small><h2>{statusLabel(activeOrder.status)}</h2><p>{master.name} · {master.eta}</p></div><div className="order-contact"><button type="button" onClick={()=>setChatOpen(true)}>✉</button><a href={`tel:${master.phone}`}>☎</a></div></div><div className="timeline">{statusSteps.slice(0,4).map((s,i)=><div className={i<=currentIndex?'done':''} key={s}><i>{i<currentIndex?'✓':i+1}</i><span>{statusLabel(s)}</span></div>)}</div>{activeOrder.status!=='Завершён'?<><div className="eta-card"><span>{tx('expectedArrival')}</span><b>{activeOrder.status==='Мастер принял заказ'?lang==='en'?'8 min':'8 мин':activeOrder.status==='Мастер едет'?lang==='en'?'5 min':'5 мин':tx('onSite')}</b></div><button type="button" className="advance" onClick={()=>notify(tx('statusByMaster'))}>{tx('waitUpdate')}</button><button type="button" className="advance" onClick={cancelActiveOrder} style={{marginTop:10,background:'#fff',color:'#b42318',border:'1px solid #f3b4ad'}}>{tx('cancelOrder')}</button></>:<div className="rating-card"><h3>{tx('howWas')}</h3><p>{tx('rateWork')}</p><div>{[1,2,3,4,5].map(star=><button type="button" key={star} className={rating>=star?'active':''} onClick={()=>setRating(star)}>★</button>)}</div><button type="button" className="finish" onClick={finishAndHome}>{tx('finishHome')}</button></div>}</div></section>
  }

  function renderHome(){ if(stage==='searching') return <Searching/>; if(stage==='result') return <Result/>; if(stage==='active') return <ActiveOrder/>; return <StartScreen/> }
  function renderTab(){
    if(tab==='home') return renderHome()
    if(tab==='map') return <section className="page-view"><header><h1>{tx('mapHelp')}</h1><p>{tx('chooseNearest')}</p></header><MapView lang={lang} coords={coords} masters={masters} activeMaster={activeMaster} onSelectMaster={handleMapSelect} onUseLocation={useLocation} geoLoading={geoLoading} page/><div className="mini-list">{masters.map((m,i)=><button type="button" key={m.name} onClick={()=>{setActiveMaster(i);setStage('result');setTab('home')}}><span>{m.initials}</span><div><b>{m.name}</b><small>{m.role} · {m.distance}</small></div><strong>{m.eta}</strong></button>)}</div></section>
    if(tab==='sto') return <section className="page-view scroll-page"><header><h1>{tx('catalog')}</h1><p>{tx('trustedAstana')}</p></header><div className="station-list">{stations.map(s=><article key={s.name}><div className="station-logo">J</div><div><h3>{s.name}</h3><p>{s.type}</p><small>★ {s.rating} · {s.distance} · {s.open}</small></div><button type="button" onClick={()=>notify(`${s.name}: ${tx('cardOpened')}`)}>›</button></article>)}</div></section>
    if(tab==='orders') return <section className="page-view scroll-page"><header><h1>{tx('myOrders')}</h1><p>{tx('historyCurrent')}</p></header>{orders.length===0?<div className="empty"><span>▤</span><h2>{tx('noOrders')}</h2><p>{tx('noOrdersDesc')}</p><button type="button" onClick={goHome}>{tx('find')}</button></div>:<div className="order-list">{orders.map(o=><article key={o.id}><div><small>{o.createdAt}</small><h3>{o.problem}</h3><p>{o.master} · {o.location}</p></div><b className={isActiveOrderStatus(o.status)?'live':''}>{statusLabel(o.status)}</b>{isActiveOrderStatus(o.status)&&<button type="button" onClick={()=>{setActiveOrderId(o.id);setStage('active');setTab('home')}}>{tx('openOrder')}</button>}</article>)}</div>}</section>
    return <section className="page-view scroll-page"><header><h1>{tx('profile')}</h1><p>{tx('settingsTitle')}</p></header><div className="profile-card"><div className="profile-icon">👤</div><h2>{tx('userName')}</h2><p>Astana · Kazakhstan</p><a href="tel:+77000000000">{tx('supportCall')}</a></div><div className="settings"><button type="button" onClick={()=>notify(tx('cars'))}>{tx('cars')} <span>›</span></button><button type="button" onClick={()=>notify(tx('payment'))}>{tx('payment')} <span>›</span></button><button type="button" onClick={()=>notify(tx('notifications'))}>{tx('notifications')} <span>›</span></button></div></section>
  }

  const isHomeStart=tab==='home'&&stage==='start'
  return <main className="app-shell"><div className={`phone ${isHomeStart?'home-phone':''}`}>{!isHomeStart&&<div className="topbar client-topbar"><Link href="/" className="role-back" aria-label={tx('roleBack')} title={tx('roleBack')}>←</Link><LanguageSwitcher lang={lang} onChange={setLang} compact/><button type="button" className="city" onClick={()=>notify('Астана')}><PinIcon/><span>Астана</span></button><button type="button" className="bell" aria-label="Уведомления" onClick={()=>notify(tx('notifications'))}><BellIcon/></button></div>}{renderTab()}<BottomNav tab={tab} onChange={setTab} lang={lang}/><ChatSheet open={chatOpen} masterName={master.name} messages={messages} value={chatText} onChange={setChatText} onSend={sendMessage} onClose={()=>setChatOpen(false)} lang={lang}/>{toast&&<div className="toast">{toast}</div>}</div></main>
}
