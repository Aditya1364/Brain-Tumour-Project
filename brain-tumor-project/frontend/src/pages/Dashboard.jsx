import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext.jsx'
import { useColors } from '../context/ThemeContext.jsx'
import axios from 'axios'

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_HI = ['जन','फर','मार','अप्र','मई','जून','जुल','अग','सित','अक्ट','नव','दिस']
const MONTHS_TA = ['ஜன','பிப','மார்','ஏப்','மே','ஜூன்','ஜூல்','ஆக','செப்','அக்','நவ','டிச']

export default function Dashboard() {
  const { t, lang } = useLang()
  const C = useColors()
  const [stats,    setStats]    = useState({ total:0, malignant:0, benign:0, normal:0, pending:0 })
  const [monthly,  setMonthly]  = useState(Array(12).fill(0))
  const [patients, setPatients] = useState([])
  const [scans,    setScans]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const nav = useNavigate()
  const MONTHS = lang==='hi'?MONTHS_HI:lang==='ta'?MONTHS_TA:MONTHS_EN
  const statusColor = s => s==='Malignant'?C.danger:s==='Benign'?C.warning:s==='Pituitary'?C.primary:C.success

  useEffect(() => {
    Promise.all([
      axios.get('/api/dashboard/stats'),
      axios.get('/api/dashboard/monthly'),
      axios.get('/api/patients?limit=10'),
      axios.get('/api/scans?limit=20'),
    ]).then(([sR,mR,pR,scR]) => {
      setStats(sR.data)
      setMonthly(mR.data.monthly||Array(12).fill(0))
      setPatients(pR.data)
      setScans(scR.data)
    }).catch(console.error).finally(()=>setLoading(false))
  }, [])

  const maxBar     = Math.max(...monthly, 1)
  const rows       = patients.map(p=>({ ...p, scan: scans.filter(s=>s.patient_id===p.id).sort((a,b)=>b.id-a.id)[0] }))
  const donutTotal = (stats.malignant||0)+(stats.benign||0)+(stats.normal||0)||1
  const malPct=stats.malignant/donutTotal, benPct=stats.benign/donutTotal, normPct=stats.normal/donutTotal
  const circ=276.5

  const card = { background:C.bgCard2, borderRadius:16, border:`1px solid ${C.border}`, transition:'background .3s, border-color .3s' }

  return (
    <div className="fade-in" style={{ padding:'24px 24px 32px' }}>
      <p style={{ fontSize:13, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Neural Oncology System</p>
      <h1 style={{ fontSize:26, fontFamily:'Orbitron,sans-serif', color:C.text, fontWeight:700, marginBottom:24 }}>{t('dashboardTitle')}</h1>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }} className="grid-4-mobile">
        {[[t('totalPatients'),stats.total,C.primary],[t('malignant'),stats.malignant,C.danger],[t('benign'),stats.benign,C.warning],[t('normal'),stats.normal,C.success]].map(([label,val,color],i)=>(
          <div key={i} style={{ ...card, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:3, background:color }}/>
            <p style={{ fontSize:13, color:C.muted, letterSpacing:0.5, marginBottom:8 }}>{label}</p>
            <p style={{ fontSize:30, fontWeight:700, fontFamily:'Orbitron,sans-serif', color }}>{loading?'…':val}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, marginBottom:18 }} className="grid-2-mobile">
        <div style={{ ...card, padding:22 }}>
          <p style={{ fontSize:15, color:C.text, fontWeight:600, marginBottom:18 }}>{t('monthlyScans')} — {new Date().getFullYear()}</p>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:140 }}>
            {monthly.map((b,i)=>{
              const h=maxBar>0?Math.max((b/maxBar)*100,b>0?8:0):0
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${h}%`, minHeight:b>0?4:0, background:`linear-gradient(180deg,${C.primary},${C.secondary})`, opacity:i===new Date().getMonth()?1:0.45 }}/>
                  <span style={{ fontSize:10, color:C.muted }}>{MONTHS[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ ...card, padding:22 }}>
          <p style={{ fontSize:15, color:C.text, fontWeight:600, marginBottom:14 }}>{t('classification')}</p>
          <svg viewBox="0 0 120 120" width="130" style={{ display:'block', margin:'0 auto 14px' }}>
            <circle cx="60" cy="60" r="44" fill="none" stroke={C.bgCard} strokeWidth="18"/>
            {stats.total>0&&(<>
              <circle cx="60" cy="60" r="44" fill="none" stroke={C.danger}  strokeWidth="18" strokeDasharray={`${malPct*circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r="44" fill="none" stroke={C.warning} strokeWidth="18" strokeDasharray={`${benPct*circ} ${circ}`} strokeDashoffset={`-${malPct*circ}`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r="44" fill="none" stroke={C.success} strokeWidth="18" strokeDasharray={`${normPct*circ} ${circ}`} strokeDashoffset={`-${(malPct+benPct)*circ}`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
            </>)}
            <text x="60" y="57" textAnchor="middle" fontSize="13" fill={C.text} fontFamily="Orbitron,sans-serif" fontWeight="700">{stats.total}</text>
            <text x="60" y="70" textAnchor="middle" fontSize="8" fill={C.muted}>{t('patients')}</text>
          </svg>
          {[[t('malignant'),(malPct*100).toFixed(1)+'%',C.danger],[t('benign'),(benPct*100).toFixed(1)+'%',C.warning],[t('normal'),(normPct*100).toFixed(1)+'%',C.success]].map(([l,v,co])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:6 }}>
              <span style={{ display:'flex', alignItems:'center', gap:7, color:C.muted }}><span style={{ width:9, height:9, borderRadius:'50%', background:co, display:'inline-block', flexShrink:0 }}/>{l}</span>
              <span style={{ color:co, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Patients table */}
      <div style={{ ...card, padding:22, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontSize:16, color:C.text, fontWeight:600 }}>{t('recentPatients')}</p>
          <button onClick={()=>nav('/search')} style={{ fontSize:13, color:C.primary, background:'none', border:`1px solid ${C.primary}44`, borderRadius:20, padding:'6px 16px', cursor:'pointer' }}>{t('viewAll')}</button>
        </div>
        {loading ? <p style={{ color:C.muted, fontSize:15, textAlign:'center', padding:24 }}>{t('loading')}</p>
        : rows.length===0 ? (
          <div style={{ textAlign:'center', padding:'36px 0', color:C.muted }}>
            <p style={{ fontSize:15 }}>{t('noPatients')}</p>
            <button onClick={()=>nav('/add-patient')} style={{ marginTop:12, padding:'10px 22px', borderRadius:20, border:`1px solid ${C.primary}`, background:'transparent', color:C.primary, cursor:'pointer', fontSize:14 }}>{t('addFirst')}</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
              <thead>
                <tr>{['ID',t('fullName'),t('age'),t('gender'),t('priority'),t('mriScan'),t('malignant').slice(0,6),t('aiConfidence')].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:C.muted, fontWeight:500, borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap', fontSize:13 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.map(p=>(
                  <tr key={p.id} onClick={()=>nav(`/patient/${p.id}`)}
                    style={{ cursor:'pointer', borderBottom:`1px solid ${C.border}`, transition:'background .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${C.primary}08`}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'11px 12px', color:C.primary, fontFamily:'Orbitron,sans-serif', fontSize:11 }}>{p.patient_code}</td>
                    <td style={{ padding:'11px 12px', color:C.text, fontWeight:500 }}>{p.name}</td>
                    <td style={{ padding:'11px 12px', color:C.muted }}>{p.age||'—'}</td>
                    <td style={{ padding:'11px 12px', color:C.muted }}>{p.gender||'—'}</td>
                    <td style={{ padding:'11px 12px' }}>
                      <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, background:p.priority==='Emergency'?`${C.danger}22`:p.priority==='Urgent'?`${C.warning}22`:`${C.success}22`, color:p.priority==='Emergency'?C.danger:p.priority==='Urgent'?C.warning:C.success }}>
                        {p.priority||t('normal')}
                      </span>
                    </td>
                    <td style={{ padding:'11px 12px', color:C.muted, fontSize:13 }}>{p.scan?(p.scan.created_at||'').slice(0,10)||'—':'—'}</td>
                    <td style={{ padding:'11px 12px' }}>
                      {p.scan?.status?<span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:`${statusColor(p.scan.status)}18`, color:statusColor(p.scan.status) }}>{p.scan.status}</span>:<span style={{ color:C.muted }}>—</span>}
                    </td>
                    <td style={{ padding:'11px 12px' }}>
                      {p.scan?.confidence?(
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:60, height:5, borderRadius:3, background:C.bgCard }}>
                            <div style={{ width:`${p.scan.confidence}%`, height:'100%', borderRadius:3, background:p.scan.confidence>90?C.success:C.warning }}/>
                          </div>
                          <span style={{ color:C.text, minWidth:40, fontSize:13 }}>{p.scan.confidence}%</span>
                        </div>
                      ):<span style={{ color:C.muted }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stats.pending>0&&(
        <div style={{ background:`${C.warning}0d`, border:`1px solid ${C.warning}33`, borderRadius:12, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <span style={{ fontSize:15, color:C.warning }}>⚠ {stats.pending} {t('pending')}</span>
          <button onClick={()=>nav('/mri-scan')} style={{ padding:'8px 18px', borderRadius:20, border:`1px solid ${C.warning}`, background:'transparent', color:C.warning, cursor:'pointer', fontSize:14 }}>{t('mriScan')} →</button>
        </div>
      )}
    </div>
  )
}
