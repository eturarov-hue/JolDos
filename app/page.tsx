'use client'
import Link from 'next/link'
import {LanguageSwitcher} from '@/components/LanguageSwitcher'
import {dict,tr,useLanguage} from '@/lib/i18n'
export default function Portal(){
 const {lang,setLang}=useLanguage(); const p=dict.portal
 return <main className="portal-shell"><div className="portal-card"><LanguageSwitcher lang={lang} onChange={setLang}/><img src="/joldos-logo.png" alt="JolDos"/><p>{tr(p.subtitle,lang)}</p><h1>{tr(p.title,lang)}</h1><div className="portal-grid three"><Link href="/client"><b>🚗 {tr(p.client,lang)}</b><span>{tr(p.clientDesc,lang)}</span></Link><Link href="/master"><b>🧰 {tr(p.master,lang)}</b><span>{tr(p.masterDesc,lang)}</span></Link><Link href="/partner"><b>🏢 {tr(p.partner,lang)}</b><span>{tr(p.partnerDesc,lang)}</span></Link></div><small>{tr(p.hint,lang)}</small></div></main>
}
