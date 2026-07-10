import type { Lang } from '@/lib/i18n'
import type { Master, OrderStatus, Problem } from '@/types'

type L = Record<Lang,string>
const pick=(v:L,lang:Lang)=>v[lang]

const problemSeed = [
  { id:'start',icon:'⚡',title:{kk:'Көлік оталмай тұр',ru:'Не заводится',en:"Won’t start"},hint:{kk:'Аккумулятор немесе электр жүйесі',ru:'Аккумулятор или электрика',en:'Battery or electrical issue'}},
  { id:'wheel',icon:'◉',title:{kk:'Дөңгелек мәселесі',ru:'Проблема с колесом',en:'Tire problem'},hint:{kk:'Тесілу, ауыстыру немесе ауа толтыру',ru:'Прокол, замена или подкачка',en:'Puncture, replacement or inflation'}},
  { id:'tow',icon:'▰',title:{kk:'Эвакуатор қажет',ru:'Нужен эвакуатор',en:'Need a tow truck'},hint:{kk:'Қала ішінде және қалааралық',ru:'По городу и между городами',en:'City and intercity towing'}},
  { id:'fuel',icon:'▤',title:{kk:'Жанармай таусылды',ru:'Закончилось топливо',en:'Out of fuel'},hint:{kk:'Жанармайды тұрған жеріңізге жеткіземіз',ru:'Доставим топливо на место',en:'Fuel delivered to your location'}},
  { id:'crash',icon:'✦',title:{kk:'Жол-көлік оқиғасы',ru:'ДТП',en:'Road accident'},hint:{kk:'Оқиға орнында көмектесеміз',ru:'Поможем на месте',en:'Assistance at the scene'}},
  { id:'other',icon:'⋯',title:{kk:'Басқа мәселе',ru:'Другая проблема',en:'Other problem'},hint:{kk:'Мәселені өз сөзіңізбен сипаттаңыз',ru:'Опишите проблему своими словами',en:'Describe the issue in your own words'}},
] as const

export function getProblems(lang:Lang):Problem[]{return problemSeed.map(p=>({id:p.id,icon:p.icon,title:pick(p.title,lang),hint:pick(p.hint,lang)}))}

const masterSeed = [
 {name:'Айбек Нурланов',role:{kk:'Көшпелі автомеханик',ru:'Выездной автомеханик',en:'Mobile mechanic'},rating:'4.9',reviews:'156',etaMin:8,distanceKm:'1,2',price:5000,initials:'АН',phone:'+77001234567',coords:[51.1359,71.4461] as [number,number]},
 {name:'Диас Сервис',role:{kk:'Көшпелі шиномонтаж',ru:'Мобильный шиномонтаж',en:'Mobile tire service'},rating:'4.8',reviews:'92',etaMin:11,distanceKm:'2,1',price:6500,initials:'ДС',phone:'+77007654321',coords:[51.1427,71.4298] as [number,number]},
 {name:'JolDos Tow',role:{kk:'Тәулік бойы эвакуатор',ru:'Эвакуатор 24/7',en:'24/7 tow truck'},rating:'4.9',reviews:'211',etaMin:14,distanceKm:'3,4',price:10000,initials:'JT',phone:'+77005550000',coords:[51.1265,71.4634] as [number,number]},
] as const
export function getMasters(lang:Lang):Master[]{return masterSeed.map(m=>({name:m.name,role:pick(m.role,lang),rating:m.rating,reviews:m.reviews,eta:lang==='en'?`${m.etaMin} min`:lang==='kk'?`${m.etaMin} мин`:`${m.etaMin} мин`,distance:`${m.distanceKm} км`,price:lang==='en'?`from ${m.price.toLocaleString('en-US')} ₸`:lang==='kk'?`${m.price.toLocaleString('ru-RU')} ₸ бастап`:`от ${m.price.toLocaleString('ru-RU')} ₸`,initials:m.initials,phone:m.phone,coords:m.coords}))}

const stationSeed=[
 {name:'JolDos Service',type:{kk:'Толық қызмет көрсететін автосервис',ru:'Автосервис полного цикла',en:'Full-service auto center'},rating:'4.9',distance:'1,4 км',open:{kk:'23:00-ге дейін ашық',ru:'Открыто до 23:00',en:'Open until 23:00'}},
 {name:'Master Wheel',type:{kk:'Тәулік бойы шиномонтаж',ru:'Шиномонтаж 24/7',en:'24/7 tire service'},rating:'4.8',distance:'2,2 км',open:{kk:'Тәулік бойы',ru:'Круглосуточно',en:'Open 24 hours'}},
 {name:'Auto Electric Pro',type:{kk:'Автоэлектрик',ru:'Автоэлектрик',en:'Auto electrician'},rating:'4.7',distance:'3,1 км',open:{kk:'21:00-ге дейін ашық',ru:'Открыто до 21:00',en:'Open until 21:00'}},
] as const
export function getStations(lang:Lang){return stationSeed.map(s=>({...s,type:pick(s.type,lang),open:pick(s.open,lang)}))}

export const statusSteps:OrderStatus[]=['Мастер принял заказ','Мастер едет','Мастер прибыл','Работа выполняется','Завершён']
export const statusText:Record<OrderStatus,L>={
 'Ищем мастера':{kk:'Шебер ізделуде',ru:'Ищем мастера',en:'Searching for a specialist'},
 'Мастер принял заказ':{kk:'Шебер тапсырысты қабылдады',ru:'Мастер принял заказ',en:'Specialist accepted the job'},
 'Мастер едет':{kk:'Шебер жолда',ru:'Мастер едет',en:'Specialist is on the way'},
 'Мастер прибыл':{kk:'Шебер келді',ru:'Мастер прибыл',en:'Specialist has arrived'},
 'Работа выполняется':{kk:'Жұмыс орындалуда',ru:'Работа выполняется',en:'Work in progress'},
 'Завершён':{kk:'Аяқталды',ru:'Завершён',en:'Completed'},
}
