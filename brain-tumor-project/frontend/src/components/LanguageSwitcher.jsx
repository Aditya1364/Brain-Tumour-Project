import { useState } from 'react'
import { useLang } from '../context/LangContext.jsx'

const C = {
  bgCard:'#0D1128', border:'rgba(0,212,255,0.15)',
  primary:'#00D4FF', text:'#E8EEFF', muted:'#6B7DB3',
}

export default function LanguageSwitcher() {
  const { lang, changeLang, LANGUAGES } = useLang()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  return (
    <div style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:20, border:`1px solid ${C.border}`, background:'transparent', color:C.text, cursor:'pointer', fontSize:12, fontFamily:'Space Grotesk,sans-serif' }}>
        <span style={{ fontSize:14 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ fontSize:10, color:C.muted }}>{open?'▲':'▼'}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }}/>

          {/* Dropdown */}
          <div style={{ position:'absolute', right:0, top:38, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:6, zIndex:100, minWidth:140, boxShadow:'0 8px 32px #00000066' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { changeLang(l.code); setOpen(false) }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, border:'none', background: lang===l.code?`rgba(0,212,255,0.1)`:'transparent', color: lang===l.code?C.primary:C.text, cursor:'pointer', fontSize:13, fontFamily:'Space Grotesk,sans-serif', textAlign:'left' }}>
                <span style={{ fontSize:16 }}>{l.flag}</span>
                <span>{l.label}</span>
                {lang===l.code && <span style={{ marginLeft:'auto', fontSize:10, color:C.primary }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
