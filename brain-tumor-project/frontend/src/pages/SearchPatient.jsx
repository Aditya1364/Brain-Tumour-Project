import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext.jsx'
import { useColors } from '../context/ThemeContext.jsx'
import axios from 'axios'


const statusColor = s => s==='Malignant'?C.danger:s==='Benign'?C.warning:s==='Pituitary'?C.primary:C.success

export default function SearchPatient() {
  const { t, lang } = useLang()
  const C = useColors()
  const [query,    setQuery]    = useState('')
  const [filter,   setFilter]   = useState('All')
  const [selected, setSelected] = useState(null)
  const [patients, setPatients] = useState([])
  const nav = useNavigate()

  useEffect(() => {
    axios.get('/api/patients').then(r=>setPatients(r.data)).catch(()=>{})
  }, [])

  const filterKeys = ['All','Malignant','Benign','Normal']
  const filterLabels = ['All', t('malignant'), t('benign'), t('normal')]

  const filtered = patients.filter(p =>
    (filter==='All') &&
    [p.name, p.patient_code].some(f => f?.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="fade-in" style={{ padding:'24px 24px 40px' }}>
      <p style={{ fontSize:13, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{t('patientDatabase')}</p>
      <h1 style={{ fontSize:26, fontFamily:'Orbitron,sans-serif', color:C.text, marginBottom:22 }}>{t('searchTitle')}</h1>

      {/* Search + filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:220, position:'relative' }}>
          <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:C.muted, fontSize:16 }}>◎</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('searchPlaceholder')}
            style={{ width:'100%', background:C.bgCard2, border:`1px solid ${C.border}`, borderRadius:30, padding:'12px 18px 12px 42px', color:C.text, fontSize:15, outline:'none' }}/>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {filterLabels.map((f,i)=>(
            <button key={f} onClick={()=>setFilter(filterKeys[i])}
              style={{ padding:'10px 18px', borderRadius:30, border:`1px solid ${filter===filterKeys[i]?C.primary:C.border}`, background:filter===filterKeys[i]?`${C.primary}18`:'transparent', color:filter===filterKeys[i]?C.primary:C.muted, cursor:'pointer', fontSize:14, transition:'all .2s' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 340px':'1fr', gap:16, alignItems:'start' }} className="grid-2-mobile">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.length===0&&(
            <div style={{ textAlign:'center', padding:'52px 0', color:C.muted }}>
              <div style={{ fontSize:46, marginBottom:10, opacity:0.3 }}>◎</div>
              <p style={{ fontSize:16 }}>{t('noResults')}</p>
            </div>
          )}
          {filtered.map(p=>(
            <div key={p.id} onClick={()=>setSelected(selected?.id===p.id?null:p)}
              style={{ background:selected?.id===p.id?`${C.primary}0d`:C.bg2, border:`1px solid ${selected?.id===p.id?C.primary+'55':C.border}`, borderRadius:16, padding:'16px 20px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all .2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:`linear-gradient(135deg,${C.secondary}44,${C.primary}44)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontFamily:'Orbitron,sans-serif', color:C.primary, fontWeight:700, flexShrink:0 }}>
                  {p.name[0]}
                </div>
                <div>
                  <p style={{ fontWeight:600, color:C.text, fontSize:16, marginBottom:4 }}>{p.name}</p>
                  <p style={{ fontSize:13, color:C.muted }}>{p.patient_code} · {p.age?p.age+' '+t('years'):'—'} · {p.gender||'—'}</p>
                </div>
              </div>
              <span style={{ fontSize:20, color:C.muted }}>›</span>
            </div>
          ))}
        </div>

        {selected&&(
          <div className="fade-in" style={{ background:C.bgCard2, border:`1px solid ${C.border}`, borderRadius:18, padding:22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
              <div>
                <p style={{ fontFamily:'Orbitron,sans-serif', color:C.primary, fontSize:12, marginBottom:5 }}>{selected.patient_code}</p>
                <p style={{ color:C.text, fontSize:18, fontWeight:600 }}>{selected.name}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:22, lineHeight:1 }}>×</button>
            </div>
            {[[t('age'),selected.age?selected.age+' '+t('years'):'—'],[t('gender'),selected.gender||'—'],[t('phone'),selected.phone||'—'],[t('email'),selected.email||'—'],[t('referredBy'),selected.referred_by||'—'],[t('priority'),selected.priority||'Normal']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:14, padding:'9px 0', borderBottom:`1px solid ${C.border}22` }}>
                <span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text, fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button onClick={()=>nav(`/patient/${selected.id}`)} style={{ flex:1, padding:12, borderRadius:30, border:`1px solid ${C.primary}`, background:'transparent', color:C.primary, cursor:'pointer', fontSize:14 }}>{t('fullRecord')}</button>
              <button onClick={()=>nav('/mri-scan')} style={{ flex:1, padding:12, borderRadius:30, border:`1px solid ${C.secondary}`, background:'transparent', color:C.secondary, cursor:'pointer', fontSize:14 }}>{t('newScan')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
