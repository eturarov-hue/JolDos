'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Lang = 'ru' | 'kk' | 'en'

type CarProfile = {
  make: string
  model: string
  year: string
  plate: string
  vin: string
  mileage: string
  engine: string
  transmission: string
  fuel: string
}

type ServiceRecord = {
  id: string
  date: string
  mileage: string
  category: string
  description: string
  cost: string
  notes: string
}

const CAR_KEY = 'joldos-car-profile-v1'
const HISTORY_KEY = 'joldos-car-history-v1'

const emptyCar:CarProfile = {
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
  const [car,setCar]=useState<CarProfile>(emptyCar)
  const [records,setRecords]=useState<ServiceRecord[]>([])
  const [editing,setEditing]=useState(true)
  const [showRecordForm,setShowRecordForm]=useState(false)
  const [record,setRecord]=useState(emptyRecord)
  const [message,setMessage]=useState('')

  const t={
    ru:{
      title:'Мой автомобиль',
      subtitle:'Цифровая история автомобиля',
      back:'Назад',
      edit:'Редактировать',
      save:'Сохранить автомобиль',
      add:'Добавить обслуживание',
      history:'История обслуживания',
      empty:'История пока пуста',
      emptyDesc:'Добавьте первую запись об обслуживании или ремонте.',
      make:'Марка',
      model:'Модель',
      year:'Год',
      plate:'Госномер',
      vin:'VIN (необязательно)',
      mileage:'Пробег, км',
      engine:'Двигатель',
      transmission:'Коробка',
      fuel:'Топливо',
      date:'Дата',
      category:'Категория',
      description:'Что сделали',
      cost:'Стоимость, ₸',
      notes:'Комментарий',
      cancel:'Отмена',
      saveRecord:'Сохранить запись',
      saved:'Автомобиль сохранён',
      recordSaved:'Запись добавлена',
      required:'Заполните марку, модель и год',
      recordRequired:'Укажите дату и выполненную работу',
      total:'Всего расходов',
      delete:'Удалить',
    },
    kk:{
      title:'Менің көлігім',
      subtitle:'Көліктің цифрлық тарихы',
      back:'Артқа',
      edit:'Өзгерту',
      save:'Көлікті сақтау',
      add:'Қызмет көрсетуді қосу',
      history:'Қызмет көрсету тарихы',
      empty:'Тарих әзірге бос',
      emptyDesc:'Алғашқы қызмет көрсету немесе жөндеу жазбасын қосыңыз.',
      make:'Марка',
      model:'Модель',
      year:'Жыл',
      plate:'Мемлекеттік нөмір',
      vin:'VIN (міндетті емес)',
      mileage:'Жүріс, км',
      engine:'Қозғалтқыш',
      transmission:'Беріліс қорабы',
      fuel:'Отын',
      date:'Күні',
      category:'Санат',
      description:'Не жасалды',
      cost:'Құны, ₸',
      notes:'Түсініктеме',
      cancel:'Бас тарту',
      saveRecord:'Жазбаны сақтау',
      saved:'Көлік сақталды',
      recordSaved:'Жазба қосылды',
      required:'Марка, модель және жылды толтырыңыз',
      recordRequired:'Күні мен орындалған жұмысты көрсетіңіз',
      total:'Жалпы шығын',
      delete:'Жою',
    },
    en:{
      title:'My vehicle',
      subtitle:'Digital vehicle history',
      back:'Back',
      edit:'Edit',
      save:'Save vehicle',
      add:'Add service record',
      history:'Service history',
      empty:'History is empty',
      emptyDesc:'Add the first maintenance or repair record.',
      make:'Make',
      model:'Model',
      year:'Year',
      plate:'License plate',
      vin:'VIN (optional)',
      mileage:'Mileage, km',
      engine:'Engine',
      transmission:'Transmission',
      fuel:'Fuel',
      date:'Date',
      category:'Category',
      description:'Work performed',
      cost:'Cost, ₸',
      notes:'Notes',
      cancel:'Cancel',
      saveRecord:'Save record',
      saved:'Vehicle saved',
      recordSaved:'Record added',
      required:'Enter make, model, and year',
      recordRequired:'Enter date and work performed',
      total:'Total expenses',
      delete:'Delete',
    },
  } as const

  const tx=t[lang]

  useEffect(()=>{
    try{
      const savedCar=localStorage.getItem(CAR_KEY)
      const savedHistory=localStorage.getItem(HISTORY_KEY)

      if(savedCar){
        const parsed=JSON.parse(savedCar) as CarProfile
        setCar(parsed)
        setEditing(false)
      }

      if(savedHistory){
        setRecords(JSON.parse(savedHistory) as ServiceRecord[])
      }
    }catch{}
  },[])

  function notify(text:string){
    setMessage(text)
    window.setTimeout(()=>setMessage(''),2200)
  }

  function saveCar(event:FormEvent){
    event.preventDefault()

    if(!car.make.trim()||!car.model.trim()||!car.year.trim()){
      notify(tx.required)
      return
    }

    localStorage.setItem(CAR_KEY,JSON.stringify(car))
    setEditing(false)
    notify(tx.saved)
  }

  function addRecord(event:FormEvent){
    event.preventDefault()

    if(!record.date||!record.description.trim()){
      notify(tx.recordRequired)
      return
    }

    const item:ServiceRecord={
      id:crypto.randomUUID(),
      ...record,
    }

    const next=[item,...records]
    setRecords(next)
    localStorage.setItem(HISTORY_KEY,JSON.stringify(next))
    setRecord(emptyRecord)
    setShowRecordForm(false)
    notify(tx.recordSaved)
  }

  function deleteRecord(id:string){
    const next=records.filter(item=>item.id!==id)
    setRecords(next)
    localStorage.setItem(HISTORY_KEY,JSON.stringify(next))
  }

  const total=useMemo(
    ()=>records.reduce((sum,item)=>sum+(Number(item.cost)||0),0),
    [records],
  )

  const carTitle=[car.make,car.model].filter(Boolean).join(' ')||tx.title

  return <main style={styles.page}>
    <section style={styles.phone}>
      <header style={styles.header}>
        <Link href="/client" style={styles.back}>←</Link>
        <div style={{flex:1}}>
          <h1 style={styles.h1}>{tx.title}</h1>
          <p style={styles.subtitle}>{tx.subtitle}</p>
        </div>
        <select
          value={lang}
          onChange={event=>setLang(event.target.value as Lang)}
          style={styles.language}
          aria-label="Language"
        >
          <option value="ru">RU</option>
          <option value="kk">KZ</option>
          <option value="en">EN</option>
        </select>
      </header>

      {!editing&&(
        <section style={styles.hero}>
          <div>
            <small style={styles.heroLabel}>{tx.title}</small>
            <h2 style={styles.heroTitle}>{carTitle}</h2>
            <p style={styles.heroMeta}>
              {[car.year,car.engine,car.transmission].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button type="button" onClick={()=>setEditing(true)} style={styles.secondaryButton}>
            {tx.edit}
          </button>
          <div style={styles.metrics}>
            <div style={styles.metric}>
              <small>{tx.mileage}</small>
              <b>{car.mileage?`${Number(car.mileage).toLocaleString('ru-RU')} км`:'—'}</b>
            </div>
            <div style={styles.metric}>
              <small>{tx.plate}</small>
              <b>{car.plate||'—'}</b>
            </div>
          </div>
        </section>
      )}

      {editing&&(
        <form onSubmit={saveCar} style={styles.card}>
          <div style={styles.grid}>
            <Field label={tx.make} value={car.make} onChange={value=>setCar({...car,make:value})}/>
            <Field label={tx.model} value={car.model} onChange={value=>setCar({...car,model:value})}/>
            <Field label={tx.year} value={car.year} onChange={value=>setCar({...car,year:value})} type="number"/>
            <Field label={tx.plate} value={car.plate} onChange={value=>setCar({...car,plate:value})}/>
            <Field label={tx.vin} value={car.vin} onChange={value=>setCar({...car,vin:value})}/>
            <Field label={tx.mileage} value={car.mileage} onChange={value=>setCar({...car,mileage:value})} type="number"/>
            <Field label={tx.engine} value={car.engine} onChange={value=>setCar({...car,engine:value})}/>
            <Field label={tx.transmission} value={car.transmission} onChange={value=>setCar({...car,transmission:value})}/>
            <Field label={tx.fuel} value={car.fuel} onChange={value=>setCar({...car,fuel:value})}/>
          </div>
          <button type="submit" style={styles.primaryButton}>{tx.save}</button>
        </form>
      )}

      {!editing&&(
        <>
          <div style={styles.sectionHead}>
            <div>
              <h2 style={styles.sectionTitle}>{tx.history}</h2>
              <p style={styles.subtitle}>{tx.total}: {total.toLocaleString('ru-RU')} ₸</p>
            </div>
            <button type="button" onClick={()=>setShowRecordForm(true)} style={styles.primarySmall}>
              + {tx.add}
            </button>
          </div>

          {showRecordForm&&(
            <form onSubmit={addRecord} style={styles.card}>
              <div style={styles.grid}>
                <Field label={tx.date} value={record.date} onChange={value=>setRecord({...record,date:value})} type="date"/>
                <label style={styles.field}>
                  <span style={styles.label}>{tx.category}</span>
                  <select
                    value={record.category}
                    onChange={event=>setRecord({...record,category:event.target.value})}
                    style={styles.input}
                  >
                    <option>Замена масла</option>
                    <option>Фильтры</option>
                    <option>Тормоза</option>
                    <option>Ходовая</option>
                    <option>Электрика</option>
                    <option>Шины</option>
                    <option>Аккумулятор</option>
                    <option>Ремонт</option>
                    <option>Другое</option>
                  </select>
                </label>
                <Field label={tx.mileage} value={record.mileage} onChange={value=>setRecord({...record,mileage:value})} type="number"/>
                <Field label={tx.cost} value={record.cost} onChange={value=>setRecord({...record,cost:value})} type="number"/>
              </div>
              <Field label={tx.description} value={record.description} onChange={value=>setRecord({...record,description:value})}/>
              <Field label={tx.notes} value={record.notes} onChange={value=>setRecord({...record,notes:value})}/>
              <div style={styles.actions}>
                <button type="button" onClick={()=>setShowRecordForm(false)} style={styles.secondaryButton}>
                  {tx.cancel}
                </button>
                <button type="submit" style={styles.primaryButton}>{tx.saveRecord}</button>
              </div>
            </form>
          )}

          {records.length===0?(
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📖</div>
              <h3 style={styles.emptyTitle}>{tx.empty}</h3>
              <p style={styles.subtitle}>{tx.emptyDesc}</p>
            </div>
          ):(
            <div style={styles.list}>
              {records.map(item=>
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
                  <button type="button" onClick={()=>deleteRecord(item.id)} style={styles.deleteButton}>
                    {tx.delete}
                  </button>
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

function Field({
  label,
  value,
  onChange,
  type='text',
}:{
  label:string
  value:string
  onChange:(value:string)=>void
  type?:string
}){
  return <label style={styles.field}>
    <span style={styles.label}>{label}</span>
    <input
      type={type}
      value={value}
      onChange={event=>onChange(event.target.value)}
      style={styles.input}
    />
  </label>
}

const styles:Record<string,React.CSSProperties>={
  page:{
    minHeight:'100vh',
    background:'#eef2f5',
    display:'flex',
    justifyContent:'center',
    padding:'0',
    fontFamily:'Arial, sans-serif',
    color:'#17202b',
  },
  phone:{
    width:'100%',
    maxWidth:480,
    minHeight:'100vh',
    background:'#f8fafb',
    padding:'18px 16px 40px',
    boxSizing:'border-box',
    position:'relative',
  },
  header:{
    display:'flex',
    alignItems:'center',
    gap:12,
    marginBottom:18,
  },
  back:{
    width:42,
    height:42,
    borderRadius:14,
    background:'#fff',
    display:'grid',
    placeItems:'center',
    textDecoration:'none',
    color:'#17202b',
    fontSize:24,
    boxShadow:'0 5px 18px rgba(23,32,43,.08)',
  },
  h1:{margin:0,fontSize:24},
  subtitle:{margin:'4px 0 0',color:'#6b7280',fontSize:14,lineHeight:1.45},
  language:{
    border:'1px solid #d8dee5',
    borderRadius:12,
    padding:'10px 8px',
    background:'#fff',
  },
  hero:{
    background:'linear-gradient(135deg,#17202b,#344150)',
    color:'#fff',
    borderRadius:24,
    padding:20,
    boxShadow:'0 12px 30px rgba(23,32,43,.18)',
    marginBottom:18,
  },
  heroLabel:{opacity:.72},
  heroTitle:{fontSize:26,margin:'6px 0'},
  heroMeta:{margin:0,opacity:.78},
  metrics:{
    display:'grid',
    gridTemplateColumns:'1fr 1fr',
    gap:10,
    marginTop:18,
  },
  metric:{
    background:'rgba(255,255,255,.1)',
    borderRadius:16,
    padding:14,
    display:'flex',
    flexDirection:'column',
    gap:6,
  },
  card:{
    background:'#fff',
    borderRadius:22,
    padding:16,
    boxShadow:'0 8px 24px rgba(23,32,43,.08)',
    marginBottom:18,
  },
  grid:{
    display:'grid',
    gridTemplateColumns:'1fr 1fr',
    gap:12,
  },
  field:{
    display:'flex',
    flexDirection:'column',
    gap:6,
    marginBottom:12,
  },
  label:{fontSize:12,fontWeight:700,color:'#586271'},
  input:{
    width:'100%',
    boxSizing:'border-box',
    border:'1px solid #dbe1e7',
    borderRadius:13,
    padding:'12px 12px',
    fontSize:15,
    background:'#fff',
  },
  primaryButton:{
    width:'100%',
    border:0,
    borderRadius:15,
    padding:'14px 16px',
    fontWeight:800,
    background:'#f4b000',
    color:'#17202b',
    cursor:'pointer',
  },
  primarySmall:{
    border:0,
    borderRadius:13,
    padding:'11px 13px',
    fontWeight:800,
    background:'#f4b000',
    color:'#17202b',
    cursor:'pointer',
  },
  secondaryButton:{
    border:'1px solid #d7dde4',
    borderRadius:13,
    padding:'11px 14px',
    fontWeight:700,
    background:'#fff',
    color:'#17202b',
    cursor:'pointer',
  },
  sectionHead:{
    display:'flex',
    alignItems:'center',
    justifyContent:'space-between',
    gap:12,
    margin:'20px 2px 12px',
  },
  sectionTitle:{margin:0,fontSize:20},
  actions:{display:'flex',gap:10},
  empty:{
    textAlign:'center',
    background:'#fff',
    borderRadius:22,
    padding:'34px 20px',
    boxShadow:'0 8px 24px rgba(23,32,43,.06)',
  },
  emptyIcon:{fontSize:42},
  emptyTitle:{margin:'10px 0 4px'},
  list:{display:'flex',flexDirection:'column',gap:12},
  record:{
    background:'#fff',
    borderRadius:20,
    padding:16,
    boxShadow:'0 8px 24px rgba(23,32,43,.07)',
  },
  recordTop:{display:'flex',justifyContent:'space-between',gap:12},
  date:{color:'#7b8490'},
  recordTitle:{margin:'5px 0 4px',fontSize:18},
  recordDescription:{margin:0,color:'#4b5563'},
  cost:{whiteSpace:'nowrap'},
  recordMeta:{
    display:'flex',
    flexWrap:'wrap',
    gap:8,
    marginTop:12,
    color:'#6b7280',
    fontSize:13,
  },
  deleteButton:{
    marginTop:12,
    border:0,
    background:'transparent',
    color:'#b42318',
    padding:0,
    fontWeight:700,
    cursor:'pointer',
  },
  toast:{
    position:'fixed',
    left:'50%',
    bottom:24,
    transform:'translateX(-50%)',
    background:'#17202b',
    color:'#fff',
    borderRadius:14,
    padding:'12px 18px',
    zIndex:100,
    boxShadow:'0 10px 25px rgba(0,0,0,.2)',
  },
}
