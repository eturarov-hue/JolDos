'use client'
import { useEffect, useState } from 'react'
export type Lang='kk'|'ru'|'en'
export const languageNames:Record<Lang,string>={kk:'Қазақша',ru:'Русский',en:'English'}
export const languageCodes:Record<Lang,string>={kk:'ҚАЗ',ru:'РУС',en:'EN'}
export function useLanguage(){
  const [lang,setLangState]=useState<Lang>('ru')
  useEffect(()=>{const saved=localStorage.getItem('joldos-lang') as Lang|null;if(saved&&['kk','ru','en'].includes(saved))setLangState(saved)},[])
  const setLang=(v:Lang)=>{setLangState(v);localStorage.setItem('joldos-lang',v)}
  return {lang,setLang}
}
export const dict={
  portal:{
    title:{ru:'Выберите приложение',kk:'Қолданбаны таңдаңыз',en:'Choose an app'},
    subtitle:{ru:'Единая платформа помощи на дороге',kk:'Жолдағы көмекке арналған бірыңғай платформа',en:'One platform for roadside assistance'},
    client:{ru:'Водитель',kk:'Жүргізуші',en:'Driver'},
    clientDesc:{ru:'Вызвать помощь и отслеживать мастера',kk:'Көмек шақырып, шебердің қозғалысын бақылау',en:'Request help and track the specialist'},
    master:{ru:'Мастер',kk:'Шебер',en:'Specialist'},
    masterDesc:{ru:'Принимать заявки и вести заказ до завершения',kk:'Өтінімдерді қабылдап, тапсырысты аяқталғанға дейін жүргізу',en:'Accept jobs and manage them through completion'},
    partner:{ru:'СТО',kk:'Автосервис',en:'Service center'},
    partnerDesc:{ru:'Управлять заказами, командой и услугами',kk:'Тапсырыстарды, қызметкерлерді және қызметтерді басқару',en:'Manage orders, team and services'},
    hint:{ru:'Откройте роли в разных вкладках или на разных устройствах.',kk:'Рөлдерді әртүрлі қойындыларда немесе құрылғыларда ашыңыз.',en:'Open roles in separate tabs or devices.'}
  }
} as const
export function tr<T extends Record<Lang,string>>(value:T,lang:Lang){return value[lang]}
