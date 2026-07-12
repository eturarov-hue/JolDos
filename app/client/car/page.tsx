'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Lang = 'ru' | 'kk' | 'en'

type CarProfile = {
  id: string
  make: string
  model: string
  year: string
  plate: string
  vin: string
  mileage: string
  engine: string
  transmission: string
  fuel: string
  createdAt: string
}

type ServiceRecord = {
  id: string
  carId: string
  date: string
  mileage: string
  category: string
  description: string
  cost: string
  notes: string
}

const CLIENT_NAME = 'Ержан Т.'
const ACTIVE_CAR_KEY = 'joldos-active-car-v3'

const emptyCar = {
  make:'',
  model:'',
  year:'',
  plate:'',
  vin:'',
  mileage:'',
  engine:'',
  transmission:'',
  fuel:'',
}

const emptyRecord = {
  date:new Date().toISOString().slice(0,10),
  mileage:'',
  category:'Замена масла',
  description:'',
  cost:'',
  notes:'',
}

export default function CarPage(){
  const [lang,setLang]=useState<Lang>('ru')
  const [cars,setCars]=useState<CarProfile[]>([])
  const [records,setRecords]=useState<ServiceRecord[]>([])
  const [activeCarId,setActiveCarId]=useState('')
  const [showCarForm,setShowCarForm]=useState(false)
  const [editingCarId,setEditingCarId]=useState('')
  const [carForm,setCarForm]=useState(emptyCar)
  const [showRecordForm,setShowRecordForm]=useState(false)
  const [recordForm,setRecordForm]=useState(emptyRecord)
  const [message,setMessage]=useState('')
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)

  const t={
    ru:{
      title:'Мои автомобили',subtitle:'Цифровая история автомобиля',back:'Назад',
      addCar:'Добавить автомобиль',edit:'Редактировать',saveCar:'Сохранить автомобиль',
      cancel:'Отмена',make:'Марка',model:'Модель',year:'Год',plate:'Госномер',
      vin:'VIN (необязательно)',mileage:'Пробег, км',engine:'Двигатель',
      transmission:'Коробка',fuel:'Топливо',noCars:'Автомобилей пока нет',
      noCarsDesc:'Добавьте первый автомобиль, чтобы вести историю обслуживания.',
      history:'История обслуживания',addRecord:'Добавить обслуживание',
      emptyHistory:'История пока пуста',
      emptyHistoryDesc:'Добавьте первую запись об обслуживании или ремонте.',
      date:'Дата',category:'Категория',description:'Что сделали',
      cost:'Стоимость, ₸',notes:'Комментарий',saveRecord:'Сохранить запись',
      saved:'Автомобиль сохранён',recordSaved:'Запись добавлена',
      required:'Заполните марку, модель и год',
      recordRequired:'Укажите дату и выполненную работу',
      total:'Всего расходов',delete:'Удалить',deleteCar:'Удалить автомобиль',
      cardTitle:'Паспорт автомобиля',loading:'Загрузка...',
      loadFailed:'Не удалось загрузить автомобили',
      saveFailed:'Не удалось сохранить данные',
    },
    kk:{
      title:'Менің көліктерім',subtitle:'Көліктің цифрлық тарихы',back:'Артқа',
      addCar:'Көлік қосу',edit:'Өзгерту',saveCar:'Көлікті сақтау',
      cancel:'Бас тарту',make:'Марка',model:'Модель',year:'Жыл',
      plate:'Мемлекеттік нөмір',vin:'VIN (міндетті емес)',mileage:'Жүріс, км',
      engine:'Қозғалтқыш',transmission:'Беріліс қорабы',fuel:'Отын',
      noCars:'Көлік әлі қосылмаған',
      noCarsDesc:'Қызмет көрсету тарихын жүргізу үшін алғашқы көлікті қосыңыз.',
      history:'Қызмет көрсету тарихы',addRecord:'Қызмет көрсетуді қосу',
      emptyHistory:'Тарих әзірге бос',
      emptyHistoryDesc:'Алғашқы қызмет көрсету немесе жөндеу жазбасын қосыңыз.',
      date:'Күні',category:'Санат',description:'Не жасалды',cost:'Құны, ₸',
      notes:'Түсініктеме',saveRecord:'Жазбаны сақтау',saved:'Көлік сақталды',
      recordSaved:'Жазба қосылды',required:'Марка, модель және жылды толтырыңыз',
      recordRequired:'Күні мен орындалған жұмысты көрсетіңіз',
      total:'Жалпы шығын',delete:'Жою',deleteCar:'Көлікті жою',
      cardTitle:'Көлік паспорты',loading:'Жүктелуде...',
      loadFailed:'Көліктерді жүктеу мүмкін болмады',
      saveFailed:'Деректерді сақтау мүмкін болмады',
    },
    en:{
      title:'My vehicles',subtitle:'Digital vehicle history',back:'Back',
      addCar:'Add vehicle',edit:'Edit',saveCar:'Save vehicle',cancel:'Cancel',
      make:'Make',model:'Model',year:'Year',plate:'License plate',
      vin:'VIN (optional)',mileage:'Mileage, km',engine:'Engine',
      transmission:'Transmission',fuel:'Fuel',noCars:'No vehicles yet',
      noCarsDesc:'Add your first vehicle to start tracking service history.',
      history:'Service history',addRecord:'Add service record',
      emptyHistory:'History is empty',
      emptyHistoryDesc:'Add the first maintenance or repair record.',
      date:'Date',category:'Category',description:'Work performed',
      cost:'Cost, ₸',notes:'Notes',saveRecord:'Save record',saved:'Vehicle saved',
      recordSaved:'Record added',required:'Enter make, model, and year',
      recordRequired:'Enter date and work performed',total:'Total expenses',
      delete:'Delete',deleteCar:'Delete vehicle',cardTitle:'Vehicle passport',
      loading:'Loading...',loadFailed:'Could not load vehicles',
      saveFailed:'Could not save data',
    },
  } as const

  const tx=t[lang]

  useEffect(()=>{
    let cancelled=false

    const load=async()=>{
      setLoading(true)

      try{
        const response=await fetch(
          `/api/cars?client=${encodeURIComponent(CLIENT_NAME)}`,
          {cache:'no-store'},
        )
        const data=await response.json()

        if(!response.ok){
          throw new Error(data.error||'Load failed')
        }

        if(cancelled)return

        const loadedCars=Array.isArray(data.cars)?data.cars:[]
        const loadedRecords=Array.isArray(data.records)?data.records:[]

        setCars(loadedCars)
        setRecords(loadedRecords)

        const savedActive=localStorage.getItem(ACTIVE_CAR_KEY)
        const initialActive=
          savedActive&&loadedCars.some((car:CarProfile)=>car.id===savedActive)
            ? savedActive
            : loadedCars[0]?.id||''

        setActiveCarId(initialActive)
      }catch{
        if(!cancelled)notify(tx.loadFailed)
      }finally{
        if(!cancelled)setLoading(false)
      }
    }

    void load()
    return()=>{cancelled=true}
  },[])

  const activeCar=useMemo(
    ()=>cars.find(car=>car.id===activeCarId)||null,
    [cars,activeCarId],
  )

  const activeRecords=useMemo(
    ()=>records
      .filter(record=>record.carId===activeCarId)
      .sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()),
    [records,activeCarId],
  )

  const total=useMemo(
    ()=>activeRecords.reduce((sum,item)=>sum+(Number(item.cost)||0),0),
    [activeRecords],
  )

  function notify(text:string){
    setMessage(text)
    window.setTimeout(()=>setMessage(''),2300)
  }

  function selectCar(id:string){
    setActiveCarId(id)
    localStorage.setItem(ACTIVE_CAR_KEY,id)
    setShowCarForm(false)
    setEditingCarId('')
    setShowRecordForm(false)
  }

  function openNewCar(){
    setCarForm(emptyCar)
    setEditingCarId('')
    setShowCarForm(true)
  }

  function editCar(car:CarProfile){
    setCarForm({
      make:car.make,model:car.model,year:car.year,plate:car.plate,
      vin:car.vin,mileage:car.mileage,engine:car.engine,
      transmission:car.transmission,fuel:car.fuel,
    })
    setEditingCarId(car.id)
    setShowCarForm(true)
  }

  async function saveCar(event:FormEvent){
    event.preventDefault()

    if(!carForm.make.trim()||!carForm.model.trim()||!carForm.year.trim()){
      notify(tx.required)
      return
    }

    setSaving(true)

    try{
      const response=await fetch('/api/cars',{
        method:editingCarId?'PATCH':'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          resource:'car',
          id:editingCarId||undefined,
          client:CLIENT_NAME,
          ...carForm,
        }),
      })

      const data=await response.json()

      if(!response.ok||!data.car){
        throw new Error(data.error||'Save failed')
      }

      const savedCar=data.car as CarProfile

      setCars(prev=>
        editingCarId
          ? prev.map(car=>car.id===savedCar.id?savedCar:car)
          : [...prev,savedCar],
      )

      selectCar(savedCar.id)
      setShowCarForm(false)
      setEditingCarId('')
      notify(tx.saved)
    }catch{
      notify(tx.saveFailed)
    }finally{
      setSaving(false)
    }
  }

  async function deleteCar(id:string){
    if(!window.confirm(tx.deleteCar+'?'))return

    try{
      const params=new URLSearchParams({
        resource:'car',
        id,
        client:CLIENT_NAME,
      })

      const response=await fetch(`/api/cars?${params.toString()}`,{
        method:'DELETE',
      })
      const data=await response.json()

      if(!response.ok){
        throw new Error(data.error||'Delete failed')
      }

      const nextCars=cars.filter(car=>car.id!==id)
      setCars(nextCars)
      setRecords(prev=>prev.filter(record=>record.carId!==id))

      const nextActive=nextCars[0]?.id||''
      selectCar(nextActive)
    }catch{
      notify(tx.saveFailed)
    }
  }

  async function addRecord(event:FormEvent){
    event.preventDefault()

    if(!activeCarId||!recordForm.date||!recordForm.description.trim()){
      notify(tx.recordRequired)
      return
    }

    setSaving(true)

    try{
      const response=await fetch('/api/cars',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          resource:'record',
          client:CLIENT_NAME,
          carId:activeCarId,
          ...recordForm,
        }),
      })
      const data=await response.json()

      if(!response.ok||!data.record){
        throw new Error(data.error||'Save record failed')
      }

      setRecords(prev=>[data.record as ServiceRecord,...prev])
      setRecordForm(emptyRecord)
      setShowRecordForm(false)
      notify(tx.recordSaved)
    }catch{
      notify(tx.saveFailed)
    }finally{
      setSaving(false)
    }
  }

  async function deleteRecord(id:string){
    try{
      const params=new URLSearchParams({
        resource:'record',
        id,
        client:CLIENT_NAME,
      })

      const response=await fetch(`/api/cars?${params.toString()}`,{
        method:'DELETE',
      })
      const data=await response.json()

      if(!response.ok){
        throw new Error(data.error||'Delete failed')
      }

      setRecords(prev=>prev.filter(item=>item.id!==id))
    }catch{
      notify(tx.saveFailed)
    }
  }

  return <main style={styles.page}>
    <section style={styles.phone}>
      <header style={styles.header}>
        <Link href="/client" style={styles.back}>←</Link>
        <div style={{flex:1}}>
          <h1 style={styles.h1}>{tx.title}</h1>
          <p style={styles.subtitle}>{tx.subtitle}</p>
        </div>
        <select value={lang} onChange={e=>setLang(e.target.value as Lang)} style={styles.language}>
          <option value="ru">RU</option>
          <option value="kk">KZ</option>
          <option value="en">EN</option>
        </select>
      </header>

      <div style={styles.toolbar}>
        <button type="button" onClick={openNewCar} style={styles.primarySmall}>
          + {tx.addCar}
        </button>
      </div>

      {loading&&<div style={styles.empty}><h3>{tx.loading}</h3></div>}

      {!loading&&showCarForm&&(
        <form onSubmit={saveCar} style={styles.card}>
          <div style={styles.grid}>
            <Field label={tx.make} value={carForm.make} onChange={v=>setCarForm({...carForm,make:v})}/>
            <Field label={tx.model} value={carForm.model} onChange={v=>setCarForm({...carForm,model:v})}/>
            <Field label={tx.year} value={carForm.year} onChange={v=>setCarForm({...carForm,year:v})} type="number"/>
            <Field label={tx.plate} value={carForm.plate} onChange={v=>setCarForm({...carForm,plate:v})}/>
            <Field label={tx.vin} value={carForm.vin} onChange={v=>setCarForm({...carForm,vin:v})}/>
            <Field label={tx.mileage} value={carForm.mileage} onChange={v=>setCarForm({...carForm,mileage:v})} type="number"/>
            <Field label={tx.engine} value={carForm.engine} onChange={v=>setCarForm({...carForm,engine:v})}/>
            <Field label={tx.transmission} value={carForm.transmission} onChange={v=>setCarForm({...carForm,transmission:v})}/>
            <Field label={tx.fuel} value={carForm.fuel} onChange={v=>setCarForm({...carForm,fuel:v})}/>
          </div>
          <div style={styles.actions}>
            <button type="button" onClick={()=>setShowCarForm(false)} style={styles.secondaryButton}>{tx.cancel}</button>
            <button type="submit" disabled={saving} style={styles.primaryButton}>{tx.saveCar}</button>
          </div>
        </form>
      )}

      {!loading&&cars.length===0&&!showCarForm&&(
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🚗</div>
          <h3 style={styles.emptyTitle}>{tx.noCars}</h3>
          <p style={styles.subtitle}>{tx.noCarsDesc}</p>
        </div>
      )}

      {!loading&&cars.length>0&&(
        <div style={styles.carList}>
          {cars.map(car=>{
            const isActive=car.id===activeCarId
            return <article key={car.id} style={{...styles.carListCard,...(isActive?styles.carListCardActive:{})}}>
              <button type="button" onClick={()=>selectCar(car.id)} style={styles.carSelect}>
                <span style={styles.carEmoji}>🚗</span>
                <span style={{textAlign:'left',flex:1}}>
                  <b style={styles.carName}>{car.make} {car.model}</b>
                  <small style={styles.carMeta}>
                    {[car.year,car.plate,car.mileage?`${Number(car.mileage).toLocaleString('ru-RU')} км`:null].filter(Boolean).join(' · ')}
                  </small>
                </span>
                <strong>{isActive?'✓':'›'}</strong>
              </button>
            </article>
          })}
        </div>
      )}

      {!loading&&activeCar&&(
        <>
          <section style={styles.hero}>
            <small style={styles.heroLabel}>{tx.cardTitle}</small>
            <h2 style={styles.heroTitle}>{activeCar.make} {activeCar.model}</h2>
            <p style={styles.heroMeta}>{[activeCar.year,activeCar.engine,activeCar.transmission,activeCar.fuel].filter(Boolean).join(' · ')}</p>
            <div style={styles.metrics}>
              <div style={styles.metric}><small>{tx.mileage}</small><b>{activeCar.mileage?`${Number(activeCar.mileage).toLocaleString('ru-RU')} км`:'—'}</b></div>
              <div style={styles.metric}><small>{tx.plate}</small><b>{activeCar.plate||'—'}</b></div>
            </div>
            <div style={styles.heroActions}>
              <button type="button" onClick={()=>editCar(activeCar)} style={styles.heroButton}>{tx.edit}</button>
              <button type="button" onClick={()=>deleteCar(activeCar.id)} style={styles.heroDangerButton}>{tx.delete}</button>
            </div>
          </section>

          <div style={styles.sectionHead}>
            <div>
              <h2 style={styles.sectionTitle}>{tx.history}</h2>
              <p style={styles.subtitle}>{tx.total}: {total.toLocaleString('ru-RU')} ₸</p>
            </div>
            <button type="button" onClick={()=>setShowRecordForm(true)} style={styles.primarySmall}>+ {tx.addRecord}</button>
          </div>

          {showRecordForm&&(
            <form onSubmit={addRecord} style={styles.card}>
              <div style={styles.grid}>
                <Field label={tx.date} value={recordForm.date} onChange={v=>setRecordForm({...recordForm,date:v})} type="date"/>
                <label style={styles.field}>
                  <span style={styles.label}>{tx.category}</span>
                  <select value={recordForm.category} onChange={e=>setRecordForm({...recordForm,category:e.target.value})} style={styles.input}>
                    <option>Замена масла</option><option>Фильтры</option><option>Тормоза</option>
                    <option>Ходовая</option><option>Электрика</option><option>Шины</option>
                    <option>Аккумулятор</option><option>Ремонт</option><option>Другое</option>
                  </select>
                </label>
                <Field label={tx.mileage} value={recordForm.mileage} onChange={v=>setRecordForm({...recordForm,mileage:v})} type="number"/>
                <Field label={tx.cost} value={recordForm.cost} onChange={v=>setRecordForm({...recordForm,cost:v})} type="number"/>
              </div>
              <Field label={tx.description} value={recordForm.description} onChange={v=>setRecordForm({...recordForm,description:v})}/>
              <Field label={tx.notes} value={recordForm.notes} onChange={v=>setRecordForm({...recordForm,notes:v})}/>
              <div style={styles.actions}>
                <button type="button" onClick={()=>setShowRecordForm(false)} style={styles.secondaryButton}>{tx.cancel}</button>
                <button type="submit" disabled={saving} style={styles.primaryButton}>{tx.saveRecord}</button>
              </div>
            </form>
          )}

          {activeRecords.length===0?(
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📖</div>
              <h3 style={styles.emptyTitle}>{tx.emptyHistory}</h3>
              <p style={styles.subtitle}>{tx.emptyHistoryDesc}</p>
            </div>
          ):(
            <div style={styles.list}>
              {activeRecords.map(item=>
                <article key={item.id} style={styles.record}>
                  <div style={styles.recordTop}>
                    <div>
                      <small style={styles.date}>{item.date}</small>
                      <h3 style={styles.recordTitle}>{item.category}</h3>
                      <p style={styles.recordDescription}>{item.description}</p>
                    </div>
                    <b style={styles.cost}>{item.cost?`${Number(item.cost).toLocaleString('ru-RU')} ₸`:'—'}</b>
                  </div>
                  <div style={styles.recordMeta}>
                    <span>{item.mileage?`${Number(item.mileage).toLocaleString('ru-RU')} км`:'—'}</span>
                    {item.notes&&<span>{item.notes}</span>}
                  </div>
                  <button type="button" onClick={()=>deleteRecord(item.id)} style={styles.deleteButton}>{tx.delete}</button>
                </article>
              )}
            </div>
          )}
        </>
      )}

      {message&&<div style={styles.toast}>{message}</div>}
    </section>
  </main>
}

