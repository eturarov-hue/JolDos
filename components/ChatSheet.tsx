import type {Lang} from '@/lib/i18n'
const copy={title:{kk:'Шебермен чат',ru:'Чат с мастером',en:'Chat with specialist'},placeholder:{kk:'Хабарлама жазыңыз',ru:'Напишите сообщение',en:'Write a message'},send:{kk:'Жіберу',ru:'Отправить',en:'Send'}} as const
export function ChatSheet({open,masterName,messages,value,onChange,onSend,onClose,lang}:{open:boolean;masterName:string;messages:string[];value:string;onChange:(value:string)=>void;onSend:()=>void;onClose:()=>void;lang:Lang}){
 if(!open)return null
 return <div className="chat-overlay" onClick={onClose}><section className="chat-sheet" onClick={e=>e.stopPropagation()}><header><div><small>{copy.title[lang]}</small><h3>{masterName}</h3></div><button type="button" onClick={onClose}>×</button></header><div className="chat-messages">{messages.map((m,i)=><p key={`${m}-${i}`} className={i===0?'incoming':'outgoing'}>{m}</p>)}</div><footer><input value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')onSend()}} placeholder={copy.placeholder[lang]}/><button type="button" aria-label={copy.send[lang]} onClick={onSend}>➤</button></footer></section></div>
}
