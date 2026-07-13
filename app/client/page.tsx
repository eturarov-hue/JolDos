
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  const [roleMenuOpen,setRoleMenuOpen]=useState(false)
  const [readNotificationIds,setReadNotificationIds]=useState<string[]>([])
  const [notificationsHydrated,setNotificationsHydrated]=useState(false)
  const [showAllServices,setShowAllServices]=useState(false)
  const [theme,setTheme]=useState<'dark'|'light'>('dark')
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
  const clientNotifications=useMemo(()=>{
    const items:Array<{
      id:string
      icon:string
      title:string
      description:string
      action:()=>void
    }>=[]

    if(activeOrder){
      items.push({
        id:`order-${activeOrder.id}-${activeOrder.status}`,
        icon:'🛠️',
        title:statusLabel(activeOrder.status),
        description:activeOrder.master&&activeOrder.master!==tx('searchingMaster')
          ? `${activeOrder.master} · ${activeOrder.problem}`
          : activeOrder.problem,
        action:()=>{
          setActiveOrderId(activeOrder.id)
          setStage('active')
          setTab('home')
        },
      })
    }else{
      const latestOrder=orders[0]
      if(latestOrder){
        items.push({
          id:`history-${latestOrder.id}-${latestOrder.status}`,
          icon:latestOrder.status==='Завершён'?'✓':'▤',
          title:statusLabel(latestOrder.status),
          description:latestOrder.problem,
          action:()=>setTab('orders'),
        })
      }
    }

    const activeCar=cars[0]
    if(activeCar){
      items.push({
        id:`car-${activeCar.id}`,
        icon:'🚙',
        title:`${activeCar.make} ${activeCar.model}`,
        description:lang==='kk'
          ? `${activeCar.plate} · Көлік деректері жүктелді`
          : lang==='en'
            ? `${activeCar.plate} · Vehicle data loaded`
            : `${activeCar.plate} · Данные автомобиля загружены`,
        action:()=>{ window.location.href='/client/car' },
      })

      items.push({
        id:`ogpo-${activeCar.id}`,
        icon:'🛡️',
        title:lang==='kk'
          ? 'КҚИ АҚЖМС'
          : lang==='en'
            ? 'Compulsory motor liability insurance'
            : 'ОГПО ВТС',
        description:lang==='kk'
          ? 'Полис мерзімін қосыңыз — JolDos алдын ала ескертеді'
          : lang==='en'
            ? 'Add the policy expiry date to receive reminders'
            : 'Добавьте срок полиса — JolDos напомнит заранее',
        action:()=>{ window.location.href='/client/car' },
      })
    }

    return items
  },[activeOrder,cars,lang,orders])
  const unreadNotificationCount=clientNotifications.filter(
    item=>!readNotificationIds.includes(item.id)
  ).length
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

    try{
      const saved=localStorage.getItem('joldos-read-notifications')
      const parsed=saved?JSON.parse(saved):[]
      if(Array.isArray(parsed)){
        setReadNotificationIds(parsed.filter((item):item is string=>typeof item==='string'))
      }
    }catch{}

    setNotificationsHydrated(true)
  },[])

  useEffect(()=>{
    if(!notificationsHydrated)return
    try{
      localStorage.setItem(
        'joldos-read-notifications',
        JSON.stringify(readNotificationIds)
      )
    }catch{}
  },[notificationsHydrated,readNotificationIds])

  useEffect(()=>{
    try{
      const savedTheme=localStorage.getItem('joldos-theme')
      if(savedTheme==='light'||savedTheme==='dark')setTheme(savedTheme)
    }catch{}
  },[])

  useEffect(()=>{
    try{localStorage.setItem('joldos-theme',theme)}catch{}
  },[theme])

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
    setRoleMenuOpen(value=>!value)
  }

  function toggleNotifications(){
    setSosOpen(false)
    setRoleMenuOpen(false)
    setNotificationsOpen(value=>!value)
  }

  function switchRole(){
    setNotificationsOpen(false)
    setSosOpen(false)
    setRoleMenuOpen(false)
    window.location.assign('/')
  }

  function openRoleMenu(){
    setNotificationsOpen(false)
    setSosOpen(false)
    setRoleMenuOpen(value=>!value)
  }

  function openDriverApp(){
    setRoleMenuOpen(false)
    setTab('home')
    setStage('start')
  }

  function openStationApp(){
    setRoleMenuOpen(false)
    window.location.assign('/station')
  }

  function openMasterApp(){
    setNotificationsOpen(false)
    setSosOpen(false)
    setRoleMenuOpen(false)
    window.location.assign('/master')
  }

  function openNotification(item:(typeof clientNotifications)[number]){
    setNotificationsOpen(false)
    setReadNotificationIds(prev=>prev.includes(item.id)?prev:[...prev,item.id])
    item.action()
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

  function ServiceIcon({ id }: { id: string }) {
  const iconByService: Record<string, string> = {
    jump_start: "/joldos-home/battery.webp",
    wheel_change: "/joldos-home/wheel.webp",
    tow: "/joldos-home/tow.webp",
    fuel_delivery: "/joldos-home/fuel.webp",
    car_unlock: "/joldos-home/unlock.webp",
    road_assistance: "/joldos-home/car.webp",
    car_wash: "/joldos-home/car.webp",
    starter: "/joldos-home/car.webp",
    generator: "/joldos-home/car.webp",
    electrical_diagnostics: "/joldos-home/car.webp",
  }

  return (
    <Image
      src={iconByService[id] ?? "/joldos-home/car.webp"}
      alt=""
      width={84}
      height={84}
      className="service-image"
      aria-hidden="true"
    />
  )
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

    return <div className={`home-screen refined-home theme-${theme}`}>
      <div className="refined-sticky">
        <header className="home-header refined-header">
          <button
            type="button"
            className="menu-button"
            aria-label="Меню"
            onClick={openRoleMenu}
            aria-expanded={roleMenuOpen}
          >
            ☰
          </button>

          <div className="wordmark refined-wordmark">
            <Image
              src="/joldos-logo.png"
              alt="JolDos"
              width={240}
              height={100}
              className="refined-logo-image"
              priority
            />
          </div>

          <div className="refined-language">
            <LanguageSwitcher
              lang={lang}
              onChange={setLang}
              compact
            />
            <button
              type="button"
              className="theme-toggle"
              aria-label={theme==='dark'?'Включить светлую тему':'Включить тёмную тему'}
              title={theme==='dark'?'Светлая тема':'Тёмная тема'}
              onClick={()=>setTheme(value=>value==='dark'?'light':'dark')}
            >
              {theme==='dark'?'☀':'☾'}
            </button>
          </div>

          <button
            type="button"
            className="notify-button"
            aria-label={tx('notifications')}
            onClick={toggleNotifications}
            aria-expanded={notificationsOpen}
          >
            <BellIcon/>{unreadNotificationCount>0&&<i>{unreadNotificationCount}</i>}
          </button>
        </header>

        {roleMenuOpen&&(
          <section className="role-switch-panel" aria-label={tx('roleBack')}>
            <div className="role-switch-head">
              <button type="button" onClick={()=>setRoleMenuOpen(false)} aria-label={tx('home')}>←</button>
              <div>
                <b>{lang==='kk'?'Қосымшаны таңдаңыз':lang==='en'?'Choose application':'Выберите приложение'}</b>
                <small>{lang==='kk'?'Рөлдер арасында тікелей ауысу':lang==='en'?'Switch directly between roles':'Переключение без выхода из заказа'}</small>
              </div>
            </div>
            <div className="role-switch-grid">
              <button type="button" className="active" onClick={openDriverApp}>
                <span>🚗</span><div><b>{lang==='kk'?'Жүргізуші':lang==='en'?'Driver':'Водитель'}</b><small>{lang==='kk'?'Ағымдағы қосымша':lang==='en'?'Current application':'Текущее приложение'}</small></div><em>✓</em>
              </button>
              <button type="button" onClick={openMasterApp}>
                <span>🛠️</span><div><b>{lang==='kk'?'Шебер':lang==='en'?'Master':'Мастер'}</b><small>{lang==='kk'?'Тапсырыстарды қабылдау':lang==='en'?'Accept orders':'Принимать и завершать заказы'}</small></div><em>›</em>
              </button>
              <button type="button" onClick={openStationApp}>
                <span>🏢</span><div><b>{lang==='kk'?'СТО':lang==='en'?'Service station':'СТО'}</b><small>{lang==='kk'?'Ұйым кабинеті':lang==='en'?'Organization account':'Кабинет организации'}</small></div><em>›</em>
              </button>
              <button type="button" onClick={switchRole}>
                <span>↔</span><div><b>{tx('roleBack')}</b><small>{lang==='kk'?'Барлық тест аккаунттары':lang==='en'?'All test accounts':'Все тестовые аккаунты'}</small></div><em>›</em>
              </button>
            </div>
          </section>
        )}

        {notificationsOpen&&(
          <section className="notifications-panel" aria-label={tx('notifications')}>
            <div className="notifications-head">
              <div>
                <b>{tx('notifications')}</b>
                <small>
                  {clientNotifications.length===0
                    ? (lang==='kk'?'Жаңа хабарламалар жоқ':lang==='en'?'No new notifications':'Новых уведомлений нет')
                    : unreadNotificationCount>0
                      ? (lang==='kk'
                          ? `${unreadNotificationCount} жаңа хабарлама`
                          : lang==='en'
                            ? `${unreadNotificationCount} new notifications`
                            : `${unreadNotificationCount} новых уведомления`)
                      : (lang==='kk'?'Барлығы оқылды':lang==='en'?'All read':'Все прочитано')}
                </small>
              </div>
              <button type="button" onClick={()=>setNotificationsOpen(false)} aria-label="Закрыть">×</button>
            </div>

            {clientNotifications.length===0?(
              <div className="notifications-empty">
                <span>✓</span>
                <b>{lang==='kk'?'Барлығы тыныш':lang==='en'?'You are all caught up':'Новых событий пока нет'}</b>
                <small>{lang==='kk'?'Тапсырыс мәртебесі өзгергенде хабарлаймыз':lang==='en'?'We will notify you when an order status changes':'Здесь появятся изменения статуса заказа и важные напоминания'}</small>
              </div>
            ):(
              clientNotifications.map(item=>(
                <button
                  type="button"
                  className={`notification-item ${readNotificationIds.includes(item.id)?'is-read':'is-unread'}`}
                  key={item.id}
                  onClick={()=>openNotification(item)}
                >
                  <span>{item.icon}</span>
                  {!readNotificationIds.includes(item.id)&&<i className="unread-dot" aria-label={lang==='kk'?'Оқылмаған':lang==='en'?'Unread':'Не прочитано'}/>}
                  <div>
                    <b>{item.title}</b>
                    <small>{item.description}</small>
                  </div>
                  <em>›</em>
                </button>
              ))
            )}
          </section>
        )}

        <button
          type="button"
          className="home-sos refined-sos"
          onClick={()=>{setNotificationsOpen(false);setRoleMenuOpen(false);setSosOpen(value=>!value)}}
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
            <span>-20%</span>
            <b>{lang==='kk'?'Май ауыстыру':lang==='en'?'Oil change':'Замена масла'}</b>
          </button>
          <button type="button" onClick={()=>openService('tow')}>
            <span>-15%</span>
            <b>{lang==='kk'?'Эвакуатор':lang==='en'?'Tow truck':'Эвакуатор'}</b>
          </button>
          <button type="button" onClick={()=>openService('wheel_change')}>
            <span>-10%</span>
            <b>{lang==='kk'?'Шина сервисі':lang==='en'?'Tire service':'Шиномонтаж'}</b>
          </button>
        </div>
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
          <span className="refined-car-emoji"><Image src="/joldos-home/car.webp" alt="" width={112} height={82} aria-hidden="true" /></span>

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
            <i>🛢️</i>
            <span><b>{lang==='kk'?'Май ауыстыру':lang==='en'?'Oil change':'Замена масла'}</b><small>{lang==='kk'?'1 200 км кейін':lang==='en'?'in 1,200 km':'через 1 200 км'}</small></span>
            <strong>≈ 20 дней</strong><em>›</em>
          </Link>
          <Link href="/client/car">
            <i>🛡️</i>
            <span><b>{lang==='kk'?'КҚИ АҚЖМС':lang==='en'?'Motor liability insurance':'ОГПО ВТС'}</b><small>{lang==='kk'?'Міндетті автосақтандыру · 9 күннен кейін':lang==='en'?'Compulsory insurance · in 9 days':'Обязательное страхование ответственности · через 9 дней'}</small></span>
            <strong>до 20.05</strong><em>›</em>
          </Link>
          <Link href="/client/car">
            <i>🔋</i>
            <span><b>{lang==='kk'?'Аккумулятор':lang==='en'?'Battery':'Аккумулятор'}</b><small>{lang==='kk'?'Кепілдік 14 ай':lang==='en'?'14-month warranty':'Гарантия 14 месяцев'}</small></span>
            <strong>до 10.06</strong><em>›</em>
          </Link>
          <Link href="/client/car">
            <i>🛞</i>
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
                : selectedService?.title[lang]||tx('helpRoad')}
              <span>✓</span>
            </h2>
            <p>{tx('suitableDesc')}</p>
          </div>
        </div>

        <div className="stats">
          {candidateCount>0 ? candidates.slice(0,3).map((candidate,index)=>(
            <span key={candidate.id}>
              <b>{candidate.name}</b>
              {8+index*3} мин
            </span>
          )) : (
            <span>
              <b>{lang==='kk'?'Өтінім жіберіледі':lang==='en'?'Request will be sent':'Заявка будет отправлена'}</b>
              {lang==='kk'?'Жақын шеберлерге':lang==='en'?'To nearby specialists':'ближайшим мастерам'}
            </span>
          )}
        </div>

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
            >
            {tx('call')}
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
    return <section className="page-view scroll-page"><header><h1>{tx('profile')}</h1><p>{tx('settingsTitle')}</p></header><div className="profile-card"><div className="profile-icon">👤</div><h2>{tx('userName')}</h2><p>Astana · Kazakhstan</p><a href="tel:+77000000000">{tx('supportCall')}</a></div><div className="settings"><Link href="/client/car" style={{textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',boxSizing:'border-box'}}>{tx('cars')} <span>›</span></Link><button type="button" onClick={()=>notify(tx('payment'))}>{tx('payment')} <span>›</span></button><button type="button" onClick={toggleNotifications}>{tx('notifications')} <span>›</span></button><button type="button" onClick={openMasterApp}>{lang==='kk'?'Шебер қосымшасы':lang==='en'?'Master app':'Приложение мастера'} <span>›</span></button><button type="button" onClick={switchRole}>{tx('roleBack')} <span>›</span></button></div></section>
  }

  const isHomeStart=tab==='home'&&stage==='start'
  return <main className="app-shell">
    <div className={`phone ${isHomeStart?'home-phone':''}`}>
      {!isHomeStart&&<div className="topbar client-topbar"><button type="button" className="role-back" aria-label={lang==='kk'?'Қосымшаны таңдау':lang==='en'?'Choose application':'Выбрать приложение'} title={lang==='kk'?'Қосымшаны таңдау':lang==='en'?'Choose application':'Выбрать приложение'} onClick={goBackInsideClient}>←</button><LanguageSwitcher lang={lang} onChange={setLang} compact/><button type="button" className="city" onClick={()=>notify('Астана')}><PinIcon/><span>Астана</span></button><button type="button" className="master-shortcut" aria-label={lang==='kk'?'Шебер қосымшасы':lang==='en'?'Master app':'Приложение мастера'} title={lang==='kk'?'Шебер қосымшасы':lang==='en'?'Master app':'Приложение мастера'} onClick={openMasterApp}>M</button><button type="button" className="bell" aria-label="Уведомления" onClick={toggleNotifications} aria-expanded={notificationsOpen}><BellIcon/></button></div>}
      {!isHomeStart&&roleMenuOpen&&(
        <div className="role-switch-overlay" role="presentation" onClick={()=>setRoleMenuOpen(false)}>
          <section className="role-switch-dialog" role="dialog" aria-modal="true" aria-label={tx('roleBack')} onClick={event=>event.stopPropagation()}>
            <div className="role-switch-head">
              <button type="button" onClick={()=>setRoleMenuOpen(false)} aria-label={lang==='kk'?'Жабу':lang==='en'?'Close':'Закрыть'}>×</button>
              <div>
                <b>{lang==='kk'?'Қосымшаны таңдаңыз':lang==='en'?'Choose application':'Выберите приложение'}</b>
                <small>{lang==='kk'?'Белсенді тапсырыс сақталады':lang==='en'?'The active order will remain saved':'Активный заказ останется сохранённым'}</small>
              </div>
            </div>
            <div className="role-switch-grid">
              <button type="button" className="active" onClick={openDriverApp}>
                <span>🚗</span><div><b>{lang==='kk'?'Жүргізуші':lang==='en'?'Driver':'Водитель'}</b><small>{lang==='kk'?'Ағымдағы қосымша':lang==='en'?'Current application':'Текущее приложение'}</small></div><em>✓</em>
              </button>
              <button type="button" onClick={openMasterApp}>
                <span>🛠️</span><div><b>{lang==='kk'?'Шебер':lang==='en'?'Master':'Мастер'}</b><small>{lang==='kk'?'Тапсырысты қабылдау және аяқтау':lang==='en'?'Accept and complete the order':'Принять и завершить заказ'}</small></div><em>›</em>
              </button>
              <button type="button" onClick={openStationApp}>
                <span>🏢</span><div><b>{lang==='kk'?'СТО':lang==='en'?'Service station':'СТО'}</b><small>{lang==='kk'?'Ұйым кабинеті':lang==='en'?'Organization account':'Кабинет организации'}</small></div><em>›</em>
              </button>
              <button type="button" onClick={switchRole}>
                <span>↔</span><div><b>{tx('roleBack')}</b><small>{lang==='kk'?'Барлық тест аккаунттары':lang==='en'?'All test accounts':'Все тестовые аккаунты'}</small></div><em>›</em>
              </button>
            </div>
          </section>
        </div>
      )}
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
        overflow-x:hidden;
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

      .refined-logo-image{
        display:block!important;
        width:170px!important;
        height:66px!important;
        max-width:100%!important;
        object-fit:contain!important;
      }
      .refined-wordmark b,.refined-wordmark strong{display:inline;font-size:32px!important;letter-spacing:-1.9px}
      .refined-wordmark small{margin-top:6px;font-size:7px!important;letter-spacing:3px!important;white-space:nowrap;color:#111827!important;opacity:.78}
      .refined-language{display:flex;align-items:center;justify-content:center}
      .refined-language .lang-switcher,.refined-language [class*="language"]{transform:scale(.9);transform-origin:center}

      .role-switch-overlay{
        position:absolute;
        inset:0;
        z-index:120;
        display:flex;
        align-items:flex-start;
        justify-content:center;
        padding:72px 14px 18px;
        background:rgba(3,14,29,.58);
        backdrop-filter:blur(5px);
      }
      .role-switch-dialog{
        width:100%;
        max-width:390px;
        max-height:calc(100% - 12px);
        overflow-y:auto;
        border:1px solid rgba(255,255,255,.55);
        border-radius:22px;
        padding:14px;
        background:#fff;
        box-shadow:0 24px 60px rgba(2,12,27,.28);
      }

      .role-switch-panel{
        margin-top:10px;padding:14px;border:1px solid #e5eaf0;border-radius:20px;background:#fff;
        box-shadow:0 14px 34px rgba(15,23,42,.16);
      }
      .role-switch-head{display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid #edf0f3}
      .role-switch-head>button{width:36px;height:36px;border:0;border-radius:12px;background:#f2f4f7;font-size:20px;cursor:pointer}
      .role-switch-head>div{display:flex;flex-direction:column;gap:2px}
      .role-switch-head b{font-size:17px;color:#101828}
      .role-switch-head small{font-size:12px;color:#667085}
      .role-switch-grid{display:grid;gap:8px;padding-top:12px}
      .role-switch-grid>button{width:100%;display:grid;grid-template-columns:42px minmax(0,1fr) 18px;gap:10px;align-items:center;padding:10px;border:1px solid #edf0f3;border-radius:15px;background:#fff;text-align:left;color:#101828;cursor:pointer}
      .role-switch-grid>button.active{background:#fff9e8;border-color:#ffd666}
      .role-switch-grid>button>span{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#f2f4f7;font-size:21px}
      .role-switch-grid>button.active>span{background:#ffedb3}
      .role-switch-grid>button>div{min-width:0;display:flex;flex-direction:column;gap:3px}
      .role-switch-grid b{font-size:14px}
      .role-switch-grid small{font-size:12px;color:#667085}
      .role-switch-grid em{font-style:normal;font-size:20px;color:#98a2b3}

      .notifications-panel{
        margin:0 0 12px;
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
      .notifications-empty{
        min-height:138px;display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:6px;padding:18px;text-align:center;color:#101828;
      }
      .notifications-empty>span{
        width:42px;height:42px;border-radius:50%;display:grid;place-items:center;
        background:#e9f8ee;color:#159447;font-weight:900;
      }
      .notifications-empty>b{font-size:14px}
      .notifications-empty>small{max-width:280px;font-size:12px;line-height:1.4;color:#667085}
      .notification-item{
        position:relative;
        width:100%;min-width:0;display:grid;grid-template-columns:44px minmax(0,1fr) 16px;
        gap:10px;align-items:center;padding:11px 8px;border:0;border-top:1px solid #edf0f3;
        background:#fff;color:#101828;text-align:left;cursor:pointer;
      }
      .notification-item.is-unread{background:#fffaf0}
      .notification-item.is-read{opacity:.78}
      .notification-item .unread-dot{position:absolute;left:7px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#ef233c;box-shadow:0 0 0 3px #fff;font-style:normal}
      .notification-item>span{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#fff4cf;font-size:21px}
      .notification-item>div{min-width:0;display:flex;flex-direction:column;gap:3px}
      .notification-item b{font-size:14px;line-height:1.2}
      .notification-item small{font-size:12px;line-height:1.3;color:#667085}
      .notification-item em{font-style:normal;font-size:24px;color:#98a2b3}

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
      .refined-services .service-card svg{width:46px!important;height:46px!important}
      .refined-services .service-card strong{min-height:40px;font-size:14px!important;line-height:1.24!important;text-align:left}
      .refined-services .service-card small{margin-top:auto;font-size:12px!important;font-weight:800!important}
      .refined-services.is-all{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:visible}
      .refined-services.is-all .service-card{width:100%;min-width:0;max-width:100%}

      .refined-offers,.refined-car-section,.refined-reminders{padding:0 14px;margin-top:25px}
      .offer-row{padding:2px 1px 10px}
      .offer-row button{
        flex:0 0 224px;min-width:224px;height:126px;padding:16px;border:0;border-radius:20px;
        display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;gap:7px;
        color:#fff;background:linear-gradient(135deg,#121923,#313b49);box-shadow:0 12px 27px rgba(15,23,42,.16);
      }
      .offer-row button:nth-child(2){color:#121923;background:linear-gradient(135deg,#ffc51a,#f3a700)}
      .offer-row button:nth-child(3){background:linear-gradient(135deg,#061d3e,#0e3e78)}
      .offer-row span{padding:5px 8px;border-radius:8px;background:#f5222d;color:#fff;font-weight:900}
      .offer-row b{font-size:18px}

      .refined-car-card{
        min-height:114px;padding:14px;border:1px solid #e8ebef;border-radius:22px;
        display:grid;grid-template-columns:92px minmax(0,1fr) auto 16px;gap:11px;align-items:center;
        background:#fff;box-shadow:0 10px 25px rgba(15,23,42,.075);color:#101828;text-decoration:none;
      }
      .refined-car-emoji{width:92px;height:82px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(145deg,#f1f4f7,#fff);overflow:hidden}
      .refined-car-emoji img{width:100%!important;height:100%!important;object-fit:contain!important}
      .refined-car-card>div{min-width:0;display:flex;flex-direction:column;gap:5px}
      .refined-car-card>div b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px}
      .refined-car-card>div small{font-size:12px;color:#667085}
      .refined-car-card>strong{padding:8px 10px;border-radius:15px;background:#e6f8e9;color:#159447;font-size:11px;white-space:nowrap}
      .refined-car-card>em{color:#98a2b3;font-size:24px;font-style:normal}

      .reminder-list{overflow:hidden;border:1px solid #e8ebef;border-radius:22px;background:#fff;box-shadow:0 8px 22px rgba(16,24,40,.06)}
      .reminder-list a{min-height:74px;padding:10px 12px;border-bottom:1px solid #edf0f3;display:grid;grid-template-columns:44px minmax(0,1fr) auto 14px;gap:10px;align-items:center;color:#101828;text-decoration:none}
      .reminder-list a:last-child{border-bottom:0}
      .reminder-list i{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#fff1c2;font-style:normal}
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
        .refined-car-card{grid-template-columns:78px minmax(0,1fr) 14px}
        .refined-car-emoji{width:78px;height:72px}
        .refined-car-card>strong{grid-column:2;justify-self:start}.refined-car-card>em{grid-column:3;grid-row:1/3}
        .reminder-list strong{display:none}
      }

      @media(max-width:380px){
        .sos-choice-grid{grid-template-columns:1fr}
        .sos-choice-grid button{min-height:82px}
      }


      /* JolDos approved dark home design */
      .home-phone{background:#05090d!important}
      .refined-home{
        background:
          radial-gradient(circle at 50% -120px,rgba(255,174,0,.12),transparent 300px),
          linear-gradient(180deg,#05090d 0%,#080d12 100%)!important;
        color:#f8fafc!important;
      }
      .refined-sticky{
        background:rgba(5,9,13,.97)!important;
        box-shadow:0 10px 28px rgba(0,0,0,.38)!important;
      }
      .refined-header{
        min-height:118px!important;
        background:#05090d!important;
        grid-template-columns:42px minmax(0,1fr) auto 42px!important;
      }
      .refined-wordmark{height:100px!important;overflow:visible}
      .refined-logo-image{
        width:190px!important;
        height:86px!important;
        max-height:86px!important;
        object-fit:contain!important;
        display:block!important;
      }
      .refined-header .menu-button,.refined-header .notify-button{
        background:#11171d!important;
        border:1px solid #2a3036!important;
        color:#fff!important;
        box-shadow:0 8px 20px rgba(0,0,0,.28)!important;
      }
      .refined-header .menu-button::before,.refined-header .menu-button::after{background:#fff!important}
      .refined-header .menu-button::before{box-shadow:0 6px 0 #fff!important}
      .refined-header .notify-button i{border-color:#05090d!important;background:#f59e0b!important}
      .refined-language{color:#fff!important}

      .services-section,.refined-offers,.refined-car-section,.refined-reminders{background:transparent!important}
      .home-section-title h2{color:#f8fafc!important}
      .home-section-title button,.home-section-title a{color:#f5a900!important}

      .refined-services .service-card{
        background:linear-gradient(180deg,#11161b 0%,#0c1116 100%)!important;
        border:1px solid #2c333a!important;
        box-shadow:0 12px 26px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.035)!important;
        color:#fff!important;
      }
      .refined-services .service-card:hover{border-color:#f5a900!important}
      .refined-services .service-card strong{
        color:#fff!important;
        min-height:42px!important;
        font-weight:800!important;
      }
      .refined-services .service-card small{color:#f5a900!important}
      .refined-services .service-card .service-image{
        width:84px!important;
        height:76px!important;
        object-fit:contain!important;
        align-self:center!important;
        margin:-3px auto 8px!important;
        filter:drop-shadow(0 8px 10px rgba(0,0,0,.28));
      }

      .refined-car-card{
        background:linear-gradient(180deg,#11161b,#0c1116)!important;
        border-color:#2c333a!important;
        color:#fff!important;
        box-shadow:0 12px 28px rgba(0,0,0,.28)!important;
      }
      .refined-car-emoji{background:#0b1117!important}
      .refined-car-card>div small{color:#a8b1bd!important}
      .refined-car-card>strong{background:#092b1a!important;color:#38d879!important}

      .reminder-list{
        background:#0e141a!important;
        border-color:#2c333a!important;
        box-shadow:0 12px 28px rgba(0,0,0,.26)!important;
      }
      .reminder-list a{color:#fff!important;border-color:#252c33!important}
      .reminder-list span small{color:#a8b1bd!important}
      .reminder-list strong{color:#f5a900!important}
      .reminder-list i{background:#171d23!important}

      .offer-row button{border:1px solid #2c333a!important}
      .bottom-nav,nav{background:#0b1015!important;border-top-color:#242b32!important;color:#d4d9df!important}

      @media(max-width:420px){
        .refined-header{min-height:110px!important}
        .refined-logo-image{width:170px!important;height:80px!important;max-height:80px!important}
      }

      .refined-language{gap:5px!important}
      .theme-toggle{
        width:32px;height:32px;flex:0 0 32px;border:1px solid #2c333a;border-radius:10px;
        display:grid;place-items:center;background:#11171d;color:#f5a900;font-size:17px;
        line-height:1;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.18);
      }
      .refined-logo-image{object-position:center!important}

      .theme-light{
        background:#f5f6f8!important;
        color:#101828!important;
      }
      .theme-light .refined-sticky{background:rgba(255,255,255,.97)!important;box-shadow:0 7px 22px rgba(15,23,42,.07)!important}
      .theme-light .refined-header{background:#fff!important}
      .theme-light .refined-header .menu-button,.theme-light .refined-header .notify-button{background:#f7f8fa!important;border-color:#edf0f3!important;color:#111827!important;box-shadow:none!important}
      .theme-light .refined-header .menu-button::before,.theme-light .refined-header .menu-button::after{background:#111827!important}
      .theme-light .refined-header .menu-button::before{box-shadow:0 6px 0 #111827!important}
      .theme-light .refined-header .notify-button i{border-color:#fff!important;background:#ef233c!important}
      .theme-light .theme-toggle{background:#f7f8fa;color:#101828;border-color:#e5e7eb;box-shadow:none}
      .theme-light .home-section-title h2{color:#101828!important}
      .theme-light .refined-services .service-card{background:#fff!important;border-color:#edf0f3!important;box-shadow:0 10px 24px rgba(15,23,42,.08)!important;color:#101828!important}
      .theme-light .refined-services .service-card strong{color:#101828!important}
      .theme-light .refined-services .service-card small{color:#f0a500!important}
      .theme-light .refined-car-card{background:#fff!important;border-color:#e6e9ee!important;color:#101828!important;box-shadow:0 10px 24px rgba(15,23,42,.08)!important}
      .theme-light .refined-car-emoji{background:#f6f7f9!important}
      .theme-light .refined-car-card>div small{color:#667085!important}
      .theme-light .refined-car-card>strong{background:#e8f8ed!important;color:#159447!important}
      .theme-light .reminder-list{background:#fff!important;border-color:#e6e9ee!important;box-shadow:0 10px 24px rgba(15,23,42,.08)!important}
      .theme-light .reminder-list a{color:#101828!important;border-color:#edf0f3!important}
      .theme-light .reminder-list span small{color:#667085!important}
      .theme-light .reminder-list i{background:#f5f7fa!important}
      .theme-light .offer-row button{border-color:#e5e7eb!important}

      .master-shortcut{
        width:38px;height:38px;flex:0 0 38px;display:grid;place-items:center;
        border:1px solid rgba(255,255,255,.18);border-radius:12px;
        background:#ffbd16;color:#101828;font-size:14px;font-weight:900;cursor:pointer;
      }
      @media(max-width:420px){
        .client-topbar{gap:7px}
        .master-shortcut{width:34px;height:34px;flex-basis:34px;border-radius:10px;font-size:13px}
      }
    `}</style>
  </main>
}