function Field({label,value,onChange,type='text'}:{label:string;value:string;onChange:(value:string)=>void;type?:string}){
  return <label style={styles.field}>
    <span style={styles.label}>{label}</span>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={styles.input}/>
  </label>
}

const styles:Record<string,React.CSSProperties>={
  page:{minHeight:'100vh',background:'#eef2f5',display:'flex',justifyContent:'center',padding:0,fontFamily:'Arial, sans-serif',color:'#17202b'},
  phone:{width:'100%',maxWidth:480,minHeight:'100vh',background:'#f8fafb',padding:'18px 16px 40px',boxSizing:'border-box',position:'relative'},
  header:{display:'flex',alignItems:'center',gap:12,marginBottom:14},
  back:{width:42,height:42,borderRadius:14,background:'#fff',display:'grid',placeItems:'center',textDecoration:'none',color:'#17202b',fontSize:24,boxShadow:'0 5px 18px rgba(23,32,43,.08)'},
  h1:{margin:0,fontSize:24},subtitle:{margin:'4px 0 0',color:'#6b7280',fontSize:14,lineHeight:1.45},
  language:{border:'1px solid #d8dee5',borderRadius:12,padding:'10px 8px',background:'#fff'},
  toolbar:{display:'flex',justifyContent:'flex-end',marginBottom:12},
  card:{background:'#fff',borderRadius:22,padding:16,boxShadow:'0 8px 24px rgba(23,32,43,.08)',marginBottom:18},
  grid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  field:{display:'flex',flexDirection:'column',gap:6,marginBottom:12},
  label:{fontSize:12,fontWeight:700,color:'#586271'},
  input:{width:'100%',boxSizing:'border-box',border:'1px solid #dbe1e7',borderRadius:13,padding:'12px',fontSize:15,background:'#fff'},
  primaryButton:{flex:1,border:0,borderRadius:15,padding:'14px 16px',fontWeight:800,background:'#f4b000',color:'#17202b',cursor:'pointer'},
  primarySmall:{border:0,borderRadius:13,padding:'11px 13px',fontWeight:800,background:'#f4b000',color:'#17202b',cursor:'pointer'},
  secondaryButton:{border:'1px solid #d7dde4',borderRadius:13,padding:'11px 14px',fontWeight:700,background:'#fff',color:'#17202b',cursor:'pointer'},
  actions:{display:'flex',gap:10},empty:{textAlign:'center',background:'#fff',borderRadius:22,padding:'34px 20px',boxShadow:'0 8px 24px rgba(23,32,43,.06)',marginBottom:18},
  emptyIcon:{fontSize:42},emptyTitle:{margin:'10px 0 4px'},carList:{display:'flex',flexDirection:'column',gap:10,marginBottom:16},
  carListCard:{background:'#fff',border:'1px solid #e2e7ec',borderRadius:18,overflow:'hidden'},carListCardActive:{border:'2px solid #f4b000'},
  carSelect:{width:'100%',display:'flex',alignItems:'center',gap:12,padding:14,border:0,background:'transparent',cursor:'pointer'},
  carEmoji:{fontSize:26},carName:{display:'block',fontSize:16},carMeta:{display:'block',marginTop:4,color:'#6b7280'},
  hero:{background:'linear-gradient(135deg,#17202b,#344150)',color:'#fff',borderRadius:24,padding:20,boxShadow:'0 12px 30px rgba(23,32,43,.18)',marginBottom:18},
  heroLabel:{opacity:.72},heroTitle:{fontSize:26,margin:'6px 0'},heroMeta:{margin:0,opacity:.78},
  metrics:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:18},
  metric:{background:'rgba(255,255,255,.1)',borderRadius:16,padding:14,display:'flex',flexDirection:'column',gap:6},
  heroActions:{display:'flex',gap:10,marginTop:14},heroButton:{flex:1,border:'1px solid rgba(255,255,255,.25)',background:'rgba(255,255,255,.08)',color:'#fff',borderRadius:12,padding:'10px 12px',fontWeight:700,cursor:'pointer'},
  heroDangerButton:{border:'1px solid rgba(255,120,120,.4)',background:'rgba(180,35,24,.25)',color:'#fff',borderRadius:12,padding:'10px 12px',fontWeight:700,cursor:'pointer'},
  sectionHead:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,margin:'20px 2px 12px'},
  sectionTitle:{margin:0,fontSize:20},list:{display:'flex',flexDirection:'column',gap:12},
  record:{background:'#fff',borderRadius:20,padding:16,boxShadow:'0 8px 24px rgba(23,32,43,.07)'},
  recordTop:{display:'flex',justifyContent:'space-between',gap:12},date:{color:'#7b8490'},
  recordTitle:{margin:'5px 0 4px',fontSize:18},recordDescription:{margin:0,color:'#4b5563'},cost:{whiteSpace:'nowrap'},
  recordMeta:{display:'flex',flexWrap:'wrap',gap:8,marginTop:12,color:'#6b7280',fontSize:13},
  deleteButton:{marginTop:12,border:0,background:'transparent',color:'#b42318',padding:0,fontWeight:700,cursor:'pointer'},
  toast:{position:'fixed',left:'50%',bottom:24,transform:'translateX(-50%)',background:'#17202b',color:'#fff',borderRadius:14,padding:'12px 18px',zIndex:100,boxShadow:'0 10px 25px rgba(0,0,0,.2)'},
}
