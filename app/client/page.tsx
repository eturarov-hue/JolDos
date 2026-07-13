
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { ChatSheet } from '@/components/ChatSheet'
import { MapView } from '@/components/MapView'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n'
import { getMasters, getStations, statusSteps, statusText } from '@/lib/mock-data'
import {
  SERVICE_LIST,
  getService,
  type ServiceDefinition,
  type ServiceProviderType,
} from '@/lib/services'
import { TEST_MASTER_LIST } from '@/lib/test-masters'
import type { Order, Stage, Tab } from '@/types'

type ClientOrder = Order & {
  serviceType?: string
  providerType?: ServiceProviderType
}

type ClientCar = {
  id: string
  make: string
  model: string
  plate: string
  mileage: string
}


const ACTIVE_ORDER_STATUSES = new Set([
  'Новый заказ',
  'Ищем мастера',
  'Мастер принял заказ',
  'Мастер едет',
  'Мастер прибыл',
  'Работа выполняется',
  'Нет свободных специалистов',
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
    nearest:{ru:'Ближайший мастер',kk:'Ең жақын шебер',en:'Nearest specialist'}, suitableNearby:{ru:'Подходящие мастера рядом',kk:'Жақын жердегі қолайлы шеберлер',en:'Suitable specialists nearby'}, suitableDesc:{ru:'Заказ получат ближайшие онлайн-мастера нужной специализации',kk:'Тапсырысты қажетті мамандығы бар жақын онлайн-шеберлер алады',en:'The nearest online specialists with the required skill will receive the order'}, call:{ru:'Отправить заявку',kk:'Өтінім жіберу',en:'Send request'}, current:{ru:'Текущий заказ',kk:'Ағымдағы тапсырыс',en:'Current order'},
    home:{ru:'Главная',kk:'Басты бет',en:'Home'}, map:{ru:'Карта',kk:'Карта',en:'Map'}, sto:{ru:'СТО',kk:'Автосервис',en:'Services'}, orders:{ru:'Заказы',kk:'Тапсырыстар',en:'Orders'}, profile:{ru:'Профиль',kk:'Профиль',en:'Profile'}, roleBack:{ru:'Сменить роль',kk:'Рөлді ауыстыру',en:'Change role'},
    availability:{ru:'Помощь доступна 24/7',kk:'Көмек тәулік бойы қолжетімді',en:'Help is available 24/7'}, emergency:{ru:'Экстренная помощь',kk:'Шұғыл көмек',en:'Emergency assistance'}, call112:{ru:'Позвонить 112',kk:'112 нөміріне қоңырау шалу',en:'Call 112'}, step1:{ru:'Шаг 1',kk:'1-қадам',en:'Step 1'},
    ratingWord:{ru:'рейтинг',kk:'рейтинг',en:'rating'}, arrival:{ru:'прибытие',kk:'келу уақыты',en:'arrival'}, verified:{ru:'проверены',kk:'тексерілген',en:'verified'}, firstChoose:{ru:'Сначала выберите проблему',kk:'Алдымен мәселені таңдаңыз',en:'Choose a problem first'}, geoUnsupported:{ru:'Геолокация не поддерживается',kk:'Геолокацияға қолдау көрсетілмейді',en:'Geolocation is not supported'}, geoHttps:{ru:'На телефоне геолокация работает только через HTTPS',kk:'Телефонда геолокация тек HTTPS арқылы жұмыс істейді',en:'On mobile, geolocation requires HTTPS'}, geoFound:{ru:'Местоположение определено',kk:'Орналасқан жер анықталды',en:'Location detected'}, geoAllow:{ru:'Разрешите доступ к геолокации',kk:'Геолокацияға рұқсат беріңіз',en:'Allow location access'},
    helpRoad:{ru:'Помощь на дороге',kk:'Жолдағы көмек',en:'Roadside assistance'}, searchingMaster:{ru:'Ищем мастера',kk:'Шебер ізделуде',en:'Searching for a specialist'}, requestSent:{ru:'Заявка отправлена мастерам',kk:'Өтінім шеберлерге жіберілді',en:'Request sent to specialists'}, requestFailed:{ru:'Не удалось отправить заявку',kk:'Өтінімді жіберу мүмкін болмады',en:'Could not send request'}, sentToSuitable:{ru:'Заказ отправлен подходящим мастерам',kk:'Тапсырыс қолайлы шеберлерге жіберілді',en:'Order sent to suitable specialists'}, waitingAcceptance:{ru:'Ожидаем, кто первым примет заказ',kk:'Тапсырысты кім бірінші қабылдайтынын күтеміз',en:'Waiting for the first specialist to accept'}, noSpecialists:{ru:'Нет свободных специалистов',kk:'Бос мамандар жоқ',en:'No specialists available'}, noSpecialistsDesc:{ru:'Все подходящие мастера отказались или сейчас недоступны. Отмените заказ и попробуйте снова позже.',kk:'Барлық сәйкес шеберлер бас тартты немесе қазір қолжетімсіз. Тапсырысты тоқтатып, кейінірек қайталап көріңіз.',en:'All suitable specialists declined or are currently unavailable. Cancel the order and try again later.'}, assignedMaster:{ru:'Назначенный мастер',kk:'Тағайындалған шебер',en:'Assigned specialist'}, cancelOrder:{ru:'Отменить заказ',kk:'Тапсырысты болдырмау',en:'Cancel order'}, cancelConfirm:{ru:'Отменить текущий заказ?',kk:'Ағымдағы тапсырысты болдырмау керек пе?',en:'Cancel the current order?'}, cancelSuccess:{ru:'Заказ отменён',kk:'Тапсырыс болдырылмады',en:'Order cancelled'}, cancelFailed:{ru:'Не удалось отменить заказ',kk:'Тапсырысты болдырмау мүмкін болмады',en:'Could not cancel the order'}, workDoneRate:{ru:'Работа завершена — оцените мастера',kk:'Жұмыс аяқталды — шеберді бағалаңыз',en:'Work completed — rate the specialist'}, rateRequired:{ru:'Поставьте оценку мастеру',kk:'Шеберге баға беріңіз',en:'Rate the specialist'}, thanksRating:{ru:'Спасибо за оценку!',kk:'Бағаңызға рақмет!',en:'Thank you for your rating!'}, messageSent:{ru:'Сообщение отправлено',kk:'Хабарлама жіберілді',en:'Message sent'},
    findPrefix:{ru:'Найти помощь',kk:'Көмек табу',en:'Find help'}, reviews:{ru:'отзывов',kk:'пікір',en:'reviews'}, toYou:{ru:'до вас',kk:'сізге дейін',en:'to you'}, distanceWord:{ru:'расстояние',kk:'қашықтық',en:'distance'}, yourProblem:{ru:'Ваша проблема',kk:'Сіздің мәселеңіз',en:'Your problem'}, calloutCost:{ru:'Стоимость выезда',kk:'Шақыру құны',en:'Call-out price'}, expectedArrival:{ru:'Ожидаемое прибытие',kk:'Күтілетін келу уақыты',en:'Expected arrival'}, onSite:{ru:'Мастер на месте',kk:'Шебер орнында',en:'Specialist is on site'}, waitUpdate:{ru:'Ожидать обновление от мастера',kk:'Шебердің жаңартуын күту',en:'Wait for specialist update'}, statusByMaster:{ru:'Статус меняет мастер в JolDos Master',kk:'Мәртебені JolDos Master қолданбасындағы шебер өзгертеді',en:'The specialist updates the status in JolDos Master'}, howWas:{ru:'Как всё прошло?',kk:'Қызмет қалай өтті?',en:'How did it go?'}, rateWork:{ru:'Оцените работу мастера',kk:'Шебердің жұмысын бағалаңыз',en:'Rate the specialist’s work'}, finishHome:{ru:'Завершить и вернуться на главную',kk:'Аяқтап, басты бетке оралу',en:'Finish and return home'},
    mapHelp:{ru:'Карта помощи',kk:'Көмек картасы',en:'Assistance map'}, chooseNearest:{ru:'Выберите ближайшего мастера',kk:'Ең жақын шеберді таңдаңыз',en:'Choose the nearest specialist'}, catalog:{ru:'Каталог СТО',kk:'Автосервистер каталогы',en:'Service center directory'}, trustedAstana:{ru:'Проверенные сервисы Астаны',kk:'Астанадағы тексерілген автосервистер',en:'Verified service centers in Astana'}, cardOpened:{ru:'Карточка открыта',kk:'Карточка ашылды',en:'Card opened'}, myOrders:{ru:'Мои заказы',kk:'Менің тапсырыстарым',en:'My orders'}, historyCurrent:{ru:'История и текущие заявки',kk:'Тарих және ағымдағы өтінімдер',en:'History and active requests'}, noOrders:{ru:'Заказов пока нет',kk:'Әзірге тапсырыс жоқ',en:'No orders yet'}, noOrdersDesc:{ru:'Выберите проблему на главной и вызовите мастера.',kk:'Басты беттен мәселені таңдап, шебер шақырыңыз.',en:'Choose a problem on the home screen and request a specialist.'}, openOrder:{ru:'Открыть заказ',kk:'Тапсырысты ашу',en:'Open order'}, settingsTitle:{ru:'Настройки JolDos',kk:'JolDos баптаулары',en:'JolDos settings'}, userName:{ru:'Пользователь JolDos',kk:'JolDos пайдаланушысы',en:'JolDos user'}, supportCall:{ru:'Позвонить в поддержку',kk:'Қолдау қызметіне қоңырау шалу',en:'Call support'}, cars:{ru:'Мои автомобили',kk:'Менің көліктерім',en:'My vehicles'}, payment:{ru:'Способы оплаты',kk:'Төлем тәсілдері',en:'Payment methods'}, notifications:{ru:'Уведомления',kk:'Хабарландырулар',en:'Notifications'}, astanaCurrent:{ru:'Астана, текущее местоположение',kk:'Астана, ағымдағы орналасқан жер',en:'Astana, current location'}, incomingMessage:{ru:'Здравствуйте! Я уже выезжаю к вам.',kk:'Сәлеметсіз бе! Сізге қарай жолға шықтым.',en:'Hello! I am on my way to you.'}
  } as const
  const tx=(k:keyof typeof ui)=>ui[k][lang]
  const masters=useMemo(()=>getMasters(lang),[lang])
  const stations=useMemo(()=>getStations(lang),[lang])
  const statusLabel=(value:Order['status'])=>statusText[value]?.[lang]||value
  const locale=lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU'
  const [tab,setTab]=useState<Tab>('home')
  const [stage,setStage]=useState<Stage>('start')
  const [selected,setSelected]=useState('')
  const [serviceType,setServiceType]=useState<string>('road_assistance')
  const [providerType,setProviderType]=useState<ServiceProviderType>('master')
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
  const [sosOpen,setSosOpen]=useState(false)
  const [notificationsOpen,setNotificationsOpen]=useState(false)
  const [unreadNotifications,setUnreadNotifications]=useState(3)
  const [showAllServices,setShowAllServices]=useState(false)
  const [cars,setCars]=useState<ClientCar[]>([])

  const selectedService=useMemo(
    ()=>getService(selected),
    [selected],
  )
  const problem=selectedService
    ? { title:selectedService.title[lang] }
    : null
  const master=masters[activeMaster]
  const activeOrder=orders.find(o=>o.id===activeOrderId)
  const primaryProviderType=(
    service:ServiceDefinition | null,
  ):ServiceProviderType=>service?.providerTypes[0]??'master'
  const matchingTestMasters=useMemo(()=>{
    if(!selectedService)return []
    const allowed=new Set(selectedService.providerTypes)
    return TEST_MASTER_LIST.filter(item=>allowed.has(item.providerType))
  },[selectedService])
  const handleMapSelect = useCallback((index:number)=>{ setActiveMaster(index); setStage('result'); setTab('home') },[])

  useEffect(()=>{
    try{ localStorage.removeItem('joldos-orders') }catch{}
  },[])

  useEffect(()=>{
    let cancelled=false

    const loadCars=async()=>{
      try{
        const response=await fetch(
          `/api/cars?client=${encodeURIComponent('Ержан Т.')}`,
          {cache:'no-store'}
        )
        const data=await response.json()

        if(
          cancelled ||
          !response.ok ||
          !Array.isArray(data.cars)
        ) return

        setCars(data.cars)
      }catch{
        // The home screen remains usable even when cars cannot be loaded.
      }
    }

    void loadCars()
    return()=>{cancelled=true}
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
        setOrders(prev=>{
          const merged=new Map<string,ClientOrder>()

          for(const order of prev){
            merged.set(order.id,order)
          }

          for(const order of apiOrders){
            merged.set(order.id,order)
          }

          return Array.from(merged.values()).sort(
            (a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()
          )
        })
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
        setOrders(prev=>{
          const updatedOrder:ClientOrder={
            id:data.order.id,
            master:data.order.master||tx('searchingMaster'),
            problem:data.order.problem,
            location:data.order.location,
            createdAt:new Date(data.order.createdAt).toLocaleString(locale),
            status:data.order.status,
            serviceType:data.order.serviceType,
            providerType:data.order.providerType,
          }

          const exists=prev.some(o=>o.id===activeOrderId)

          if(!exists){
            return [updatedOrder,...prev]
          }

          return prev.map(o=>
            o.id===activeOrderId
              ? {...o,...updatedOrder}
              : o
          )
        })

        if(updatedStatus!=='Отменён'){
          setStage('active')
          setTab('home')
        }

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

  function goBackInsideClient(){
    setNotificationsOpen(false)
    setSosOpen(false)
    setTab('home')
    setStage(activeOrderId?'active':'start')
  }

  function toggleNotifications(){
    setSosOpen(false)
    setNotificationsOpen(value=>!value)
  }

  function closeNotifications(){
    setNotificationsOpen(false)
  }

  function markNotificationsRead(){
    setUnreadNotifications(0)
  }
  function chooseProblem(id:string){
    const service=getService(id)
    if(!service)return
    vibrate()
    setSelected(service.id)
    setServiceType(service.serviceType)
    setProviderType(primaryProviderType(service))
  }

  function findHelp(serviceId?:string){
    const service=getService(serviceId||selected)
    if(!service){
      notify(tx('firstChoose'))
      return
    }

    vibrate()
    setSelected(service.id)
    setServiceType(service.serviceType)
    setProviderType(primaryProviderType(service))
    setTab('home')
    setStage('searching')
    window.setTimeout(()=>setStage('result'),1500)
  }

  function openService(serviceId:string){
    const service=getService(serviceId)
    if(!service)return

    if(service.id==='service_station'){
      setTab('sto')
      return
    }

    findHelp(service.id)
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
      const response=await fetch('/api/orders',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          problem:selectedService?.title[lang]||tx('helpRoad'),
          location:locationText,
          client:'Ержан Т.',
          vehicle:'Toyota Prado 120',
          price:selectedService?.priceFrom??7000,
          serviceType,
          providerType,
        }),
      })
      const data=await response.json()
      if(!response.ok||!data.order) throw new Error(data.error||'Create order failed')
      const order:ClientOrder={id:data.order.id,master:tx('searchingMaster'),problem:data.order.problem,location:data.order.location,createdAt:new Date(data.order.createdAt).toLocaleString(locale),status:data.order.status,serviceType:data.order.serviceType,providerType:data.order.providerType}
      setOrders(prev=>[order,...prev.filter(item=>item.id!==order.id)])
      setActiveOrderId(order.id)
      setStage('active')
      setTab('home')
      notify(tx('requestSent'))
    }catch(error){
      notify(tx('requestFailed'))
    }
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
    const common={width:96,height:72,viewBox:'0 0 120 90',fill:'none',xmlns:'http://www.w3.org/2000/svg'} as const
    if(id==='jump_start') return <svg {...common} aria-hidden="true"><defs><linearGradient id="bat" x1="20" y1="15" x2="95" y2="78" gradientUnits="userSpaceOnUse"><stop stopColor="#263345"/><stop offset="1" stopColor="#0B1018"/></linearGradient><filter id="s1"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".22"/></filter></defs><g filter="url(#s1)"><rect x="24" y="27" width="55" height="44" rx="9" fill="url(#bat)"/><rect x="34" y="20" width="12" height="9" rx="3" fill="#111827"/><rect x="60" y="20" width="12" height="9" rx="3" fill="#111827"/><path d="M51 35 40 52h12l-5 13 17-22H52l5-8Z" fill="#FFD12A"/><path d="M90 27c-9 5-13 11-12 20" stroke="#E32636" strokeWidth="5" strokeLinecap="round"/><path d="m92 23 7 13-10 4-6-14 9-3Z" fill="#E32636"/><path d="M26 29c-9 5-13 11-12 20" stroke="#111827" strokeWidth="5" strokeLinecap="round"/><path d="m18 25 8 12-10 5-7-13 9-4Z" fill="#111827"/></g></svg>
    if(id==='wheel_change') return <svg {...common} aria-hidden="true"><defs><radialGradient id="tire" cx="0" cy="0" r="1" gradientTransform="translate(56 42) rotate(90) scale(34)"><stop stopColor="#4A4F57"/><stop offset=".63" stopColor="#1B1E23"/><stop offset="1" stopColor="#050607"/></radialGradient><linearGradient id="rim" x1="35" y1="22" x2="76" y2="66"><stop stopColor="#FAFCFF"/><stop offset=".5" stopColor="#9AA3AD"/><stop offset="1" stopColor="#E8EDF2"/></linearGradient><filter id="s2"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".2"/></filter></defs><g filter="url(#s2)"><circle cx="56" cy="44" r="35" fill="url(#tire)"/><circle cx="56" cy="44" r="22" fill="url(#rim)"/><circle cx="56" cy="44" r="7" fill="#343A43"/><path d="M56 23v14M56 51v14M35 44h14M63 44h14M41 29l10 10M61 49l10 10M71 29 61 39M51 49 41 59" stroke="#626B76" strokeWidth="5" strokeLinecap="round"/><path d="m83 18 8 6-24 37-8-6 24-37Z" fill="#2B313A"/><path d="m88 17 7 5-4 7-8-6 5-6Z" fill="#F2B400"/></g></svg>
    if(id==='tow') return <svg {...common} aria-hidden="true"><defs><linearGradient id="truck" x1="18" y1="28" x2="104" y2="69"><stop stopColor="#FFD433"/><stop offset="1" stopColor="#F0A900"/></linearGradient><filter id="s3"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".2"/></filter></defs><g filter="url(#s3)"><path d="M16 51h56l12-19h18l9 15v18H16V51Z" fill="url(#truck)"/><path d="M78 51h30l-8-14H87l-9 14Z" fill="#DCEFFF"/><rect x="22" y="40" width="48" height="8" rx="3" fill="#202833"/><path d="m27 39 28-17 5 5-23 14" fill="#E9A900"/><path d="M56 22h9l15 19h-9L56 22Z" fill="#1B2430"/><path d="M78 18h11v6H78z" fill="#1B2430"/><circle cx="34" cy="67" r="10" fill="#171C24"/><circle cx="34" cy="67" r="4" fill="#AEB7C2"/><circle cx="91" cy="67" r="10" fill="#171C24"/><circle cx="91" cy="67" r="4" fill="#AEB7C2"/></g></svg>
    if(id==='fuel_delivery') return <svg {...common} aria-hidden="true"><defs><linearGradient id="fuel" x1="31" y1="13" x2="78" y2="76"><stop stopColor="#FF4B42"/><stop offset="1" stopColor="#D90B16"/></linearGradient><filter id="s4"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".22"/></filter></defs><g filter="url(#s4)"><path d="M37 14h36l9 11v51H31V20l6-6Z" fill="url(#fuel)"/><path d="M42 20h24l7 9v11H42V20Z" fill="#F9D6D7" opacity=".75"/><path d="M75 24h10c7 0 12 6 12 13v22" stroke="#151B24" strokeWidth="6" strokeLinecap="round"/><path d="m95 57 8 2v13H91V62l4-5Z" fill="#151B24"/><path d="M56 45c8 9 11 14 11 20a11 11 0 1 1-22 0c0-6 3-11 11-20Z" fill="#981019" opacity=".72"/></g></svg>
    if(id==='car_unlock') return <svg {...common} aria-hidden="true"><defs><linearGradient id="carblue" x1="13" y1="38" x2="90" y2="74"><stop stopColor="#4FA8FF"/><stop offset="1" stopColor="#1263C7"/></linearGradient><filter id="s5"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".2"/></filter></defs><g filter="url(#s5)"><path d="M14 57 24 39c3-6 8-9 15-9h28c8 0 13 4 17 11l8 16v12H14V57Z" fill="url(#carblue)"/><path d="M31 36h35c5 0 8 2 11 7l5 9H24l7-16Z" fill="#D9F0FF"/><circle cx="31" cy="69" r="8" fill="#141922"/><circle cx="77" cy="69" r="8" fill="#141922"/><rect x="75" y="33" width="32" height="36" rx="9" fill="#121722"/><path d="M83 34v-7c0-9 5-15 13-15s13 6 13 15v5" stroke="#121722" strokeWidth="7" strokeLinecap="round"/><circle cx="91" cy="49" r="5" fill="#FFC928"/><path d="M91 54v7" stroke="#FFC928" strokeWidth="4" strokeLinecap="round"/></g></svg>
    if(id==='car_wash') return <svg {...common} aria-hidden="true"><defs><linearGradient id="wash" x1="18" y1="38" x2="93" y2="70"><stop stopColor="#4FB6FF"/><stop offset="1" stopColor="#1768CE"/></linearGradient></defs><path d="M15 58 25 40c3-6 8-9 15-9h29c8 0 13 4 17 11l8 16v11H15V58Z" fill="url(#wash)"/><path d="M32 37h35c5 0 9 2 12 8l4 7H25l7-15Z" fill="#E8F7FF"/><circle cx="32" cy="69" r="8" fill="#151A22"/><circle cx="79" cy="69" r="8" fill="#151A22"/><path d="M27 19c0 4-5 6-5 11M51 12c0 5-5 7-5 12M76 18c0 4-5 6-5 11" stroke="#4AC7FF" strokeWidth="5" strokeLinecap="round"/></svg>
    if(id==='road_assistance') return <svg {...common} aria-hidden="true"><defs><linearGradient id="road" x1="17" y1="31" x2="101" y2="73"><stop stopColor="#F6C928"/><stop offset="1" stopColor="#E79E00"/></linearGradient></defs><path d="M14 59 24 42c4-7 9-10 16-10h30c8 0 14 4 18 11l9 16v11H14V59Z" fill="url(#road)"/><path d="M31 38h37c5 0 9 2 12 8l5 7H24l7-15Z" fill="#EFF7FF"/><circle cx="32" cy="70" r="8" fill="#171C24"/><circle cx="80" cy="70" r="8" fill="#171C24"/><path d="M53 13h9l3 13H50l3-13Z" fill="#EF3340"/><path d="m39 19 8 7M76 19l-8 7" stroke="#EF3340" strokeWidth="4" strokeLinecap="round"/></svg>
    if(id==='starter'||id==='generator'||id==='electrical_diagnostics') return <svg {...common} aria-hidden="true"><defs><linearGradient id="elec" x1="25" y1="15" x2="89" y2="77"><stop stopColor="#263345"/><stop offset="1" stopColor="#0B1018"/></linearGradient></defs><rect x="24" y="14" width="72" height="62" rx="18" fill="url(#elec)"/><path d="m62 23-22 31h18l-7 20 28-39H61l8-12Z" fill="#FFD12A"/></svg>
    return <svg {...common} aria-hidden="true"><defs><linearGradient id="garage" x1="19" y1="20" x2="99" y2="74"><stop stopColor="#243043"/><stop offset="1" stopColor="#10151D"/></linearGradient></defs><path d="m18 39 42-28 42 28v39H18V39Z" fill="url(#garage)"/><rect x="36" y="45" width="48" height="33" rx="6" fill="#FFC928"/><path d="M43 60h34M60 50v22" stroke="#1B2430" strokeWidth="6" strokeLinecap="round"/></svg>
  }

  function CarArtwork(){
    return <svg viewBox="0 0 220 120" role="img" aria-label="Toyota Prado"><defs><linearGradient id="body" x1="28" y1="31" x2="190" y2="99"><stop stopColor="#252A31"/><stop offset=".5" stopColor="#0E1116"/><stop offset="1" stopColor="#343B44"/></linearGradient><linearGradient id="glass" x1="67" y1="35" x2="153" y2="67"><stop stopColor="#DDF3FF"/><stop offset="1" stopColor="#607A91"/></linearGradient><filter id="carshadow"><feDropShadow dx="0" dy="7" stdDeviation="6" floodOpacity=".24"/></filter></defs><g filter="url(#carshadow)"><path d="M26 78 42 46c5-10 13-15 24-16l76-4c16-1 29 7 38 21l17 28v22H24L26 78Z" fill="url(#body)"/><path d="M67 37h62c13 0 22 5 30 16l10 15H52l15-31Z" fill="url(#glass)"/><path d="M97 34v34M137 34l11 34" stroke="#161B22" strokeWidth="5"/><path d="M31 76h160" stroke="#5C6570" strokeWidth="3"/><path d="M28 78h23v13H26" fill="#242A31"/><path d="M184 73h15v18h-20" fill="#242A31"/><path d="M45 69h21v8H43zM161 68h25v9h-27z" fill="#EEF8FF"/><rect x="95" y="73" width="30" height="10" rx="3" fill="#101318" stroke="#68717C"/><circle cx="63" cy="96" r="17" fill="#11151B"/><circle cx="63" cy="96" r="8" fill="#B3BBC4"/><circle cx="166" cy="96" r="17" fill="#11151B"/><circle cx="166" cy="96" r="8" fill="#B3BBC4"/><path d="M40 85h145" stroke="#0B0D11" strokeWidth="5"/></g></svg>
  }

  function OfferArtwork({kind}:{kind:'oil'|'tow'|'tire'}){
    if(kind==='oil')return <svg viewBox="0 0 150 100" aria-hidden="true"><defs><linearGradient id="oilb" x1="31" y1="12" x2="93" y2="91"><stop stopColor="#3D424B"/><stop offset="1" stopColor="#0D1015"/></linearGradient></defs><path d="M59 10h35l8 14v65H46V25l13-15Z" fill="url(#oilb)"/><path d="M58 27h31v23H58z" fill="#EDEFF2"/><path d="M64 32h19v4H64zM64 40h13v4H64z" fill="#181C22"/><path d="M107 39h17l8 12v38h-30V47l5-8Z" fill="#272C34"/><path d="M18 55h26v34H15V64l3-9Z" fill="#1D2229"/><path d="M70 58c7 8 10 13 10 18a10 10 0 1 1-20 0c0-5 3-10 10-18Z" fill="#F5A800"/></svg>
    if(kind==='tow')return <svg viewBox="0 0 180 100" aria-hidden="true"><path d="M15 60h91l17-27h26l15 24v27H15V60Z" fill="#F4B600"/><path d="M113 60h44l-13-20h-18l-13 20Z" fill="#E8F5FF"/><rect x="25" y="47" width="76" height="10" rx="3" fill="#202833"/><path d="m55 45 37-23 7 7-31 18" fill="#E69E00"/><circle cx="48" cy="84" r="13" fill="#171C24"/><circle cx="48" cy="84" r="5" fill="#B9C2CC"/><circle cx="134" cy="84" r="13" fill="#171C24"/><circle cx="134" cy="84" r="5" fill="#B9C2CC"/></svg>
    return <svg viewBox="0 0 170 100" aria-hidden="true"><defs><radialGradient id="ot" cx="0" cy="0" r="1" gradientTransform="translate(72 58) rotate(90) scale(41)"><stop stopColor="#4C5158"/><stop offset=".7" stopColor="#171A1F"/><stop offset="1" stopColor="#050607"/></radialGradient></defs><circle cx="70" cy="58" r="40" fill="url(#ot)"/><circle cx="70" cy="58" r="24" fill="#C8D0D8"/><circle cx="70" cy="58" r="8" fill="#303741"/><circle cx="123" cy="66" r="31" fill="#111419"/><circle cx="123" cy="66" r="18" fill="#AEB7C0"/></svg>
  }

  function ReminderIcon({kind}:{kind:'oil'|'insurance'|'battery'|'tire'}){
    if(kind==='oil')return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 18h26v19H10z" fill="#202833"/><path d="m14 18 4-7h14l4 7" stroke="#202833" strokeWidth="4" strokeLinejoin="round"/><path d="M24 22c5 6 7 9 7 12a7 7 0 1 1-14 0c0-3 2-6 7-12Z" fill="#FFC928"/></svg>
    if(kind==='insurance')return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 39 11v11c0 10-6 17-15 22C15 39 9 32 9 22V11l15-6Z" fill="#1577D8"/><path d="m16 24 5 5 11-13" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    if(kind==='battery')return <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="14" width="32" height="26" rx="5" fill="#17202B"/><rect x="14" y="9" width="7" height="6" rx="2" fill="#17202B"/><rect x="28" y="9" width="7" height="6" rx="2" fill="#17202B"/><path d="M17 24v7M13.5 27.5h7M29 27.5h7" stroke="#77D17D" strokeWidth="3" strokeLinecap="round"/></svg>
    return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="#14181D"/><circle cx="24" cy="24" r="11" fill="#C9D0D8"/><circle cx="24" cy="24" r="4" fill="#2D343D"/><path d="M24 13v7M24 28v7M13 24h7M28 24h7" stroke="#606A75" strokeWidth="3" strokeLinecap="round"/></svg>
  }

  const homeServices=SERVICE_LIST

  function serviceDisplayTitle(service:ServiceDefinition){
    if(service.id==='wheel_change'){
      return lang==='kk'
        ? 'Дөңгелекке көмек'
        : lang==='en'
          ? 'Wheel assistance'
          : 'Помощь с колесом'
    }

    return service.title[lang]
  }

  function StartScreen(){
    const popularIds=[
      'jump_start',
      'wheel_change',
      'tow',
      'fuel_delivery',
      'car_unlock',
    ]

    const popularServices=popularIds
      .map(id=>getService(id))
      .filter((service):service is ServiceDefinition=>Boolean(service))

    const visibleServices=showAllServices
      ? SERVICE_LIST
      : popularServices

    const activeCar=cars[0]||null

    const sosItems=[
      {
        icon:'🌡️',
        title:{ru:'Двигатель перегрелся',kk:'Қозғалтқыш қызып кетті',en:'Engine overheated'},
        serviceId:'road_assistance',
      },
      {
        icon:'🛞',
        title:{ru:'Спущено или повреждено колесо',kk:'Дөңгелек жарылды немесе зақымдалды',en:'Flat or damaged tire'},
        serviceId:'wheel_change',
      },
      {
        icon:'🔋',
        title:{ru:'Разрядился аккумулятор',kk:'Аккумулятор отырды',en:'Dead battery'},
        serviceId:'jump_start',
      },
      {
        icon:'🔑',
        title:{ru:'Ключи заперты в салоне',kk:'Кілт салонда құлыптаулы қалды',en:'Keys locked inside'},
        serviceId:'car_unlock',
      },
      {
        icon:'⛽',
        title:{ru:'Закончилось топливо',kk:'Жанармай таусылды',en:'Out of fuel'},
        serviceId:'fuel_delivery',
      },
      {
        icon:'💧',
        title:{ru:'Закончилась охлаждающая жидкость',kk:'Салқындатқыш сұйықтық таусылды',en:'Coolant ran out'},
        serviceId:'road_assistance',
      },
      {
        icon:'🛢️',
        title:{ru:'Утечка масла',kk:'Май ағып жатыр',en:'Oil leak'},
        serviceId:'road_assistance',
      },
      {
        icon:'⚠️',
        title:{ru:'Не заводится после ДТП или удара',kk:'Соққыдан кейін оталмайды',en:'Will not start after impact'},
        serviceId:'tow',
      },
      {
        icon:'🚙',
        title:{ru:'Автомобиль застрял',kk:'Көлік тұрып қалды',en:'Vehicle is stuck'},
        serviceId:'tow',
      },
      {
        icon:'🔥',
        title:{ru:'Дым или запах гари',kk:'Түтін немесе күйік иісі',en:'Smoke or burning smell'},
        serviceId:'road_assistance',
      },
      {
        icon:'🛑',
        title:{ru:'Проблема с тормозами или рулём',kk:'Тежегіш немесе руль ақауы',en:'Brake or steering problem'},
        serviceId:'tow',
      },
    ] as const

    const chooseSos=(serviceId:string)=>{
      setSosOpen(false)
      openService(serviceId)
    }

    return <div className="home-screen refined-home">
      <div className="refined-sticky">
        <header className="home-header refined-header">
          <button
            type="button"
            className="menu-button"
            aria-label="Меню"
            onClick={()=>setTab('profile')}
          >
            ☰
          </button>

          <div className="wordmark refined-wordmark">
            <b>Jol</b><strong>Dos</strong>
            <small>
              {lang==='kk'
                ? 'ЖОЛДАҒЫ КӨМЕК'
                : lang==='en'
                  ? 'ROADSIDE ASSISTANCE'
                  : 'ПОМОЩЬ НА ДОРОГЕ'}
            </small>
          </div>

          <div className="refined-language">
            <LanguageSwitcher
              lang={lang}
              onChange={setLang}
              compact
            />
          </div>

          <button
            type="button"
            className="notify-button"
            aria-label={tx('notifications')}
            onClick={toggleNotifications}
            aria-expanded={notificationsOpen}
          >
            <BellIcon/>{unreadNotifications>0&&<i>{unreadNotifications}</i>}
          </button>
        </header>

        {notificationsOpen&&(
          <>
            <button
              type="button"
              className="notifications-backdrop"
              aria-label="Закрыть уведомления"
              onClick={closeNotifications}
            />
            <section className="notifications-panel" aria-label={tx('notifications')}>
              <div className="notifications-head">
                <div>
                  <b>{tx('notifications')}</b>
                  <small>
                    {unreadNotifications>0
                      ? (lang==='kk'?`${unreadNotifications} жаңа хабарлама`:lang==='en'?`${unreadNotifications} new notifications`:`${unreadNotifications} новых уведомления`)
                      : (lang==='kk'?'Жаңа хабарлама жоқ':lang==='en'?'No new notifications':'Новых уведомлений нет')}
                  </small>
                </div>
                <button type="button" onClick={closeNotifications} aria-label="Закрыть">×</button>
              </div>

              <div className="notifications-actions">
                <button type="button" onClick={markNotificationsRead}>
                  {lang==='kk'?'Барлығын оқу':lang==='en'?'Mark all read':'Прочитать все'}
                </button>
              </div>

              <button type="button" className="notification-item is-new" onClick={()=>{markNotificationsRead();closeNotifications();setTab('orders')}}>
                <span>🛠️</span>
                <div>
                  <b>{lang==='kk'?'Шебер тапсырысты қабылдады':lang==='en'?'The specialist accepted the order':'Мастер принял заказ'}</b>
                  <small>{lang==='kk'?'Шебер сізге қарай шығып жатыр · 2 мин бұрын':lang==='en'?'The specialist is heading to you · 2 min ago':'Мастер уже выезжает к вам · 2 мин назад'}</small>
                </div>
                <i/>
              </button>

              <button type="button" className="notification-item is-new" onClick={()=>{markNotificationsRead();closeNotifications();openService('wheel_change')}}>
                <span>🛞</span>
                <div>
                  <b>{lang==='kk'?'Дөңгелекке көмекке -10%':lang==='en'?'10% off wheel assistance':'Скидка 10% на помощь с колесом'}</b>
                  <small>{lang==='kk'?'Ұсыныс бүгін жарамды':lang==='en'?'The offer is valid today':'Предложение действует сегодня'}</small>
                </div>
                <i/>
              </button>

              <button type="button" className="notification-item is-new" onClick={()=>{markNotificationsRead();closeNotifications()}}>
                <span>🛢️</span>
                <div>
                  <b>{lang==='kk'?'Май ауыстыруды еске салу':lang==='en'?'Oil change reminder':'Напоминание о замене масла'}</b>
                  <small>{lang==='kk'?'1 200 км қалды':lang==='en'?'1,200 km remaining':'Осталось 1 200 км'}</small>
                </div>
                <i/>
              </button>

              <button type="button" className="notification-item" onClick={()=>{closeNotifications();setTab('profile')}}>
                <span>🎁</span>
                <div>
                  <b>{lang==='kk'?'JolDos акциясы':lang==='en'?'JolDos offer':'Акция JolDos'}</b>
                  <small>{lang==='kk'?'Таңдалған қызметтерге жеңілдік':lang==='en'?'Discount on selected services':'Скидка на выбранные услуги'}</small>
                </div>
                <em>›</em>
              </button>
            </section>
          </>
        )}

        <button
          type="button"
          className="home-sos refined-sos"
          onClick={()=>{setNotificationsOpen(false);setSosOpen(value=>!value)}}
          aria-expanded={sosOpen}
        >
          <span className="refined-alert">!</span>
          <b>SOS</b>
          <div>
            <strong>
              {lang==='kk'
                ? 'Шұғыл көмек'
                : lang==='en'
                  ? 'Urgent roadside help'
                  : 'Экстренная помощь'}
            </strong>
            <small>
              {lang==='kk'
                ? 'Жағдайды таңдаңыз'
                : lang==='en'
                  ? 'Choose what happened'
                  : 'Выберите, что случилось'}
            </small>
          </div>
          <em>{sosOpen?'⌃':'›'}</em>
        </button>

        {sosOpen&&(
          <div className="sos-choice-panel">
            <div className="sos-choice-head">
              <b>
                {lang==='kk'
                  ? 'Не болды?'
                  : lang==='en'
                    ? 'What happened?'
                    : 'Что случилось?'}
              </b>
              <button type="button" onClick={()=>setSosOpen(false)}>×</button>
            </div>

            <div className="sos-choice-grid">
              {sosItems.map(item=>(
                <button
                  type="button"
                  key={item.title.ru}
                  onClick={()=>chooseSos(item.serviceId)}
                >
                  <span>{item.icon}</span>
                  <b>{item.title[lang]}</b>
                  <em aria-hidden="true">›</em>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <section className="services-section">
        <div className="home-section-title">
          <h2>
            {lang==='kk'
              ? 'Танымал қызметтер'
              : lang==='en'
                ? 'Popular services'
                : 'Популярные услуги'}
          </h2>

          <button
            type="button"
            onClick={()=>setShowAllServices(value=>!value)}
          >
            {showAllServices
              ? (lang==='kk'?'Қысқарту':lang==='en'?'Collapse':'Свернуть')
              : (lang==='kk'?'Барлық қызметтер':lang==='en'?'All services':'Все услуги')}
            {' ›'}
          </button>
        </div>

        <div className={`service-grid refined-services ${showAllServices?'is-all':''}`}>
          {visibleServices.map(service=>(
            <button
              type="button"
              key={service.id}
              className="service-card"
              onClick={()=>openService(service.id)}
            >
              <ServiceIcon id={service.id}/>
              <strong>{serviceDisplayTitle(service)}</strong>
              <small>
                {service.priceFrom===null
                  ? '—'
                  : `${lang==='en'?'from':'от'} ${service.priceFrom.toLocaleString('ru-RU')} ₸`}
              </small>
            </button>
          ))}
        </div>

        {!showAllServices&&(
          <button type="button" className="all-services-card" onClick={()=>setShowAllServices(true)}>
            <span><i/><i/><i/><i/></span>
            <div>
              <b>{lang==='kk'?'Барлық қызметтер':lang==='en'?'All services':'Все услуги'}</b>
              <small>{lang==='kk'?'Көлігіңізге арналған толық қызметтер тізімі':lang==='en'?'Full list of services for your car':'Полный список услуг для вашего авто'}</small>
            </div>
            <em>›</em>
          </button>
        )}
      </section>

      <section className="refined-offers">
        <div className="home-section-title">
          <h2>
            {lang==='kk'
              ? 'Акциялар мен жеңілдіктер'
              : lang==='en'
                ? 'Offers and discounts'
                : 'Акции и скидки'}
          </h2>
        </div>

        <div className="offer-row">
          <button type="button" onClick={()=>openService('road_assistance')}>
            <div className="offer-copy"><b>{lang==='kk'?'Май ауыстыру жеңілдікпен':lang==='en'?'Oil change discount':'Замена масла со скидкой'}</b><span>-20%</span></div>
            <OfferArtwork kind="oil"/>
          </button>
          <button type="button" onClick={()=>openService('tow')}>
            <div className="offer-copy"><b>{lang==='kk'?'Эвакуатор жеңілдікпен':lang==='en'?'Tow truck discount':'Эвакуатор со скидкой'}</b><span>-15%</span></div>
            <OfferArtwork kind="tow"/>
          </button>
          <button type="button" onClick={()=>openService('wheel_change')}>
            <div className="offer-copy"><b>{lang==='kk'?'Шина сервисі жеңілдікпен':lang==='en'?'Tire service discount':'Шиномонтаж со скидкой'}</b><span>-10%</span></div>
            <OfferArtwork kind="tire"/>
          </button>
        </div>
        <div className="offer-dots" aria-hidden="true"><i className="active"/><i/><i/><i/></div>
      </section>

      <section className="refined-car-section">
        <div className="home-section-title">
          <h2>{tx('cars')}</h2>
          <Link href="/client/car">
            {activeCar
              ? (lang==='kk'?'Барлығын көру':lang==='en'?'View all':'Смотреть все')
              : (lang==='kk'?'Қосу':lang==='en'?'Add':'Добавить')}
            {' ›'}
          </Link>
        </div>

        <Link href="/client/car" className="refined-car-card">
          <span className="refined-car-art"><CarArtwork/></span>

          <div>
            <b>
              {activeCar
                ? `${activeCar.make} ${activeCar.model}`
                : 'Toyota Prado'}
            </b>
            <small>{activeCar?.plate||'KZ 123 ABC 02'}</small>
            <small>
              {lang==='kk'?'Жүріс':lang==='en'?'Mileage':'Пробег'}:
              {' '}
              {Number(activeCar?.mileage||124500).toLocaleString('ru-RU')} км
            </small>
          </div>

          <strong>
            ✓ {lang==='kk'?'Бәрі жақсы':lang==='en'?'All good':'Всё хорошо'}
          </strong>

          <em>›</em>
        </Link>
      </section>

      <section className="refined-reminders">
        <div className="home-section-title">
          <h2>
            {lang==='kk'
              ? 'Еске салғыштар'
              : lang==='en'
                ? 'Reminders'
                : 'Напоминания'}
          </h2>
          <Link href="/client/car">
            {lang==='kk'?'Барлығын көру':lang==='en'?'View all':'Смотреть все'} ›
          </Link>
        </div>

        <div className="reminder-list">
          <Link href="/client/car">
            <i><ReminderIcon kind="oil"/></i>
            <span><b>{lang==='kk'?'Май ауыстыру':lang==='en'?'Oil change':'Замена масла'}</b><small>{lang==='kk'?'1 200 км кейін':lang==='en'?'in 1,200 km':'через 1 200 км'}</small><span className="reminder-progress"><i/></span></span>
            <strong>≈ 20 дней</strong><em>›</em>
          </Link>
          <Link href="/client/car">
            <i><ReminderIcon kind="insurance"/></i>
            <span><b>{lang==='kk'?'Сақтандыру':lang==='en'?'Insurance':'Страховка'}</b><small>{lang==='kk'?'9 күннен кейін':lang==='en'?'in 9 days':'через 9 дней'}</small></span>
            <strong>до 20.05</strong><em>›</em>
          </Link>
          <Link href="/client/car">
            <i><ReminderIcon kind="battery"/></i>
            <span><b>{lang==='kk'?'Аккумулятор':lang==='en'?'Battery':'Аккумулятор'}</b><small>{lang==='kk'?'Кепілдік 14 ай':lang==='en'?'14-month warranty':'Гарантия 14 месяцев'}</small></span>
            <strong>до 10.06</strong><em>›</em>
          </Link>
          <Link href="/client/car">
            <i><ReminderIcon kind="tire"/></i>
            <span><b>{lang==='kk'?'Шина сервисі':lang==='en'?'Tire service':'Шиномонтаж'}</b><small>{lang==='kk'?'3 500 км кейін':lang==='en'?'in 3,500 km':'через 3 500 км'}</small></span>
            <strong>≈ 45 дней</strong><em>›</em>
          </Link>
        </div>
      </section>
    </div>
  }

  function Searching(){ return <section className="searching-screen"><div className="radar"><span className="pulse one"/><span className="pulse two"/><span className="pulse three"/><div className="car-dot">🚗</div></div><h1>{tx('searching')}</h1><p>{problem?.title}</p><small>{locationText}</small><div className="loading-line"><i/></div><button type="button" onClick={()=>setStage('start')}>{tx('cancel')}</button></section> }

  function Result(){
    const candidates=matchingTestMasters
    const candidateCount=candidates.length

    return <section className="result-screen">
      <MapView
        lang={lang}
        coords={coords}
        masters={masters}
        activeMaster={activeMaster}
        onSelectMaster={()=>{}}
        onUseLocation={useLocation}
        geoLoading={geoLoading}
      />

      <div className="bottom-sheet">
        <div className="handle"/>

        <div className="master-head">
          <div className="master-avatar">
            {candidateCount||'—'}
          </div>

          <div>
            <small>{tx('suitableNearby')}</small>
            <h2>
              {candidateCount>0
                ? `${candidateCount} · ${selectedService?.title[lang]||tx('helpRoad')}`
                : tx('searchingMaster')}
              <span>✓</span>
            </h2>
            <p>{tx('suitableDesc')}</p>
          </div>
        </div>

        {candidateCount>0&&(
          <div className="stats">
            {candidates.slice(0,3).map((candidate,index)=>(
              <span key={candidate.id}>
                <b>{candidate.name}</b>
                {8+index*3} мин
              </span>
            ))}
          </div>
        )}

        <div className="summary">
          <span>{tx('yourProblem')}</span>
          <b>{selectedService?.title[lang]||problem?.title}</b>
          <small>{locationText}</small>
        </div>

        <div className="price-actions">
          <div>
            <small>{tx('calloutCost')}</small>
            <b>
              {selectedService?.priceFrom===null
                ? '—'
                : `от ${(selectedService?.priceFrom??7000).toLocaleString('ru-RU')} ₸`}
            </b>
          </div>

          <button
            type="button"
            onClick={createOrder}
            disabled={candidateCount===0}
          >
            {candidateCount>0?tx('call'):tx('searchingMaster')}
            <strong>→</strong>
          </button>
        </div>
      </div>
    </section>
  }

  function ActiveOrder(){
    if(!activeOrder) return <StartScreen/>

    const noSpecialists=activeOrder.status==='Нет свободных специалистов'
    const currentIndex=statusSteps.indexOf(activeOrder.status)
    const hasAssignedMaster=Boolean(
      activeOrder.master &&
      activeOrder.master!==tx('searchingMaster')
    )
    const assignedMasterName=hasAssignedMaster
      ? activeOrder.master
      : tx('searchingMaster')

    const arrivalText=!hasAssignedMaster
      ? tx('waitingAcceptance')
      : activeOrder.status==='Мастер принял заказ'
        ? (lang==='en'?'About 8 min':'Около 8 мин')
        : activeOrder.status==='Мастер едет'
          ? (lang==='en'?'About 5 min':'Около 5 мин')
          : activeOrder.status==='Мастер прибыл'||activeOrder.status==='Работа выполняется'
            ? tx('onSite')
            : tx('waitingAcceptance')

    return <section className="active-screen">
      <MapView
        lang={lang}
        coords={coords}
        masters={hasAssignedMaster?masters:[]}
        activeMaster={activeMaster}
        onSelectMaster={handleMapSelect}
        onUseLocation={useLocation}
        geoLoading={geoLoading}
      />

      <div className="order-sheet">
        <div className="handle"/>

        <div className="order-top">
          <span className="live-dot"/>

          <div>
            <small>{tx('current')}</small>
            <h2>{statusLabel(activeOrder.status)}</h2>
            <p>
              {hasAssignedMaster
                ? `${tx('assignedMaster')}: ${assignedMasterName}`
                : tx('sentToSuitable')}
            </p>
          </div>

          {hasAssignedMaster&&(
            <div className="order-contact">
              <button type="button" onClick={()=>setChatOpen(true)}>✉</button>
              <a href="tel:+77000000000">☎</a>
            </div>
          )}
        </div>

        <div className="timeline">
          {statusSteps.slice(0,4).map((s,i)=>
            <div className={i<=currentIndex?'done':''} key={s}>
              <i>{i<currentIndex?'✓':i+1}</i>
              <span>{statusLabel(s)}</span>
            </div>
          )}
        </div>

        {activeOrder.status!=='Завершён'?<>
          {noSpecialists?(
            <>
              <div className="eta-card">
                <span>{tx('noSpecialists')}</span>
                <b>{tx('noSpecialistsDesc')}</b>
              </div>

              <button
                type="button"
                className="advance"
                onClick={cancelActiveOrder}
                style={{
                  background:'#fff',
                  color:'#b42318',
                  border:'1px solid #f3b4ad'
                }}
              >
                {tx('cancelOrder')}
              </button>
            </>
          ):(
            <>
              <div className="eta-card">
                <span>
                  {hasAssignedMaster
                    ? tx('expectedArrival')
                    : tx('sentToSuitable')}
                </span>
                <b>{arrivalText}</b>
              </div>

              <button
                type="button"
                className="advance"
                onClick={()=>notify(tx('statusByMaster'))}
              >
                {hasAssignedMaster
                  ? tx('waitUpdate')
                  : tx('waitingAcceptance')}
              </button>

              <button
                type="button"
                className="advance"
                onClick={cancelActiveOrder}
                style={{
                  marginTop:10,
                  background:'#fff',
                  color:'#b42318',
                  border:'1px solid #f3b4ad'
                }}
              >
                {tx('cancelOrder')}
              </button>
            </>
          )}
        </>:(
          <div className="rating-card">
            <h3>{tx('howWas')}</h3>
            <p>{tx('rateWork')}</p>

            <div>
              {[1,2,3,4,5].map(star=>
                <button
                  type="button"
                  key={star}
                  className={rating>=star?'active':''}
                  onClick={()=>setRating(star)}
                >
                  ★
                </button>
              )}
            </div>

            <button
              type="button"
              className="finish"
              onClick={finishAndHome}
            >
              {tx('finishHome')}
            </button>
          </div>
        )}
      </div>
    </section>
  }

  function renderHome(){ if(stage==='searching') return <Searching/>; if(stage==='result') return <Result/>; if(stage==='active') return <ActiveOrder/>; return <StartScreen/> }
  function renderTab(){
    if(tab==='home') return renderHome()
    if(tab==='map') return <section className="page-view"><header><h1>{tx('mapHelp')}</h1><p>{tx('chooseNearest')}</p></header><MapView lang={lang} coords={coords} masters={masters} activeMaster={activeMaster} onSelectMaster={handleMapSelect} onUseLocation={useLocation} geoLoading={geoLoading} page/><div className="mini-list">{masters.map((m,i)=><button type="button" key={m.name} onClick={()=>{setActiveMaster(i);setStage('result');setTab('home')}}><span>{m.initials}</span><div><b>{m.name}</b><small>{m.role} · {m.distance}</small></div><strong>{m.eta}</strong></button>)}</div></section>
    if(tab==='sto') return <section className="page-view scroll-page"><header><h1>{tx('catalog')}</h1><p>{tx('trustedAstana')}</p></header><div className="station-list">{stations.map(s=><article key={s.name}><div className="station-logo">J</div><div><h3>{s.name}</h3><p>{s.type}</p><small>★ {s.rating} · {s.distance} · {s.open}</small></div><button type="button" onClick={()=>notify(`${s.name}: ${tx('cardOpened')}`)}>›</button></article>)}</div></section>
    if(tab==='orders') return <section className="page-view scroll-page"><header><h1>{tx('myOrders')}</h1><p>{tx('historyCurrent')}</p></header>{orders.length===0?<div className="empty"><span>▤</span><h2>{tx('noOrders')}</h2><p>{tx('noOrdersDesc')}</p><button type="button" onClick={goHome}>{tx('find')}</button></div>:<div className="order-list">{orders.map(o=><article key={o.id}><div><small>{o.createdAt}</small><h3>{o.problem}</h3><p>{o.master} · {o.location}</p></div><b className={isActiveOrderStatus(o.status)?'live':''}>{statusLabel(o.status)}</b>{isActiveOrderStatus(o.status)&&<button type="button" onClick={()=>{setActiveOrderId(o.id);setStage('active');setTab('home')}}>{tx('openOrder')}</button>}</article>)}</div>}</section>
    return <section className="page-view scroll-page"><header><h1>{tx('profile')}</h1><p>{tx('settingsTitle')}</p></header><div className="profile-card"><div className="profile-icon">👤</div><h2>{tx('userName')}</h2><p>Astana · Kazakhstan</p><a href="tel:+77000000000">{tx('supportCall')}</a></div><div className="settings"><Link href="/client/car" style={{textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',boxSizing:'border-box'}}>{tx('cars')} <span>›</span></Link><button type="button" onClick={()=>notify(tx('payment'))}>{tx('payment')} <span>›</span></button><button type="button" onClick={()=>notify(tx('notifications'))}>{tx('notifications')} <span>›</span></button></div></section>
  }

  const isHomeStart=tab==='home'&&stage==='start'
  return <main className="app-shell">
    <div className={`phone ${isHomeStart?'home-phone':''}`}>
      {!isHomeStart&&<div className="topbar client-topbar"><button type="button" className="role-back" aria-label={tx('home')} title={tx('home')} onClick={goBackInsideClient}>←</button><LanguageSwitcher lang={lang} onChange={setLang} compact/><button type="button" className="city" onClick={()=>notify('Астана')}><PinIcon/><span>Астана</span></button><button type="button" className="bell" aria-label="Уведомления" onClick={toggleNotifications} aria-expanded={notificationsOpen}><BellIcon/>{unreadNotifications>0&&<i>{unreadNotifications}</i>}</button></div>}
      {renderTab()}
      <BottomNav tab={tab} onChange={setTab} lang={lang}/>
      <ChatSheet open={chatOpen} masterName={activeOrder?.master||master.name} messages={messages} value={chatText} onChange={setChatText} onSend={sendMessage} onClose={()=>setChatOpen(false)} lang={lang}/>
      {toast&&<div className="toast">{toast}</div>}
    </div>

    <style jsx global>{`
      html,body{
        width:100%;
        max-width:100%;
        overflow-x:hidden;
        overscroll-behavior-x:none;
      }

      *,*::before,*::after{box-sizing:border-box}

      .app-shell,.home-screen,.refined-home,.refined-sticky,
      .services-section,.refined-offers,.refined-car-section,
      .refined-reminders,.sos-choice-panel,.notifications-panel{
        width:100%;
        max-width:100%;
        min-width:0;
      }

      .app-shell{
        width:100%;
        min-width:0;
        min-height:100dvh;
        overflow-x:hidden;
        background:#eef1f5;
      }

      .phone{
        width:min(100%,430px);
        max-width:430px;
        min-width:0;
        margin:0 auto;
        overflow-x:hidden;
        touch-action:pan-y;
      }

      .refined-home{
        height:100%;
        overflow-y:auto;
        overflow-x:hidden;
        overscroll-behavior:contain;
        touch-action:pan-y;
        padding-bottom:104px;
        scrollbar-width:none;
        background:radial-gradient(circle at 50% -120px,rgba(255,184,0,.08),transparent 320px),#f5f6f8;
      }
      .refined-home::-webkit-scrollbar{display:none}

      .refined-sticky{
        position:sticky;
        top:0;
        left:0;
        right:0;
        z-index:30;
        padding:0 14px 14px;
        background:rgba(255,255,255,.97);
        backdrop-filter:blur(14px);
        box-shadow:0 7px 22px rgba(15,23,42,.07);
      }

      .refined-header{
        min-height:84px;
        margin:0 -14px;
        padding:0 14px;
        display:grid!important;
        grid-template-columns:42px minmax(0,1fr) auto 42px!important;
        gap:9px;
        align-items:center;
        background:#fff;
      }

      .refined-header .menu-button,.refined-header .notify-button{
        width:40px;
        height:40px;
        border:0;
        border-radius:13px;
        display:grid;
        place-items:center;
        background:#f7f8fa;
        color:#111827;
        cursor:pointer;
      }

      .refined-header .menu-button{font-size:0;position:relative}
      .refined-header .menu-button::before,.refined-header .menu-button::after{
        content:'';
        position:absolute;
        left:10px;
        width:20px;
        height:2.5px;
        border-radius:4px;
        background:#111827;
      }
      .refined-header .menu-button::before{top:14px;box-shadow:0 6px 0 #111827}
      .refined-header .menu-button::after{top:26px}
      .refined-header .notify-button{position:relative}
      .refined-header .notify-button i{
        position:absolute;
        top:-4px;
        right:-4px;
        min-width:18px;
        height:18px;
        padding:0 4px;
        border:2px solid #fff;
        border-radius:10px;
        display:grid;
        place-items:center;
        background:#ef233c;
        color:#fff;
        font-size:10px;
        font-style:normal;
        font-weight:900;
      }

      .refined-wordmark{
        min-width:0;
        display:flex!important;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        line-height:1;
      }
      .refined-wordmark b,.refined-wordmark strong{display:inline;font-size:32px!important;letter-spacing:-1.9px}
      .refined-wordmark small{margin-top:6px;font-size:7px!important;letter-spacing:3px!important;white-space:nowrap;color:#111827!important;opacity:.78}
      .refined-language{display:flex;align-items:center;justify-content:center}
      .refined-language .lang-switcher,.refined-language [class*="language"]{transform:scale(.9);transform-origin:center}

      .notifications-backdrop{
        position:fixed;
        inset:0;
        z-index:38;
        border:0;
        background:rgba(15,23,42,.2);
        backdrop-filter:blur(2px);
      }

      .notifications-panel{
        position:absolute;
        top:76px;
        right:14px;
        z-index:40;
        width:min(370px,calc(100% - 28px));
        max-height:min(560px,calc(100vh - 110px));
        overflow-y:auto;
        margin:0;
        padding:12px;
        border:1px solid #e6e9ee;
        border-radius:22px;
        background:#fff;
        box-shadow:0 16px 38px rgba(15,23,42,.18);
      }
      .notifications-head{display:flex;align-items:center;justify-content:space-between;padding:2px 2px 10px}
      .notifications-head>div{display:flex;flex-direction:column;gap:3px}
      .notifications-head b{font-size:18px;color:#101828}
      .notifications-head small{font-size:12px;color:#667085}
      .notifications-head button{
        width:34px;height:34px;border:0;border-radius:50%;display:grid;place-items:center;
        background:#f1f3f6;color:#344054;font-size:24px;cursor:pointer;
      }
      .notifications-actions{display:flex;justify-content:flex-end;padding:0 2px 6px}
      .notifications-actions button{border:0;background:transparent;color:#0969da;font-size:12px;font-weight:800;cursor:pointer}
      .notification-item{
        width:100%;min-width:0;display:grid;grid-template-columns:44px minmax(0,1fr) 16px;
        gap:10px;align-items:center;padding:11px 8px;border:0;border-top:1px solid #edf0f3;
        background:#fff;color:#101828;text-align:left;cursor:pointer;
      }
      .notification-item>span{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#fff4cf;font-size:21px}
      .notification-item>div{min-width:0;display:flex;flex-direction:column;gap:3px}
      .notification-item b{font-size:14px;line-height:1.2}
      .notification-item small{font-size:12px;line-height:1.3;color:#667085}
      .notification-item em{font-style:normal;font-size:24px;color:#98a2b3}
      .notification-item>i{width:8px;height:8px;border-radius:50%;background:#1677ff}
      .notification-item.is-new{background:#f8fbff}

      .refined-sos{
        width:100%;
        min-height:104px;
        margin:0;
        padding:17px 20px!important;
        border:0;
        border-radius:24px!important;
        display:grid;
        grid-template-columns:56px 74px minmax(0,1fr) 24px!important;
        gap:10px!important;
        align-items:center;
        background:radial-gradient(circle at 15% 50%,rgba(255,255,255,.13),transparent 120px),linear-gradient(135deg,#ff2836 0%,#f31122 65%,#dc0715 100%)!important;
        box-shadow:0 17px 32px rgba(238,18,35,.24)!important;
        color:#fff;
        text-align:left;
        cursor:pointer;
      }
      .refined-alert{width:48px;height:48px;border:4px solid #fff;border-radius:15px;display:grid;place-items:center;font-size:28px;font-weight:900}
      .refined-sos>b{font-size:35px!important;line-height:1}
      .refined-sos>div{min-width:0;display:flex;flex-direction:column;gap:4px}
      .refined-sos>div strong{font-size:16px!important;line-height:1.15}
      .refined-sos>div small{font-size:12px!important;opacity:.9}
      .refined-sos>em{justify-self:end;font-size:28px;font-style:normal}

      .sos-choice-panel{
        margin-top:10px;padding:13px;border:1px solid #e6e9ee;border-radius:22px;
        max-height:55vh;overflow-y:auto;overflow-x:hidden;background:#fff;
        box-shadow:0 14px 34px rgba(15,23,42,.16);
      }
      .sos-choice-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
      .sos-choice-head b{font-size:18px}
      .sos-choice-head button{width:34px;height:34px;border:0;border-radius:50%;background:#f1f3f6;font-size:24px}
      .sos-choice-grid{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .sos-choice-grid button{
        width:100%;min-width:0;min-height:108px;padding:14px;border:1px solid #edf0f4;border-radius:17px;
        display:grid;grid-template-columns:46px minmax(0,1fr) 18px;gap:10px;align-items:center;
        overflow:hidden;background:#fff;color:#101828;text-align:left;box-shadow:0 5px 14px rgba(15,23,42,.045);
      }
      .sos-choice-grid button>span{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;background:#f7f9fc;font-size:27px}
      .sos-choice-grid button>b{min-width:0;overflow-wrap:anywhere;font-size:15px;line-height:1.25}
      .sos-choice-grid button>em{justify-self:end;color:#98a2b3;font-size:31px;line-height:1;font-style:normal}

      .services-section{padding:26px 14px 0}
      .home-section-title{margin-bottom:14px!important}
      .home-section-title h2{font-size:22px!important;letter-spacing:-.45px}
      .home-section-title button,.home-section-title a{border:0;background:transparent;color:#f2a900!important;font-size:13px!important;font-weight:900!important;text-decoration:none}

      .refined-services,.offer-row{max-width:100%;display:flex;gap:12px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;-ms-overflow-style:none}
      .refined-services::-webkit-scrollbar,.offer-row::-webkit-scrollbar{display:none}
      .refined-services{padding:3px 1px 12px;scroll-snap-type:x proximity}
      .refined-services .service-card{
        flex:0 0 142px;min-width:142px;height:172px;padding:15px 12px!important;border:1px solid rgba(15,23,42,.05)!important;
        border-radius:21px!important;display:flex;flex-direction:column;align-items:flex-start;
        background:linear-gradient(180deg,#fff 0%,#fbfbfc 100%)!important;
        box-shadow:0 10px 24px rgba(15,23,42,.075),inset 0 1px 0 rgba(255,255,255,.9)!important;
        scroll-snap-align:start;
      }
      .refined-services .service-card>svg{width:100%!important;height:74px!important;display:block;object-fit:contain;margin:-6px 0 4px}
      .refined-services .service-card strong{min-height:40px;font-size:14px!important;line-height:1.24!important;text-align:left}
      .refined-services .service-card small{margin-top:auto;font-size:12px!important;font-weight:800!important}
      .refined-services.is-all{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:visible}
      .refined-services.is-all .service-card{width:100%;min-width:0;max-width:100%}

      .all-services-card{
        width:100%;min-width:0;margin-top:10px;padding:16px 18px;border:1px solid #e7ebf0;border-radius:20px;
        display:grid;grid-template-columns:54px minmax(0,1fr) 18px;gap:12px;align-items:center;
        background:#fff;color:#101828;text-align:left;box-shadow:0 8px 22px rgba(15,23,42,.07);cursor:pointer;
      }
      .all-services-card>span{width:48px;height:48px;border-radius:14px;display:grid;grid-template-columns:repeat(2,1fr);gap:5px;padding:8px;background:#eef5ff}
      .all-services-card>span i{border:3px solid #1677ff;border-radius:4px}
      .all-services-card>div{min-width:0;display:flex;flex-direction:column;gap:4px}
      .all-services-card b{font-size:17px}
      .all-services-card small{color:#667085;line-height:1.3}
      .all-services-card>em{font-size:28px;font-style:normal;color:#1677ff}

      .refined-offers,.refined-car-section,.refined-reminders{padding:0 14px;margin-top:25px}
      .offer-row{padding:2px 1px 10px}
      .offer-row button{
        position:relative;flex:0 0 254px;min-width:254px;height:154px;padding:17px;border:0;border-radius:22px;
        overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) 52%;align-items:end;
        color:#fff;background:linear-gradient(135deg,#111820,#2D3540);box-shadow:0 14px 30px rgba(15,23,42,.18);
      }
      .offer-row button:nth-child(2){color:#111827;background:linear-gradient(135deg,#FFD233,#F3A900)}
      .offer-row button:nth-child(3){background:linear-gradient(135deg,#061A35,#0B3972)}
      .offer-copy{position:relative;z-index:2;display:flex;flex-direction:column;align-items:flex-start;gap:12px;text-align:left}
      .offer-copy span{padding:7px 10px;border-radius:9px;background:#F5222D;color:#fff;font-weight:900;font-size:16px}
      .offer-copy b{font-size:17px;line-height:1.2}
      .offer-row button>svg{position:absolute;right:-5px;bottom:0;width:58%;height:90%;filter:drop-shadow(0 9px 9px rgba(0,0,0,.25))}

      .refined-car-card{
        min-height:132px;padding:14px;border:1px solid #e8ebef;border-radius:22px;
        display:grid;grid-template-columns:146px minmax(0,1fr) auto 16px;gap:14px;align-items:center;
        background:#fff;box-shadow:0 10px 25px rgba(15,23,42,.075);color:#101828;text-decoration:none;
      }
      .refined-car-art{width:146px;height:96px;border-radius:16px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#F8FAFC,#EEF2F6)}
      .refined-car-art svg{width:142px;height:auto;display:block}
      .refined-car-card>div{min-width:0;display:flex;flex-direction:column;gap:5px}
      .refined-car-card>div b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px}
      .refined-car-card>div small{font-size:12px;color:#667085}
      .refined-car-card>strong{padding:8px 10px;border-radius:15px;background:#e6f8e9;color:#159447;font-size:11px;white-space:nowrap}
      .refined-car-card>em{color:#98a2b3;font-size:24px;font-style:normal}

      .reminder-list{overflow:hidden;border:1px solid #e8ebef;border-radius:22px;background:#fff;box-shadow:0 8px 22px rgba(16,24,40,.06)}
      .reminder-list a{min-height:74px;padding:10px 12px;border-bottom:1px solid #edf0f3;display:grid;grid-template-columns:44px minmax(0,1fr) auto 14px;gap:10px;align-items:center;color:#101828;text-decoration:none}
      .reminder-list a:last-child{border-bottom:0}
      .reminder-list> a>i{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:#fff1c2;font-style:normal;overflow:hidden}.reminder-list> a>i svg{width:34px;height:34px;display:block}
      .reminder-list a:nth-child(2) i{background:#dcefff}.reminder-list a:nth-child(3) i{background:#dcf6df}.reminder-list a:nth-child(4) i{background:#eee5ff}
      .reminder-list span{min-width:0;display:flex;flex-direction:column;gap:3px}.reminder-list span small{color:#667085}
      .reminder-list strong{font-size:11px;text-align:right;white-space:nowrap}.reminder-list em{color:#98a2b3;font-style:normal;font-size:21px}

      .bottom-nav,nav{max-width:100%}

      @media(max-width:520px){
        .app-shell{padding:0!important}
        .phone{width:100%!important;max-width:100%!important;min-height:100dvh;margin:0!important;border-radius:0!important}
        .refined-sticky,.services-section,.refined-offers,.refined-car-section,.refined-reminders{padding-left:12px!important;padding-right:12px!important}
        .refined-header{margin-left:-12px;margin-right:-12px;padding-left:12px;padding-right:12px}
      }

      @media(max-width:420px){
        .refined-header{grid-template-columns:40px minmax(0,1fr) auto 40px!important;gap:6px}
        .refined-wordmark b,.refined-wordmark strong{font-size:28px!important}
        .refined-wordmark small{font-size:6px!important;letter-spacing:2.4px!important}
        .refined-language{transform:scale(.86);margin:0 -5px}
        .refined-sos{min-height:96px;padding:15px!important;grid-template-columns:48px 64px minmax(0,1fr) 18px!important}
        .refined-sos>b{font-size:31px!important}.refined-sos>div strong{font-size:14px!important}.refined-sos>div small{font-size:11px!important}
        .refined-services .service-card{flex-basis:136px;min-width:136px;height:166px}
        .refined-car-card{grid-template-columns:118px minmax(0,1fr) 14px}
        .refined-car-art{width:118px;height:82px}.refined-car-art svg{width:118px}
        .refined-car-card>strong{grid-column:2;justify-self:start}.refined-car-card>em{grid-column:3;grid-row:1/3}
        .reminder-list strong{display:none}
      }


      @media(min-width:900px){
        .phone.home-phone{width:min(100%,1040px)!important;margin:22px auto!important;border-radius:30px!important;box-shadow:0 24px 70px rgba(15,23,42,.16)!important}
        .refined-services{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));overflow:visible}
        .refined-services .service-card{width:100%;min-width:0;max-width:none}
        .offer-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));overflow:visible}
        .offer-row button{width:100%;min-width:0}
      }
      @media(max-width:380px){
        .sos-choice-grid{grid-template-columns:1fr}
        .sos-choice-grid button{min-height:82px}
      }
    `}</style>
  </main>
}
