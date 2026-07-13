
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
    if(tab!=='home'){
      setTab('home')
      return
    }

    if(stage==='active'){
      setTab('orders')
      return
    }

    setStage('start')
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
    const common={width:54,height:54,viewBox:'0 0 64 64',fill:'none',xmlns:'http://www.w3.org/2000/svg'} as const
    if(id==='tow') return <svg {...common}><path d="M8 40h31l8-10h7v16H8z" fill="#F5A800"/><path d="M13 30h22v10H13z" fill="#FFC928"/><circle cx="18" cy="49" r="6" fill="#17202B"/><circle cx="47" cy="49" r="6" fill="#17202B"/><path d="M39 31h7l5 7H39z" fill="#D7E8F8"/><path d="M5 26h14v4H5z" fill="#17202B"/></svg>
    if(id==='jump_start') return <svg {...common}><rect x="12" y="17" width="40" height="35" rx="7" fill="#17202B"/><rect x="20" y="11" width="9" height="7" rx="2" fill="#17202B"/><rect x="36" y="11" width="9" height="7" rx="2" fill="#17202B"/><path d="M33 21l-8 14h8l-3 10 11-16h-8z" fill="#FFC928"/><path d="M17 27h7M20.5 23.5v7M42 27h7" stroke="#FFC928" strokeWidth="3" strokeLinecap="round"/></svg>
    if(id==='wheel_change') return <svg {...common}><circle cx="32" cy="32" r="25" fill="#15181D"/><circle cx="32" cy="32" r="14" fill="#E9EDF1"/><circle cx="32" cy="32" r="5" fill="#15181D"/><path d="M32 18v9M32 37v9M18 32h9M37 32h9M22 22l6 6M36 36l6 6M42 22l-6 6M28 36l-6 6" stroke="#737C87" strokeWidth="3" strokeLinecap="round"/></svg>
    if(id==='fuel_delivery') return <svg {...common}><path d="M15 10h31l4 8v36H14V18z" fill="#FFC928"/><path d="M20 16h22v14H20z" fill="#FFF5D0"/><path d="M47 20h5c4 0 6 3 6 7v13" stroke="#17202B" strokeWidth="4" strokeLinecap="round"/><path d="M31 35c5 6 7 9 7 12a7 7 0 1 1-14 0c0-3 2-6 7-12z" fill="#17202B"/></svg>
    if(id==='car_unlock') return <svg {...common}><rect x="13" y="29" width="38" height="27" rx="6" fill="#FFC928"/><path d="M22 29v-7c0-8 5-14 13-14 6 0 10 3 12 8" stroke="#17202B" strokeWidth="7" strokeLinecap="round"/><circle cx="32" cy="41" r="4" fill="#17202B"/><path d="M32 44v6" stroke="#17202B" strokeWidth="4" strokeLinecap="round"/></svg>
    if(id==='road_assistance') return <svg {...common}><path d="M14 35c0-11 8-19 18-19s18 8 18 19v11H14z" fill="#E7EDF3"/><path d="M18 35h28l5 10H13z" fill="#17202B"/><circle cx="20" cy="47" r="5" fill="#FFC928"/><circle cx="44" cy="47" r="5" fill="#FFC928"/><path d="M25 12l3 5M39 12l-3 5" stroke="#17202B" strokeWidth="3" strokeLinecap="round"/><path d="M22 31h20" stroke="#6BAFE8" strokeWidth="3"/></svg>
    if(id==='car_wash') return <svg {...common}><path d="M14 35c0-11 8-19 18-19s18 8 18 19v11H14z" fill="#DCE8F2"/><path d="M18 35h28l5 10H13z" fill="#17202B"/><circle cx="20" cy="47" r="5" fill="#FFC928"/><circle cx="44" cy="47" r="5" fill="#FFC928"/><path d="M19 10l2-4M31 9V4M43 10l2-4" stroke="#46B8FF" strokeWidth="4" strokeLinecap="round"/></svg>
    if(id==='starter'||id==='generator'||id==='electrical_diagnostics') return <svg {...common}><rect x="12" y="12" width="40" height="40" rx="10" fill="#17202B"/><path d="M34 17L21 36h11l-3 11 15-22H33z" fill="#FFC928"/></svg>
    return <svg {...common}><path d="M10 26l22-17 22 17v29H10z" fill="#17202B"/><rect x="20" y="32" width="24" height="23" rx="3" fill="#FFC928"/><path d="M25 43h14M32 36v14" stroke="#17202B" strokeWidth="4" strokeLinecap="round"/></svg>
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
            onClick={()=>notify(tx('notifications'))}
          >
            <BellIcon/><i>3</i>
          </button>
        </header>

        <button
          type="button"
          className="home-sos refined-sos"
          onClick={()=>setSosOpen(value=>!value)}
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
          <span className="refined-car-emoji">🚙</span>

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
            <span><b>{lang==='kk'?'Сақтандыру':lang==='en'?'Insurance':'Страховка'}</b><small>{lang==='kk'?'9 күннен кейін':lang==='en'?'in 9 days':'через 9 дней'}</small></span>
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
      {!isHomeStart&&<div className="topbar client-topbar"><button type="button" className="role-back" aria-label={tx('home')} title={tx('home')} onClick={goBackInsideClient}>←</button><LanguageSwitcher lang={lang} onChange={setLang} compact/><button type="button" className="city" onClick={()=>notify('Астана')}><PinIcon/><span>Астана</span></button><button type="button" className="bell" aria-label="Уведомления" onClick={()=>notify(tx('notifications'))}><BellIcon/></button></div>}
      {renderTab()}
      <BottomNav tab={tab} onChange={setTab} lang={lang}/>
      <ChatSheet open={chatOpen} masterName={activeOrder?.master||master.name} messages={messages} value={chatText} onChange={setChatText} onSend={sendMessage} onClose={()=>setChatOpen(false)} lang={lang}/>
      {toast&&<div className="toast">{toast}</div>}
    </div>

    <style jsx global>{`
      .refined-home{
        height:100%;
        overflow-y:auto;
        overscroll-behavior:contain;
        padding-bottom:104px;
        background:#f6f7f9;
      }

      .refined-sticky{
        position:sticky;
        top:0;
        z-index:30;
        padding:0 14px 12px;
        background:rgba(255,255,255,.97);
        backdrop-filter:blur(14px);
        border-bottom:1px solid rgba(15,23,42,.06);
      }

      .refined-header{
        margin:0 -14px;
        padding:0 14px;
        background:#fff;
      }

      .refined-sos{
        width:100%;
        margin:0;
        border:0;
        text-decoration:none;
        cursor:pointer;
      }

      .refined-alert{
        width:48px;
        height:48px;
        border:4px solid #fff;
        border-radius:15px;
        display:grid;
        place-items:center;
        font-size:30px;
        font-weight:900;
      }

      .sos-choice-panel{
        margin-top:10px;
        max-height:55vh;
        overflow-y:auto;
        border:1px solid #e6e9ee;
        border-radius:20px;
        padding:14px;
        background:#fff;
        box-shadow:0 14px 34px rgba(15,23,42,.16);
      }

      .sos-choice-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom:10px;
      }

      .sos-choice-head b{font-size:18px}
      .sos-choice-head button{
        width:34px;
        height:34px;
        border:0;
        border-radius:50%;
        background:#f1f3f6;
        font-size:24px;
      }

      .sos-choice-grid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:9px;
      }

      .sos-choice-grid button{
        min-height:88px;
        border:1px solid #edf0f4;
        border-radius:16px;
        background:#fff;
        padding:10px;
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        justify-content:center;
        gap:7px;
        text-align:left;
        color:#101828;
      }

      .sos-choice-grid span{font-size:25px}
      .sos-choice-grid b{font-size:13px;line-height:1.25}

      .refined-services{
        display:flex;
        overflow-x:auto;
        gap:10px;
        padding-bottom:8px;
        scroll-snap-type:x proximity;
      }

      .refined-services .service-card{
        min-width:145px;
        scroll-snap-align:start;
      }

      .refined-services.is-all{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        overflow:visible;
      }

      .refined-services.is-all .service-card{
        min-width:0;
      }

      .refined-offers,
      .refined-car-section,
      .refined-reminders{
        padding:0 14px;
        margin-top:22px;
      }

      .offer-row{
        display:flex;
        gap:10px;
        overflow-x:auto;
        padding-bottom:6px;
      }

      .offer-row button{
        min-width:220px;
        height:118px;
        border:0;
        border-radius:18px;
        padding:16px;
        display:flex;
        flex-direction:column;
        justify-content:flex-end;
        align-items:flex-start;
        gap:7px;
        color:#fff;
        background:linear-gradient(135deg,#121923,#313b49);
        box-shadow:0 10px 24px rgba(16,24,40,.14);
      }

      .offer-row button:nth-child(2){
        color:#121923;
        background:linear-gradient(135deg,#ffc51a,#f3a700);
      }

      .offer-row button:nth-child(3){
        background:linear-gradient(135deg,#061d3e,#0e3e78);
      }

      .offer-row span{
        border-radius:8px;
        padding:5px 8px;
        background:#f5222d;
        color:#fff;
        font-weight:900;
      }

      .offer-row b{font-size:18px}

      .refined-car-card{
        display:grid;
        grid-template-columns:84px 1fr auto 18px;
        gap:11px;
        align-items:center;
        padding:14px;
        border:1px solid #e8ebef;
        border-radius:20px;
        background:#fff;
        box-shadow:0 8px 22px rgba(16,24,40,.07);
        color:#101828;
        text-decoration:none;
      }

      .refined-car-emoji{
        height:74px;
        border-radius:15px;
        display:grid;
        place-items:center;
        background:#f2f4f7;
        font-size:48px;
      }

      .refined-car-card>div{
        display:flex;
        flex-direction:column;
        gap:5px;
        min-width:0;
      }

      .refined-car-card>div b{
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }

      .refined-car-card>div small{color:#667085}

      .refined-car-card>strong{
        padding:8px 10px;
        border-radius:15px;
        background:#e6f8e9;
        color:#159447;
        font-size:12px;
        white-space:nowrap;
      }

      .refined-car-card>em{
        color:#98a2b3;
        font-size:24px;
        font-style:normal;
      }

      .reminder-list{
        overflow:hidden;
        border:1px solid #e8ebef;
        border-radius:20px;
        background:#fff;
        box-shadow:0 8px 22px rgba(16,24,40,.06);
      }

      .reminder-list a{
        min-height:72px;
        display:grid;
        grid-template-columns:44px 1fr auto 14px;
        gap:10px;
        align-items:center;
        padding:10px 12px;
        border-bottom:1px solid #edf0f3;
        color:#101828;
        text-decoration:none;
      }

      .reminder-list a:last-child{border-bottom:0}
      .reminder-list i{
        width:42px;
        height:42px;
        border-radius:13px;
        display:grid;
        place-items:center;
        background:#fff1c2;
        font-style:normal;
      }

      .reminder-list a:nth-child(2) i{background:#dcefff}
      .reminder-list a:nth-child(3) i{background:#dcf6df}
      .reminder-list a:nth-child(4) i{background:#eee5ff}

      .reminder-list span{
        display:flex;
        flex-direction:column;
        gap:3px;
      }

      .reminder-list span small{color:#667085}
      .reminder-list strong{
        font-size:11px;
        text-align:right;
        white-space:nowrap;
      }
      .reminder-list em{
        color:#98a2b3;
        font-style:normal;
        font-size:21px;
      }

      .refined-home .home-section-title a{
        border:0;
        background:transparent;
        color:#f5a800;
        font-weight:800;
        text-decoration:none;
      }

      @media(max-width:420px){
        .sos-choice-grid{grid-template-columns:1fr 1fr}
        .refined-car-card{grid-template-columns:74px 1fr 16px}
        .refined-car-card>strong{
          grid-column:2;
          justify-self:start;
        }
        .refined-car-card>em{
          grid-column:3;
          grid-row:1/3;
        }
        .refined-car-emoji{height:66px;font-size:42px}
        .reminder-list strong{display:none}
      }

      /* Home UI v3: polished mobile layout without changing application logic */
      .refined-home{
        scrollbar-width:none;
        background:
          radial-gradient(circle at 50% -120px,rgba(255,184,0,.08),transparent 320px),
          #f5f6f8;
      }
      .refined-home::-webkit-scrollbar{display:none}

      .refined-sticky{
        padding:0 14px 14px;
        border-bottom:0;
        box-shadow:0 7px 22px rgba(15,23,42,.07);
      }

      .refined-header{
        min-height:84px;
        display:grid!important;
        grid-template-columns:42px minmax(0,1fr) auto 42px!important;
        gap:9px;
        align-items:center;
      }

      .refined-header .menu-button,
      .refined-header .notify-button{
        width:40px;
        height:40px;
        border-radius:13px;
        background:#f7f8fa;
      }

      .refined-header .menu-button{
        font-size:0;
        position:relative;
      }
      .refined-header .menu-button::before,
      .refined-header .menu-button::after{
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

      .refined-wordmark{
        min-width:0;
        display:flex!important;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        line-height:1;
      }
      .refined-wordmark b,
      .refined-wordmark strong{
        display:inline;
        font-size:32px!important;
        letter-spacing:-1.9px;
      }
      .refined-wordmark small{
        margin-top:6px;
        font-size:7px!important;
        letter-spacing:3px!important;
        white-space:nowrap;
        color:#111827!important;
        opacity:.78;
      }

      .refined-language{
        display:flex;
        align-items:center;
        justify-content:center;
      }
      .refined-language .lang-switcher,
      .refined-language [class*="language"]{
        transform:scale(.9);
        transform-origin:center;
      }

      .refined-sos{
        min-height:104px;
        border-radius:24px!important;
        padding:17px 20px!important;
        grid-template-columns:56px 74px 1fr 24px!important;
        gap:10px!important;
        background:
          radial-gradient(circle at 15% 50%,rgba(255,255,255,.13),transparent 120px),
          linear-gradient(135deg,#ff2836 0%,#f31122 65%,#dc0715 100%)!important;
        box-shadow:0 17px 32px rgba(238,18,35,.24)!important;
      }
      .refined-sos> b{
        font-size:35px!important;
        line-height:1!important;
      }
      .refined-sos>div{
        min-width:0;
        display:flex;
        flex-direction:column;
        gap:4px;
      }
      .refined-sos>div strong{
        font-size:16px!important;
        line-height:1.15;
      }
      .refined-sos>div small{
        font-size:12px!important;
        opacity:.9;
      }
      .refined-alert{
        width:48px!important;
        height:48px!important;
        border-radius:15px!important;
        font-size:28px!important;
      }

      .services-section{
        padding:26px 14px 0!important;
      }

      .home-section-title{
        margin-bottom:14px!important;
      }
      .home-section-title h2{
        font-size:22px!important;
        letter-spacing:-.45px;
      }
      .home-section-title button,
      .home-section-title a{
        color:#f2a900!important;
        font-size:13px!important;
        font-weight:900!important;
      }

      .refined-services,
      .offer-row{
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      .refined-services::-webkit-scrollbar,
      .offer-row::-webkit-scrollbar{
        display:none;
      }

      .refined-services{
        gap:12px;
        padding:3px 1px 12px;
      }
      .refined-services .service-card{
        min-width:142px!important;
        height:172px!important;
        border:1px solid rgba(15,23,42,.05)!important;
        border-radius:21px!important;
        background:
          linear-gradient(180deg,#fff 0%,#fbfbfc 100%)!important;
        box-shadow:
          0 10px 24px rgba(15,23,42,.075),
          inset 0 1px 0 rgba(255,255,255,.9)!important;
        padding:15px 12px!important;
      }
      .refined-services .service-card svg{
        width:46px!important;
        height:46px!important;
      }
      .refined-services .service-card strong{
        min-height:40px;
        font-size:14px!important;
        line-height:1.24!important;
      }
      .refined-services .service-card small{
        margin-top:auto;
        font-size:12px!important;
        font-weight:800!important;
      }

      .refined-offers,
      .refined-car-section,
      .refined-reminders{
        padding:0 14px!important;
        margin-top:25px!important;
      }

      .offer-row{
        gap:12px;
        padding:2px 1px 10px;
      }
      .offer-row button{
        min-width:224px!important;
        height:126px!important;
        border-radius:20px!important;
        padding:16px!important;
        box-shadow:0 12px 27px rgba(15,23,42,.16)!important;
      }

      .refined-car-card{
        min-height:114px;
        grid-template-columns:92px minmax(0,1fr) auto 16px!important;
        border-radius:22px!important;
        padding:14px!important;
        box-shadow:0 10px 25px rgba(15,23,42,.075)!important;
      }
      .refined-car-emoji{
        width:92px;
        height:82px!important;
        background:
          linear-gradient(145deg,#f1f4f7,#fff)!important;
        font-size:51px!important;
      }
      .refined-car-card>div b{
        font-size:17px;
      }
      .refined-car-card>div small{
        font-size:12px;
      }
      .refined-car-card>strong{
        font-size:11px!important;
      }

      .reminder-list{
        border-radius:22px!important;
      }
      .reminder-list a{
        min-height:74px!important;
      }

      .sos-choice-panel{
        border-radius:22px!important;
        padding:13px!important;
      }
      .sos-choice-grid button{
        min-height:94px!important;
        border-radius:17px!important;
        box-shadow:0 5px 14px rgba(15,23,42,.045);
      }

      @media(max-width:420px){
        .refined-header{
          grid-template-columns:40px minmax(0,1fr) auto 40px!important;
          gap:6px;
        }
        .refined-wordmark b,
        .refined-wordmark strong{
          font-size:28px!important;
        }
        .refined-wordmark small{
          font-size:6px!important;
          letter-spacing:2.4px!important;
        }
        .refined-language{
          transform:scale(.86);
          margin:0 -5px;
        }
        .refined-sos{
          min-height:96px;
          grid-template-columns:48px 64px 1fr 18px!important;
          padding:15px 15px!important;
        }
        .refined-sos> b{font-size:31px!important}
        .refined-sos>div strong{font-size:14px!important}
        .refined-sos>div small{font-size:11px!important}
        .refined-services .service-card{
          min-width:136px!important;
          height:166px!important;
        }
        .refined-car-card{
          grid-template-columns:78px minmax(0,1fr) 14px!important;
        }
        .refined-car-emoji{
          width:78px;
          height:72px!important;
          font-size:44px!important;
        }
      }

      /* JolDos SOS and mobile stability patch */
      html,
      body{
        width:100%;
        max-width:100%;
        overflow-x:hidden!important;
        overscroll-behavior-x:none;
      }

      *{
        box-sizing:border-box;
      }

      .app-shell,
      .phone,
      .home-screen,
      .refined-home,
      .refined-sticky,
      .sos-choice-panel,
      .services-section,
      .refined-offers,
      .refined-car-section,
      .refined-reminders{
        width:100%;
        max-width:100%;
        min-width:0;
      }

      .app-shell{
        overflow-x:hidden!important;
      }

      .phone{
        overflow-x:hidden!important;
        touch-action:pan-y;
      }

      .refined-home{
        overflow-x:hidden!important;
        overscroll-behavior-x:none;
        touch-action:pan-y;
      }

      .refined-sticky{
        left:0;
        right:0;
        overflow:visible;
      }

      .sos-choice-panel{
        overflow-x:hidden!important;
        margin-left:0!important;
        margin-right:0!important;
      }

      .sos-choice-grid{
        width:100%;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:10px!important;
      }

      .sos-choice-grid button{
        width:100%;
        min-width:0!important;
        max-width:100%;
        min-height:108px!important;
        display:grid!important;
        grid-template-columns:46px minmax(0,1fr) 18px;
        align-items:center!important;
        gap:10px!important;
        padding:14px!important;
        overflow:hidden;
      }

      .sos-choice-grid button>span{
        width:46px;
        height:46px;
        display:grid;
        place-items:center;
        border-radius:14px;
        background:#f7f9fc;
        font-size:27px!important;
      }

      .sos-choice-grid button>b{
        min-width:0;
        overflow-wrap:anywhere;
        word-break:normal;
        hyphens:auto;
        font-size:15px!important;
        line-height:1.25!important;
      }

      .sos-choice-grid button>em{
        color:#98a2b3;
        font-size:31px;
        line-height:1;
        font-style:normal;
        justify-self:end;
      }

      .refined-services,
      .offer-row{
        max-width:100%;
        overscroll-behavior-x:contain;
      }

      .refined-services .service-card,
      .offer-row button{
        flex-shrink:0;
      }

      .bottom-nav,
      nav{
        max-width:100%;
      }

      @media(max-width:520px){
        .app-shell{
          padding:0!important;
        }

        .phone{
          width:100%!important;
          max-width:100%!important;
          min-height:100dvh;
          border-radius:0!important;
          margin:0!important;
        }

        .refined-sticky{
          padding-left:12px!important;
          padding-right:12px!important;
        }

        .services-section,
        .refined-offers,
        .refined-car-section,
        .refined-reminders{
          padding-left:12px!important;
          padding-right:12px!important;
        }
      }

      @media(max-width:380px){
        .sos-choice-grid{
          grid-template-columns:1fr!important;
        }

        .sos-choice-grid button{
          min-height:82px!important;
        }
      }

    `}</style>
  </main>
}
