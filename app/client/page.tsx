
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

type CarSummary = {
  id: string
  make: string
  model: string
  year: string
  plate: string
  mileage: string
  engine: string
  transmission: string
  fuel: string
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
    mapHelp:{ru:'Карта помощи',kk:'Көмек картасы',en:'Assistance map'}, chooseNearest:{ru:'Выберите ближайшего мастера',kk:'Ең жақын шеберді таңдаңыз',en:'Choose the nearest specialist'}, catalog:{ru:'Каталог СТО',kk:'Автосервистер каталогы',en:'Service center directory'}, trustedAstana:{ru:'Проверенные сервисы Астаны',kk:'Астанадағы тексерілген автосервистер',en:'Verified service centers in Astana'}, cardOpened:{ru:'Карточка открыта',kk:'Карточка ашылды',en:'Card opened'}, myOrders:{ru:'Мои заказы',kk:'Менің тапсырыстарым',en:'My orders'}, historyCurrent:{ru:'История и текущие заявки',kk:'Тарих және ағымдағы өтінімдер',en:'History and active requests'}, noOrders:{ru:'Заказов пока нет',kk:'Әзірге тапсырыс жоқ',en:'No orders yet'}, noOrdersDesc:{ru:'Выберите проблему на главной и вызовите мастера.',kk:'Басты беттен мәселені таңдап, шебер шақырыңыз.',en:'Choose a problem on the home screen and request a specialist.'}, openOrder:{ru:'Открыть заказ',kk:'Тапсырысты ашу',en:'Open order'}, settingsTitle:{ru:'Настройки JolDos',kk:'JolDos баптаулары',en:'JolDos settings'}, userName:{ru:'Пользователь JolDos',kk:'JolDos пайдаланушысы',en:'JolDos user'}, supportCall:{ru:'Позвонить в поддержку',kk:'Қолдау қызметіне қоңырау шалу',en:'Call support'}, cars:{ru:'Мои автомобили',kk:'Менің көліктерім',en:'My vehicles'}, payment:{ru:'Способы оплаты',kk:'Төлем тәсілдері',en:'Payment methods'}, notifications:{ru:'Уведомления',kk:'Хабарландырулар',en:'Notifications'}, astanaCurrent:{ru:'Астана, текущее местоположение',kk:'Астана, ағымдағы орналасқан жер',en:'Astana, current location'}, incomingMessage:{ru:'Здравствуйте! Я уже выезжаю к вам.',kk:'Сәлеметсіз бе! Сізге қарай жолға шықтым.',en:'Hello! I am on my way to you.'},
    popularServices:{ru:'Популярные услуги',kk:'Танымал қызметтер',en:'Popular services'},
    viewAll:{ru:'Смотреть все',kk:'Барлығын көру',en:'View all'},
    allServices:{ru:'Все услуги',kk:'Барлық қызметтер',en:'All services'},
    allServicesDesc:{ru:'Полный список услуг для вашего авто',kk:'Көлігіңізге арналған барлық қызметтер',en:'Full list of services for your vehicle'},
    offers:{ru:'Акции и скидки',kk:'Акциялар мен жеңілдіктер',en:'Offers and discounts'},
    addCar:{ru:'Добавить',kk:'Қосу',en:'Add'},
    everythingGood:{ru:'Всё хорошо',kk:'Бәрі жақсы',en:'All good'},
    mileageWord:{ru:'Пробег',kk:'Жүріс',en:'Mileage'},
    reminders:{ru:'Напоминания',kk:'Еске салғыштар',en:'Reminders'},
    oilChange:{ru:'Замена масла',kk:'Май ауыстыру',en:'Oil change'},
    insurance:{ru:'Страховка',kk:'Сақтандыру',en:'Insurance'},
    battery:{ru:'Аккумулятор',kk:'Аккумулятор',en:'Battery'},
    tireService:{ru:'Шиномонтаж',kk:'Шина сервисі',en:'Tire service'},
    inKm:{ru:'через 1 200 км',kk:'1 200 км кейін',en:'in 1,200 km'},
    inDays:{ru:'через 9 дней',kk:'9 күннен кейін',en:'in 9 days'},
    warrantyMonths:{ru:'Гарантия 14 месяцев',kk:'Кепілдік 14 ай',en:'14-month warranty'},
    tireKm:{ru:'через 3 500 км',kk:'3 500 км кейін',en:'in 3,500 km'},
    urgentHelp:{ru:'Нужна срочная помощь на дороге?',kk:'Жолда шұғыл көмек керек пе?',en:'Need urgent roadside help?'}
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
  const [cars,setCars]=useState<CarSummary[]>([])
  const [homeScrolled,setHomeScrolled]=useState(false)

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
    const onScroll=()=>setHomeScrolled(window.scrollY>90)
    onScroll()
    window.addEventListener('scroll',onScroll,{passive:true})
    return()=>window.removeEventListener('scroll',onScroll)
  },[])

  useEffect(()=>{
    let cancelled=false
    const loadCars=async()=>{
      try{
        const response=await fetch(`/api/cars?client=${encodeURIComponent('Ержан Т.')}`,{cache:'no-store'})
        const data=await response.json()
        if(cancelled||!response.ok||!Array.isArray(data.cars))return
        setCars(data.cars)
      }catch{}
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

  function StartScreen(){
    const popularIds=['jump_start','wheel_change','tow','fuel_delivery','car_unlock']
    const popularServices=popularIds
      .map(id=>getService(id))
      .filter((service):service is ServiceDefinition=>Boolean(service))
    const activeCar=cars[0]||null

    return <div className={`approved-home ${homeScrolled?'is-scrolled':''}`}>
      <div className="approved-fixed">
        <header className="approved-header">
          <button type="button" className="approved-menu" aria-label="Меню" onClick={()=>setTab('profile')}>
            <span/><span/><span/>
          </button>
          <div className="approved-wordmark" aria-label="JolDos"><b>Jol</b><strong>Dos</strong></div>
          <button type="button" className="approved-notify" aria-label={tx('notifications')} onClick={()=>notify(tx('notifications'))}>
            <BellIcon/><i>3</i>
          </button>
        </header>

        <button type="button" className="approved-sos" onClick={()=>findHelp('road_assistance')}>
          <span className="approved-sos-icon">!</span>
          <span className="approved-sos-copy"><b>SOS</b><small>{tx('urgentHelp')}</small></span>
          <span className="approved-sos-arrow">›</span>
        </button>
      </div>

      <div className="approved-scroll">
        <section className="approved-section">
          <div className="approved-title-row">
            <h2>{tx('popularServices')}</h2>
            <button type="button" onClick={()=>document.getElementById('all-services')?.scrollIntoView({behavior:'smooth'})}>{tx('viewAll')} ›</button>
          </div>
          <div className="approved-popular">
            {popularServices.map(service=>
              <button type="button" key={service.id} onClick={()=>openService(service.id)}>
                <ServiceIcon id={service.id}/>
                <strong>{service.title[lang]}</strong>
              </button>
            )}
          </div>
        </section>

        <button id="all-services" type="button" className="approved-all-services" onClick={()=>notify(tx('allServices'))}>
          <span className="approved-grid-icon"><i/><i/><i/><i/></span>
          <span><b>{tx('allServices')}</b><small>{tx('allServicesDesc')}</small></span>
          <em>›</em>
        </button>

        <section className="approved-section">
          <div className="approved-title-row">
            <h2>{tx('offers')}</h2>
            <button type="button" onClick={()=>notify(tx('offers'))}>{tx('viewAll')} ›</button>
          </div>
          <div className="approved-offers">
            <button type="button" onClick={()=>openService('road_assistance')}><span>-20%</span><b>{tx('oilChange')}</b><small>5W-40</small></button>
            <button type="button" onClick={()=>openService('tow')}><span>-15%</span><b>{lang==='kk'?'Эвакуатор жеңілдікпен':lang==='en'?'Tow truck discount':'Эвакуатор со скидкой'}</b></button>
            <button type="button" onClick={()=>openService('wheel_change')}><span>-10%</span><b>{lang==='kk'?'Шина сервисіне жеңілдік':lang==='en'?'Tire service discount':'Шиномонтаж со скидкой'}</b></button>
          </div>
        </section>

        <section className="approved-section">
          <div className="approved-title-row">
            <h2>{tx('cars')}</h2>
            <Link href="/client/car">{activeCar?tx('viewAll'):tx('addCar')} {activeCar?'›':'+'}</Link>
          </div>
          <Link href="/client/car" className="approved-car-card">
            <div className="approved-car-art">🚙</div>
            <div>
              <b>{activeCar?`${activeCar.make} ${activeCar.model}`:'Toyota Prado'}</b>
              <span>{activeCar?.plate||'KZ 123 ABC 02'}</span>
              <small>{tx('mileageWord')}: {Number(activeCar?.mileage||124500).toLocaleString('ru-RU')} км</small>
            </div>
            <strong>✓ {tx('everythingGood')}</strong>
            <em>›</em>
          </Link>
        </section>

        <section className="approved-section approved-reminders">
          <div className="approved-title-row">
            <h2>{tx('reminders')}</h2>
            <Link href="/client/car">{tx('viewAll')} ›</Link>
          </div>
          <div className="approved-reminder-list">
            <Link href="/client/car"><i>🛢️</i><span><b>{tx('oilChange')}</b><small>{tx('inKm')}</small></span><strong>≈ 20 дней</strong><em>›</em></Link>
            <Link href="/client/car"><i>🛡️</i><span><b>{tx('insurance')}</b><small>{tx('inDays')}</small></span><strong>до 20.05</strong><em>›</em></Link>
            <Link href="/client/car"><i>🔋</i><span><b>{tx('battery')}</b><small>{tx('warrantyMonths')}</small></span><strong>до 10.06</strong><em>›</em></Link>
            <Link href="/client/car"><i>🛞</i><span><b>{tx('tireService')}</b><small>{tx('tireKm')}</small></span><strong>≈ 45 дней</strong><em>›</em></Link>
          </div>
        </section>
      </div>
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
      {!isHomeStart&&<div className="topbar client-topbar"><Link href="/" className="role-back" aria-label={tx('roleBack')} title={tx('roleBack')}>←</Link><LanguageSwitcher lang={lang} onChange={setLang} compact/><button type="button" className="city" onClick={()=>notify('Астана')}><PinIcon/><span>Астана</span></button><button type="button" className="bell" aria-label="Уведомления" onClick={()=>notify(tx('notifications'))}><BellIcon/></button></div>}
      {renderTab()}
      <BottomNav tab={tab} onChange={setTab} lang={lang}/>
      <ChatSheet open={chatOpen} masterName={activeOrder?.master||master.name} messages={messages} value={chatText} onChange={setChatText} onSend={sendMessage} onClose={()=>setChatOpen(false)} lang={lang}/>
      {toast&&<div className="toast">{toast}</div>}
    </div>
    <style jsx global>{`
      .home-phone{max-width:100%!important;width:100%!important;background:#f7f8fa!important}
      .approved-home{min-height:100vh;background:#f7f8fa;color:#101828;padding-bottom:110px}
      .approved-fixed{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.97);backdrop-filter:blur(18px);padding:10px 18px 14px;border-bottom:1px solid rgba(15,23,42,.05)}
      .approved-header{height:72px;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;max-width:1180px;margin:0 auto}
      .approved-menu,.approved-notify{width:44px;height:44px;border:0;background:transparent;border-radius:14px;display:grid;place-items:center;position:relative;color:#101828}
      .approved-menu span{width:25px;height:3px;background:#101828;border-radius:4px;display:block;margin:3px 0}
      .approved-wordmark{text-align:center;font-size:38px;line-height:1;font-weight:900;letter-spacing:-2px}.approved-wordmark b{color:#101828}.approved-wordmark strong{color:#ffb800}
      .approved-notify i{position:absolute;right:1px;top:1px;background:#ffb800;color:#101828;font-size:12px;font-style:normal;font-weight:900;min-width:21px;height:21px;border-radius:12px;display:grid;place-items:center}
      .approved-sos{max-width:1180px;width:100%;height:112px;margin:0 auto;border:0;border-radius:25px;background:linear-gradient(135deg,#ff3131,#e80712);color:white;display:grid;grid-template-columns:72px 1fr 40px;align-items:center;gap:16px;padding:20px 26px;text-align:left;box-shadow:0 18px 35px rgba(235,27,35,.23);transition:.25s ease}
      .approved-sos-icon{width:60px;height:60px;border:5px solid #fff;border-radius:18px;display:grid;place-items:center;font-size:38px;font-weight:900}.approved-sos-copy{display:flex;align-items:baseline;gap:18px}.approved-sos-copy b{font-size:44px;line-height:1}.approved-sos-copy small{font-size:20px;font-weight:700}.approved-sos-arrow{font-size:42px;text-align:right}
      .approved-home.is-scrolled .approved-header{height:52px}.approved-home.is-scrolled .approved-wordmark{font-size:29px}.approved-home.is-scrolled .approved-sos{height:58px;border-radius:17px;padding:8px 18px;grid-template-columns:36px 1fr 24px}.approved-home.is-scrolled .approved-sos-icon{width:30px;height:30px;border-width:3px;border-radius:9px;font-size:19px}.approved-home.is-scrolled .approved-sos-copy b{font-size:25px}.approved-home.is-scrolled .approved-sos-copy small{font-size:14px}.approved-home.is-scrolled .approved-sos-arrow{font-size:26px}
      .approved-scroll{max-width:1180px;margin:0 auto;padding:24px 18px 16px}.approved-section{margin-bottom:26px}.approved-title-row{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}.approved-title-row h2{margin:0;font-size:26px;letter-spacing:-.5px}.approved-title-row button,.approved-title-row a{border:0;background:transparent;color:#1264e6;font-weight:750;text-decoration:none;font-size:16px}
      .approved-popular{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:12px;overflow-x:auto;padding:2px 2px 10px;scrollbar-width:none}.approved-popular::-webkit-scrollbar{display:none}.approved-popular button{min-width:150px;height:178px;border:1px solid #edf0f3;border-radius:22px;background:#fff;box-shadow:0 8px 22px rgba(16,24,40,.07);padding:15px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#101828}.approved-popular strong{font-size:16px;line-height:1.25;text-align:center}
      .approved-all-services{width:100%;min-height:88px;border:1px solid #e8ebef;border-radius:22px;background:#fff;box-shadow:0 8px 22px rgba(16,24,40,.06);display:grid;grid-template-columns:55px 1fr 28px;align-items:center;text-align:left;padding:16px 22px;margin-bottom:28px}.approved-all-services span:nth-child(2){display:flex;flex-direction:column;gap:5px}.approved-all-services b{font-size:21px}.approved-all-services small{font-size:14px;color:#667085}.approved-all-services em{font-size:35px;font-style:normal;color:#1264e6}.approved-grid-icon{width:38px;height:38px;display:grid;grid-template-columns:1fr 1fr;gap:5px}.approved-grid-icon i{border:3px solid #1264e6;border-radius:5px}
      .approved-offers{display:grid;grid-template-columns:repeat(3,minmax(250px,1fr));gap:14px;overflow-x:auto;scrollbar-width:none}.approved-offers::-webkit-scrollbar{display:none}.approved-offers button{min-width:250px;height:155px;border:0;border-radius:23px;padding:20px;color:#fff;text-align:left;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;gap:6px;background:linear-gradient(135deg,#111827,#374151);box-shadow:0 10px 26px rgba(16,24,40,.15)}.approved-offers button:nth-child(2){background:linear-gradient(135deg,#ffc400,#f4a400);color:#111827}.approved-offers button:nth-child(3){background:linear-gradient(135deg,#051938,#0f3b72)}.approved-offers span{font-size:20px;font-weight:900;background:#f5222d;color:#fff;border-radius:10px;padding:5px 9px}.approved-offers b{font-size:21px;max-width:180px}.approved-offers small{opacity:.8}
      .approved-car-card{display:grid;grid-template-columns:160px 1fr auto 24px;gap:18px;align-items:center;background:#fff;border:1px solid #e8ebef;border-radius:24px;padding:16px 20px;text-decoration:none;color:#101828;box-shadow:0 10px 24px rgba(16,24,40,.07)}.approved-car-art{height:112px;border-radius:18px;background:linear-gradient(135deg,#eef2f5,#fff);display:grid;place-items:center;font-size:70px}.approved-car-card>div:nth-child(2){display:flex;flex-direction:column;gap:7px}.approved-car-card b{font-size:24px}.approved-car-card span{font-size:17px}.approved-car-card small{font-size:15px;color:#667085}.approved-car-card>strong{background:#e8f8e9;color:#159447;border-radius:18px;padding:11px 16px;white-space:nowrap}.approved-car-card em{font-size:32px;color:#98a2b3;font-style:normal}
      .approved-reminder-list{overflow:hidden;background:#fff;border:1px solid #e8ebef;border-radius:24px;box-shadow:0 10px 24px rgba(16,24,40,.06)}.approved-reminder-list a{min-height:82px;display:grid;grid-template-columns:54px 1fr auto 20px;gap:14px;align-items:center;padding:12px 18px;text-decoration:none;color:#101828;border-bottom:1px solid #edf0f3}.approved-reminder-list a:last-child{border-bottom:0}.approved-reminder-list i{width:48px;height:48px;border-radius:14px;background:#fff2c9;display:grid;place-items:center;font-style:normal;font-size:25px}.approved-reminder-list a:nth-child(2) i{background:#dff0ff}.approved-reminder-list a:nth-child(3) i{background:#daf7df}.approved-reminder-list a:nth-child(4) i{background:#eee4ff}.approved-reminder-list span{display:flex;flex-direction:column;gap:4px}.approved-reminder-list b{font-size:17px}.approved-reminder-list small{font-size:14px;color:#667085}.approved-reminder-list strong{font-size:15px;text-align:right}.approved-reminder-list em{font-size:25px;font-style:normal;color:#98a2b3}
      @media(max-width:760px){.approved-fixed{padding:4px 12px 10px}.approved-header{height:66px}.approved-wordmark{font-size:34px}.approved-sos{height:96px;border-radius:22px;grid-template-columns:58px 1fr 28px;padding:15px 18px;gap:12px}.approved-sos-icon{width:48px;height:48px;font-size:30px}.approved-sos-copy{display:flex;flex-direction:column;gap:2px;align-items:flex-start}.approved-sos-copy b{font-size:36px}.approved-sos-copy small{font-size:14px}.approved-scroll{padding:20px 12px 14px}.approved-title-row h2{font-size:22px}.approved-popular{grid-template-columns:none;display:flex}.approved-popular button{min-width:132px;height:160px}.approved-offers{display:flex}.approved-offers button{min-width:245px}.approved-car-card{grid-template-columns:105px 1fr 20px;padding:13px;gap:12px}.approved-car-art{height:88px;font-size:54px}.approved-car-card>strong{grid-column:2/3;justify-self:start;padding:7px 11px;font-size:13px}.approved-car-card em{grid-column:3;grid-row:1/3}.approved-car-card b{font-size:19px}.approved-reminder-list a{grid-template-columns:48px 1fr auto 15px;padding:10px 12px}.approved-reminder-list strong{font-size:13px}.approved-home.is-scrolled .approved-sos-copy small{display:none}}
    `}</style>
  </main>
}
