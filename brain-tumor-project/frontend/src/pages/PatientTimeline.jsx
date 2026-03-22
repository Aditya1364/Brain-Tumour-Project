import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const C = {
  primary:'#00D4FF', secondary:'#7B2FFF', success:'#00FF94',
  warning:'#FFB800', danger:'#FF4757', bg:'#080B1A',
  bgCard:'#0D1128', bg2:'#111835', border:'rgba(0,212,255,0.15)',
  text:'#E8EEFF', muted:'#6B7DB3',
}
const statusColor = s =>
  s==='Malignant'?C.danger:s==='Benign'?C.warning:s==='Pituitary'?C.primary:C.success

const statusIcon = s =>
  s==='Malignant'?'⚠':s==='Benign'?'◐':s==='Pituitary'?'◉':'✓'

export default function PatientTimeline() {
  const { id } = useParams()
  const nav    = useNavigate()
  const [patient, setPatient] = useState(null)
  const [scans,   setScans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('All')

  useEffect(() => {
    const isNum = /^\d+$/.test(id)
    const pFetch = isNum
      ? axios.get(`/api/patients/${id}`)
      : axios.get(`/api/patients?search=${id}`)

    pFetch.then(r => {
      const p = Array.isArray(r.data) ? r.data[0] : r.data
      if (!p) return
      setPatient(p)
      return axios.get(`/api/scans?patient_id=${p.id}&limit=100`)
    }).then(r => {
      if (r) setScans(r.data.sort((a,b) => new Date(a.created_at) - new Date(b.created_at)))
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [id])

  const filtered = filter === 'All' ? scans : scans.filter(s => s.status === filter)

  // Compute trend
  const trend = () => {
    const analyzed = scans.filter(s => s.analyzed && s.confidence)
    if (analyzed.length < 2) return null
    const first = analyzed[0].confidence
    const last  = analyzed[analyzed.length-1].confidence
    const firstStatus = analyzed[0].status
    const lastStatus  = analyzed[analyzed.length-1].status
    return { improving: lastStatus === 'Normal' && firstStatus !== 'Normal', first, last, count: analyzed.length }
  }
  const t = trend()

  if (loading) return <div style={{ padding:24, color:C.muted }}>Loading timeline…</div>
  if (!patient) return (
    <div style={{ padding:24 }}>
      <button onClick={() => nav(-1)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:20, padding:'6px 14px', color:C.muted, cursor:'pointer', fontSize:12, marginBottom:20 }}>← Back</button>
      <p style={{ color:C.danger }}>Patient not found.</p>
    </div>
  )

  return (
    <div className="fade-in" style={{ padding:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={() => nav(-1)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:20, padding:'6px 14px', color:C.muted, cursor:'pointer', fontSize:12 }}>← Back</button>
        <span style={{ color:C.muted, fontSize:12 }}>Patient Timeline</span>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <p style={{ fontSize:11, color:C.primary, fontFamily:'Orbitron,sans-serif', marginBottom:4 }}>{patient.patient_code}</p>
          <h1 style={{ fontSize:22, fontFamily:'Orbitron,sans-serif', color:C.text, marginBottom:4 }}>{patient.name}</h1>
          <p style={{ fontSize:13, color:C.muted }}>{patient.age ? `${patient.age} years` : '—'} · {patient.gender || '—'} · {scans.length} scan{scans.length!==1?'s':''}</p>
        </div>
        {t && (
          <div style={{ background: t.improving?`${C.success}11`:`${C.warning}11`, border:`1px solid ${t.improving?C.success:C.warning}44`, borderRadius:12, padding:'12px 18px', textAlign:'right' }}>
            <p style={{ fontSize:11, color:t.improving?C.success:C.warning, marginBottom:4 }}>
              {t.improving ? '↑ Improvement detected' : '→ Monitoring ongoing'}
            </p>
            <p style={{ fontSize:12, color:C.muted }}>{t.count} scans tracked</p>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          ['Total Scans',   scans.length,                                     C.primary],
          ['Malignant',     scans.filter(s=>s.status==='Malignant').length,   C.danger ],
          ['Benign',        scans.filter(s=>s.status==='Benign').length,      C.warning],
          ['Normal',        scans.filter(s=>s.status==='Normal').length,      C.success],
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:C.bg2, borderRadius:12, border:`1px solid ${C.border}`, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:2, background:c }}/>
            <p style={{ fontSize:10, color:C.muted, marginBottom:6 }}>{l}</p>
            <p style={{ fontSize:24, fontFamily:'Orbitron,sans-serif', color:c, fontWeight:700 }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Confidence trend chart */}
      {scans.filter(s=>s.confidence).length > 1 && (
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:24 }}>
          <p style={{ fontSize:13, color:C.text, fontWeight:600, marginBottom:16 }}>Confidence Score Trend</p>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:80, marginBottom:8 }}>
            {scans.filter(s=>s.confidence).map((s,i) => (
              <div key={s.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:9, color:statusColor(s.status) }}>{s.confidence?.toFixed(0)}%</span>
                <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:statusColor(s.status), opacity:0.8,
                  height:`${s.confidence}%`, minHeight:4, transition:'height .5s' }}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.muted }}>
            <span>First scan: {scans[0]?.created_at?.slice(0,10)}</span>
            <span>Latest: {scans[scans.length-1]?.created_at?.slice(0,10)}</span>
          </div>
        </div>
      )}

      {/* Filter buttons */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['All','Malignant','Benign','Normal','Pituitary'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'6px 16px', borderRadius:20, border:`1px solid ${filter===f?C.primary:C.border}`, background:filter===f?`${C.primary}18`:'transparent', color:filter===f?C.primary:C.muted, cursor:'pointer', fontSize:12, transition:'all .2s' }}>
            {f} {f!=='All'&&<span style={{ opacity:0.6 }}>({scans.filter(s=>s.status===f).length})</span>}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
          <div style={{ fontSize:40, opacity:0.2, marginBottom:10 }}>◈</div>
          <p>No scans found for this filter.</p>
        </div>
      ) : (
        <div style={{ position:'relative' }}>
          {/* Vertical line */}
          <div style={{ position:'absolute', left:27, top:0, bottom:0, width:2, background:`linear-gradient(180deg,${C.primary}44,${C.secondary}22)` }}/>

          {filtered.map((scan, idx) => (
            <div key={scan.id} className="fade-in" style={{ display:'flex', gap:20, marginBottom:28, position:'relative' }}>
              {/* Timeline dot */}
              <div style={{ width:56, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:scan.analyzed?statusColor(scan.status)+'22':'#1a2040', border:`2px solid ${scan.analyzed?statusColor(scan.status):C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:scan.analyzed?statusColor(scan.status):C.muted, zIndex:1, flexShrink:0 }}>
                  {scan.analyzed ? statusIcon(scan.status) : '○'}
                </div>
                <span style={{ fontSize:9, color:C.muted, marginTop:4, textAlign:'center', lineHeight:1.3 }}>
                  {scan.created_at?.slice(0,10)}
                </span>
              </div>

              {/* Scan card */}
              <div style={{ flex:1, background:C.bgCard, border:`1px solid ${scan.analyzed?statusColor(scan.status)+'33':C.border}`, borderRadius:14, padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <span style={{ fontSize:10, fontFamily:'Orbitron,sans-serif', color:C.primary }}>Scan #{scan.id}</span>
                    <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>{scan.mri_type || 'MRI'}</span>
                    {idx === filtered.length-1 && (
                      <span style={{ marginLeft:8, padding:'1px 8px', borderRadius:10, fontSize:9, background:`${C.primary}22`, color:C.primary }}>Latest</span>
                    )}
                  </div>
                  {scan.analyzed && (
                    <span style={{ padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:600, background:`${statusColor(scan.status)}18`, color:statusColor(scan.status) }}>
                      {scan.status}
                    </span>
                  )}
                </div>

                {scan.analyzed ? (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      ['Tumor Type',   scan.tumor_type     || '—'],
                      ['WHO Grade',    scan.tumor_grade    || '—'],
                      ['Location',     scan.tumor_location || '—'],
                      ['Size',         scan.tumor_size     || '—'],
                      ['Confidence',   scan.confidence ? `${scan.confidence}%` : '—'],
                      ['Enhancement',  scan.enhancement    || '—'],
                    ].map(([k,v]) => (
                      <div key={k}>
                        <p style={{ fontSize:10, color:C.muted, marginBottom:1 }}>{k}</p>
                        <p style={{ fontSize:12, color:C.text }}>{v}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize:12, color:C.muted }}>Scan uploaded — analysis pending</p>
                )}

                {scan.recommendation && (
                  <div style={{ marginTop:12, padding:'8px 12px', background:`${C.warning}0d`, borderRadius:8, border:`1px solid ${C.warning}22` }}>
                    <p style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>{scan.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
