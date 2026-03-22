import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const C = { primary:'#00D4FF', secondary:'#7B2FFF', success:'#00FF94', warning:'#FFB800', danger:'#FF4757', bg2:'#111835', bgDark:'#020510', border:'rgba(0,212,255,0.15)', text:'#E8EEFF', muted:'#6B7DB3' }

const statusColor = s => s==='Malignant'?C.danger:s==='Benign'?C.warning:s==='Pituitary'?C.primary:C.success

export default function MRIView3D() {
  const [rotation, setRotation]     = useState(0)
  const [slice, setSlice]           = useState(50)
  const [opacity, setOpacity]       = useState(80)
  const [threshold, setThreshold]   = useState(60)
  const [mode, setMode]             = useState('Volume')
  const [autoRotate, setAutoRotate] = useState(true)
  const [scans, setScans]           = useState([])
  const [selected, setSelected]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const animRef = useRef(null)

  // Load scans from backend
  useEffect(() => {
    axios.get('/api/scans').then(r => {
      const analyzed = r.data.filter(s => s.analyzed)
      setScans(analyzed)
      if (analyzed.length > 0) setSelected(analyzed[0])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (autoRotate) {
      animRef.current = setInterval(() => setRotation(r => (r + 0.4) % 360), 30)
    } else clearInterval(animRef.current)
    return () => clearInterval(animRef.current)
  }, [autoRotate])

  const sliceGrid = Array.from({ length: 9 }, (_, i) => i)
  const scan = selected

  // Parse probabilities safely
  const getProbs = () => {
    if (!scan) return []
    try {
      const p = typeof scan.probabilities === 'string' ? JSON.parse(scan.probabilities) : scan.probabilities
      return Array.isArray(p) ? p : []
    } catch { return [] }
  }

  return (
    <div className="fade-in" style={{ padding:24 }}>
      <p style={{ fontSize:12, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Visualization Suite</p>
      <h1 style={{ fontSize:22, fontFamily:'Orbitron,sans-serif', color:C.text, marginBottom:16 }}>3D MRI Viewer</h1>

      {/* Scan selector */}
      {!loading && scans.length > 0 && (
        <div style={{ marginBottom:16, display:'flex', gap:8, flexWrap:'wrap' }}>
          {scans.map(s => (
            <button key={s.id} onClick={() => setSelected(s)}
              style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${selected?.id===s.id?statusColor(s.status):C.border}`, background:selected?.id===s.id?`${statusColor(s.status)}18`:'transparent', color:selected?.id===s.id?statusColor(s.status):C.muted, cursor:'pointer', fontSize:11, transition:'all .2s' }}>
              Scan #{s.id} — {s.status || 'Pending'}
            </button>
          ))}
        </div>
      )}

      {!loading && scans.length === 0 && (
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:32, textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:40, opacity:0.3, marginBottom:10 }}>◉</div>
          <p style={{ color:C.muted, fontSize:13 }}>No analyzed scans yet.</p>
          <p style={{ color:C.muted, fontSize:12, marginTop:4 }}>Go to <strong style={{color:C.primary}}>MRI Scan</strong> page, upload an image and run analysis first.</p>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:16 }}>
        {/* Main 3D viewer */}
        <div style={{ background:C.bgDark, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', top:12, left:12, display:'flex', gap:6, zIndex:2 }}>
            {['Volume','Slice','Heatmap','Wireframe'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${mode===m?C.primary:C.border}`, background:mode===m?`${C.primary}22`:'rgba(8,11,26,0.8)', color:mode===m?C.primary:C.muted, cursor:'pointer', fontSize:10 }}>
                {m}
              </button>
            ))}
          </div>

          {/* Show real heatmap if available in Heatmap mode */}
          {mode==='Heatmap' && scan?.heatmap_path ? (
            <div style={{ padding:48, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <p style={{ fontSize:11, color:C.muted }}>Grad-CAM Activation Map — Scan #{scan.id}</p>
              <img
                src={`/uploads/${scan.heatmap_path.split(/[\\/]/).pop()}`}
                alt="Grad-CAM heatmap"
                style={{ width:'100%', maxWidth:400, borderRadius:12, border:`1px solid ${C.border}` }}
                onError={e => { e.target.style.display='none' }}
              />
            </div>
          ) : (
            <svg viewBox="0 0 560 420" width="100%" style={{ display:'block' }}>
              <defs>
                <radialGradient id="brainVol" cx="50%" cy="50%"><stop offset="0%" stopColor="#1e3a6e"/><stop offset="60%" stopColor="#0d1f3c"/><stop offset="100%" stopColor="#020510"/></radialGradient>
                <radialGradient id="tumorGlow" cx="50%" cy="50%"><stop offset="0%" stopColor="#FF4757" stopOpacity="0.9"/><stop offset="100%" stopColor="#FF4757" stopOpacity="0.1"/></radialGradient>
              </defs>
              {Array.from({length:14},(_,i)=><line key={`h${i}`} x1="0" y1={i*32} x2="560" y2={i*32} stroke="#00D4FF06" strokeWidth="0.5"/>)}
              {Array.from({length:18},(_,i)=><line key={`v${i}`} x1={i*32} y1="0" x2={i*32} y2="420" stroke="#00D4FF06" strokeWidth="0.5"/>)}
              {[0,0.12,0.24,0.36,0.48,0.6,0.72,0.84].map((phase,i) => {
                const ang = ((rotation + phase*360)*Math.PI)/180
                const rx = 145 + Math.cos(ang)*40
                const ox = Math.sin(ang)*35
                return <ellipse key={i} cx={280+ox} cy={210} rx={rx} ry={115} fill="none" stroke={`hsl(${210+i*6},70%,${28+i*4}%)`} strokeWidth={i===4?1.5:0.5} opacity={0.55-i*0.04}/>
              })}
              <ellipse cx="280" cy="210" rx="145" ry="115" fill="url(#brainVol)" stroke="#00D4FF33" strokeWidth="1"/>
              <ellipse cx="280" cy="210" rx="60" ry="48" fill="none" stroke="#00D4FF15" strokeWidth="0.8" strokeDasharray="4 3"/>
              <path d="M280 100 Q283 210 280 320" fill="none" stroke="#00D4FF22" strokeWidth="0.8" strokeDasharray="5 4"/>
              {mode==='Heatmap' && <>
                <ellipse cx="335" cy="180" rx="55" ry="48" fill={`${C.danger}14`}/>
                <ellipse cx="335" cy="180" rx="38" ry="34" fill={`${C.danger}28`}/>
                <ellipse cx="335" cy="180" rx="22" ry="20" fill="url(#tumorGlow)"/>
              </>}
              {mode==='Wireframe' && <>
                {Array.from({length:6},(_,i)=><ellipse key={i} cx="280" cy="210" rx={145-i*20} ry={115-i*16} fill="none" stroke={`${C.primary}15`} strokeWidth="0.5"/>)}
              </>}
              {mode==='Slice' && (
                <line x1="135" y1={95+(slice/100)*230} x2="425" y2={95+(slice/100)*230} stroke={C.primary} strokeWidth="2" strokeOpacity="0.8" strokeDasharray="8 4"/>
              )}
              {scan && scan.status !== 'Normal' && (
                <>
                  <ellipse cx="345" cy="178" rx="26" ry="22" fill={`${statusColor(scan.status)}40`} stroke={statusColor(scan.status)} strokeWidth="1.5" strokeDasharray="3 2" className="pulse-dot"/>
                  <line x1="371" y1="170" x2="408" y2="155" stroke={statusColor(scan.status)} strokeWidth="0.8"/>
                  <text x="413" y="153" fontSize="9" fill={statusColor(scan.status)} fontFamily="Space Grotesk,sans-serif">{scan.tumor_type || scan.status}</text>
                  <text x="413" y="164" fontSize="8" fill={C.muted} fontFamily="Space Grotesk,sans-serif">{scan.tumor_grade ? `Grade ${scan.tumor_grade}` : ''}</text>
                </>
              )}
              <text x="140" y="115" fontSize="9" fill={C.muted} fontFamily="Space Grotesk,sans-serif">Coronal</text>
              <text x="258" y="342" fontSize="9" fill={C.muted} fontFamily="Space Grotesk,sans-serif">Axial</text>
              <rect x="0" y="400" width="560" height="20" fill="#0D1128"/>
              <text x="12" y="413" fontSize="8" fill={C.muted} fontFamily="Orbitron,sans-serif">
                {scan ? `Scan #${scan.id} · ${scan.mri_type||'MRI'} · ${scan.status||'Pending'}` : 'No scan selected'}
              </text>
              <text x="490" y="413" fontSize="8" fill={C.primary} fontFamily="Orbitron,sans-serif">{Math.round(rotation)}°</text>
            </svg>
          )}

          <div style={{ padding:'8px 16px 12px', background:'#0D1128', display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={() => setAutoRotate(!autoRotate)}
              style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${autoRotate?C.primary:C.border}`, background:autoRotate?`${C.primary}18`:'transparent', color:autoRotate?C.primary:C.muted, cursor:'pointer', fontSize:10, whiteSpace:'nowrap' }}>
              {autoRotate ? '⏸ Pause' : '▶ Rotate'}
            </button>
            <input type="range" min="0" max="360" value={rotation} onChange={e => { setAutoRotate(false); setRotation(+e.target.value) }} style={{ flex:1 }}/>
            <span style={{ fontSize:10, color:C.muted, minWidth:30 }}>{Math.round(rotation)}°</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Slice grid */}
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
            <p style={{ fontSize:11, color:C.muted, marginBottom:10 }}>Slice Series</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
              {sliceGrid.map(i => (
                <div key={i} style={{ aspectRatio:'1', background:C.bgDark, borderRadius:6, border:`1px solid ${i===4?C.primary:C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}>
                  <svg viewBox="0 0 50 50" width="100%">
                    <ellipse cx="25" cy="25" rx="18" ry="15" fill="#0d1f3c" stroke="#00D4FF22" strokeWidth="0.5"/>
                    <ellipse cx="25" cy="25" rx="10" ry="8" fill="none" stroke="#00D4FF11" strokeWidth="0.5"/>
                    {i===4 && scan && scan.status!=='Normal' && <ellipse cx="32" cy="22" rx="6" ry="5" fill={`${statusColor(scan?.status)}66`} stroke={statusColor(scan?.status)} strokeWidth="0.8"/>}
                  </svg>
                  <span style={{ position:'absolute', bottom:1, fontSize:7, color:i===4?C.primary:C.muted, fontFamily:'Orbitron,sans-serif' }}>S{(i+1)*22}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Render controls */}
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
            <p style={{ fontSize:11, color:C.muted, marginBottom:12 }}>Render Settings</p>
            {[['Opacity',opacity,setOpacity,'%'],['Slice Z',slice,setSlice,'mm'],['Threshold',threshold,setThreshold,'HU']].map(([label,val,fn,unit])=>(
              <div key={label} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                  <span style={{ color:C.muted }}>{label}</span><span style={{ color:C.primary }}>{val}{unit}</span>
                </div>
                <input type="range" min="0" max="100" value={val} onChange={e => fn(+e.target.value)} style={{ width:'100%' }}/>
              </div>
            ))}
          </div>

          {/* Scan details from backend */}
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
            <p style={{ fontSize:11, color:C.muted, marginBottom:10 }}>Scan Details</p>
            {scan ? (
              <>
                {[
                  ['Status',    scan.status,                    statusColor(scan.status)],
                  ['Type',      scan.tumor_type||'—',           C.text],
                  ['Grade',     scan.tumor_grade||'—',          C.text],
                  ['Location',  scan.tumor_location||'—',       C.text],
                  ['Confidence',scan.confidence?`${scan.confidence}%`:'—', C.primary],
                  ['Tumor Vol', scan.tumor_volume?`${scan.tumor_volume} cm³`:'—', C.danger],
                  ['Edema Vol', scan.edema_volume?`${scan.edema_volume} cm³`:'—', C.warning],
                ].map(([k,v,col])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'5px 0', borderBottom:`1px solid ${C.border}22` }}>
                    <span style={{ color:C.muted }}>{k}</span>
                    <span style={{ color:col, fontWeight:500 }}>{v}</span>
                  </div>
                ))}
                {/* Class probabilities mini bars */}
                {getProbs().length > 0 && (
                  <div style={{ marginTop:10 }}>
                    <p style={{ fontSize:10, color:C.muted, marginBottom:6 }}>Probabilities</p>
                    {getProbs().map(([label,val,col])=>(
                      <div key={label} style={{ marginBottom:5 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:2 }}>
                          <span style={{ color:C.muted }}>{label}</span>
                          <span style={{ color:col }}>{typeof val==='number'?val.toFixed(1):val}%</span>
                        </div>
                        <div style={{ height:3, background:'#1a2040', borderRadius:2 }}>
                          <div style={{ width:`${Math.min(val,100)}%`, height:'100%', borderRadius:2, background:col }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize:11, color:C.muted }}>No scan selected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}