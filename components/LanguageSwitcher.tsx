'use client'
import type {Lang} from '@/lib/i18n'
import {languageCodes,languageNames} from '@/lib/i18n'
export function LanguageSwitcher({lang,onChange,compact=false}:{lang:Lang;onChange:(l:Lang)=>void;compact?:boolean}){
 return <div className={`language-switcher ${compact?'compact':''}`}>{(['kk','ru','en'] as Lang[]).map(l=><button type="button" key={l} className={lang===l?'active':''} onClick={()=>onChange(l)}>{compact?languageCodes[l]:languageNames[l]}</button>)}</div>
}
