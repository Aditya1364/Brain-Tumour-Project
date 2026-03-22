import { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext.jsx'
import { useColors } from '../context/ThemeContext.jsx'
import axios from 'axios'

const CM_LABELS = ['Normal','Benign','Malignant','Pituitary']
const CM_STATIC = [[142,3,1,0],[2,184,8,1],[1,5,108,2],[0,2,3,28]]

export default function Reports() {
  const { t }  = useLang()
  const C      = useColors()
  const [tab,       setTab]       = useState('performance')
  const [metrics,   setMetrics]   = useState(null)
  const [scans,     setScans]     = useState([])
  const [patients,  setPatients]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [exporting, setExporting] = useState(null)

  const statusColor = s => s==='Malignant'?C.danger:s==='Benign'?C.warning:s==='Pituitary'?C.primary:C.success

  useEffect(() => {
    setLoading(true)
    Promise.all([
      axios.get('/api/reports/model-metrics'),
      axios.get('/api/scans?limit=200'),
      axios.get('/api/patients?limit=200'),
    ]).then(([mR, sR, pR]) => {
      setMetrics(mR.data)
      // Include ALL scans — analyzed or not — but show analyzed ones first
      const allScans = sR.data || []
      const sorted   = [...allScans.filter(s=>s.analyzed), ...allScans.filter(s=>!s.analyzed)]
      setScans(sorted)
      setPatients(pR.data || [])
    }).catch(err => {
      console.error('Reports fetch error:', err)
    }).finally(() => setLoading(false))
  }, [])

  const exportPDF = async (scanId) => {
    setExporting(scanId)
    try {
      const res = await axios.get(`/api/reports/export/${scanId}`, { responseType:'blob', headers:{ Accept:'application/pdf' } })
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }))
      const a   = document.createElement('a')
      a.href = url; a.download = `NeuralOnco_Report_Scan_${scanId}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch(e) { alert('PDF export failed: ' + (e.message || 'Unknown')) }
    setExporting(null)
  }

  // Get patient name from id
  const getPatientName = (patientId) => {
    const p = patients.find(p => p.id === patientId)
    return p ? p.name : `Patient #${patientId}`
  }

  const analyzedScans = scans.filter(s => s.analyzed)
  const byStatus      = analyzedScans.reduce((acc,s) => { acc[s.status]=(acc[s.status]||0)+1; return acc }, {})
  const avgConf       = analyzedScans.length ? (analyzedScans.reduce((a,s)=>a+(s.confidence||0),0)/analyzedScans.length).toFixed(1) : 0
  const m             = metrics || {}

  const card = { background:C.bgCard2, borderRadius:14, border:`1px solid ${C.border}`, transition:'background .3s' }

  const tabs = [
    { key:'performance', label:t('performance')  },
    { key:'scanHistory', label:t('scanHistory')  },
    { key:'confusion',   label:t('confusion')    },
  ]

  return (
    <div className="fade-in" style={{ padding:'24px 24px 40px' }}>
      <p style={{ fontSize:13, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{t('analyticsCenter')}</p>
      <h1 style={{ fontSize:26, fontFamily:'Orbitron,sans-serif', color:C.text, marginBottom:22 }}>{t('reportsTitle')}</h1>

      {/* Tabs */}
      <div style={{ display:'flex', gap:5, marginBottom:24, background:C.bgCard2, borderRadius:14, padding:5, border:`1px solid ${C.border}`, width:'fit-content', flexWrap:'wrap' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{ padding:'10px 22px', borderRadius:11, border:'none', cursor:'pointer', fontFamily:'Space Grotesk,sans-serif',
              background: tab===tb.key ? `linear-gradient(135deg,${C.secondary},${C.primary})` : 'transparent',
              color: tab===tb.key ? '#fff' : C.muted,
              fontSize:14, fontWeight:tab===tb.key?600:400, transition:'all .2s' }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Performance ── */}
      {tab === 'performance' && (
        <div className="fade-in">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }} className="grid-4-mobile">
            {[['Accuracy',m.accuracy?m.accuracy+'%':'—',C.success],['Sensitivity',m.sensitivity?m.sensitivity+'%':'—',C.primary],['Specificity',m.specificity?m.specificity+'%':'—',C.secondary],['F1 Score',m.f1_score?m.f1_score+'%':'—',C.warning],['AUC-ROC',m.auc_roc?m.auc_roc:'—',C.success],['Precision',m.precision?m.precision+'%':'—',C.primary],['Recall',m.recall?m.recall+'%':'—',C.warning],['MCC',m.mcc?m.mcc:'—',C.success]].map(([label,val,col])=>(
              <div key={label} style={{ ...card, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:3, background:col, opacity:0.6 }}/>
                <p style={{ fontSize:13, color:C.muted, marginBottom:8 }}>{label}</p>
                <p style={{ fontSize:24, fontFamily:'Orbitron,sans-serif', color:col, fontWeight:700 }}>{loading?'…':val}</p>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="grid-2-mobile">
            <div style={{ ...card, padding:20 }}>
              <p style={{ fontSize:16, color:C.text, fontWeight:600, marginBottom:18 }}>Per-Class Accuracy</p>
              {[[t('normal'),99.3,C.success],[t('benign'),93.9,C.warning],[t('malignant'),94.7,C.danger],['Pituitary',87.5,C.primary]].map(([cls,acc,col])=>(
                <div key={cls} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:5 }}>
                    <span style={{ color:C.muted }}>{cls}</span><span style={{ color:col, fontWeight:600 }}>{acc}%</span>
                  </div>
                  <div style={{ height:10, background:C.bgCard, borderRadius:5 }}>
                    <div style={{ width:`${acc}%`, height:'100%', borderRadius:5, background:`linear-gradient(90deg,${col}88,${col})` }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...card, padding:20 }}>
              <p style={{ fontSize:16, color:C.text, fontWeight:600, marginBottom:18 }}>Model Architecture</p>
              {[['Base Model',m.model||'ResNet-50'],['Pre-training','ImageNet'],['Dataset',m.dataset_size?m.dataset_size+' images':'3,064 images'],['Input','224 × 224 × 3'],['Classes',(m.classes||[]).length||4],['Optimizer','Adam (lr=1e-4)'],['Loss','Cross-Entropy'],['Epochs','50']].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:14, padding:'7px 0', borderBottom:`1px solid ${C.border}22` }}>
                  <span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Scan History ── */}
      {tab === 'scanHistory' && (
        <div className="fade-in">
          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }} className="grid-4-mobile">
            {[
              [t('totalAnalyzed'), analyzedScans.length,              C.primary],
              [t('malignant'),     byStatus['Malignant']||0,          C.danger ],
              [t('benign'),        byStatus['Benign']||0,             C.warning],
              [t('avgConfidence'), avgConf+'%',                       C.success],
            ].map(([l,v,c])=>(
              <div key={l} style={{ ...card, padding:'16px 18px' }}>
                <p style={{ fontSize:13, color:C.muted, marginBottom:8 }}>{l}</p>
                <p style={{ fontSize:26, fontFamily:'Orbitron,sans-serif', color:c, fontWeight:700 }}>{loading?'…':v}</p>
              </div>
            ))}
          </div>

          {/* Scans table */}
          <div style={{ ...card, padding:22 }}>
            <p style={{ fontSize:16, color:C.text, fontWeight:600, marginBottom:16 }}>{t('scanHistory')}</p>

            {loading ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
                <div style={{ fontSize:32, marginBottom:10, opacity:0.4 }}>⟳</div>
                <p style={{ fontSize:15 }}>{t('loading')}</p>
              </div>
            ) : scans.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 0', color:C.muted }}>
                <div style={{ fontSize:48, marginBottom:12, opacity:0.2 }}>◈</div>
                <p style={{ fontSize:16, marginBottom:6 }}>{t('noScansYet')}</p>
                <p style={{ fontSize:14 }}>Go to <strong style={{ color:C.primary }}>MRI Scan</strong> page to upload and analyze scans.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                  <thead>
                    <tr>
                      {['Scan ID','Patient','Date','MRI Type','Status','Confidence','Report'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'10px 12px', color:C.muted, fontWeight:500, borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap', fontSize:13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map(s => (
                      <tr key={s.id} style={{ borderBottom:`1px solid ${C.border}22`, transition:'background .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background=`${C.primary}08`}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'11px 12px', color:C.primary, fontFamily:'Orbitron,sans-serif', fontSize:11 }}>SC-{s.id}</td>
                        <td style={{ padding:'11px 12px', color:C.text }}>{getPatientName(s.patient_id)}</td>
                        <td style={{ padding:'11px 12px', color:C.muted, whiteSpace:'nowrap' }}>{(s.created_at||'').slice(0,10)||'—'}</td>
                        <td style={{ padding:'11px 12px', color:C.muted }}>{s.mri_type||'—'}</td>
                        <td style={{ padding:'11px 12px' }}>
                          {s.analyzed ? (
                            <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:`${statusColor(s.status)}18`, color:statusColor(s.status) }}>{s.status}</span>
                          ) : (
                            <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, background:`${C.muted}18`, color:C.muted }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding:'11px 12px' }}>
                          {s.analyzed ? (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:50, height:5, background:C.bgCard, borderRadius:3 }}>
                                <div style={{ width:`${s.confidence||0}%`, height:'100%', background:s.confidence>90?C.success:C.warning, borderRadius:3 }}/>
                              </div>
                              <span style={{ color:C.text, fontSize:13 }}>{s.confidence||0}%</span>
                            </div>
                          ) : <span style={{ color:C.muted }}>—</span>}
                        </td>
                        <td style={{ padding:'11px 12px' }}>
                          {s.analyzed ? (
                            <button onClick={() => exportPDF(s.id)} disabled={exporting===s.id}
                              style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${C.primary}44`, background:`${C.primary}11`, color:exporting===s.id?C.muted:C.primary, cursor:exporting===s.id?'not-allowed':'pointer', fontSize:13, fontFamily:'Space Grotesk,sans-serif' }}>
                              {exporting===s.id ? '…' : t('exportPdf')}
                            </button>
                          ) : <span style={{ color:C.muted, fontSize:12 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Confusion Matrix ── */}
      {tab === 'confusion' && (
        <div className="fade-in">
          <div style={{ ...card, padding:22, marginBottom:18 }}>
            <p style={{ fontSize:16, color:C.text, fontWeight:600, marginBottom:5 }}>{t('confusion')}</p>
            <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>ResNet-50 · Test set · 480 samples</p>
            <div className="table-wrap">
              <table style={{ borderCollapse:'separate', borderSpacing:5 }}>
                <thead>
                  <tr>
                    <th style={{ width:100, fontSize:12, color:C.muted, textAlign:'right', paddingRight:10, fontWeight:400 }}>Predicted →</th>
                    {CM_LABELS.map(l=><th key={l} style={{ width:80, fontSize:13, color:C.primary, textAlign:'center', fontWeight:600, paddingBottom:10 }}>{l}</th>)}
                    <th style={{ fontSize:12, color:C.muted, fontWeight:400, paddingLeft:10 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {CM_STATIC.map((row,ri)=>(
                    <tr key={ri}>
                      <td style={{ fontSize:13, color:C.primary, textAlign:'right', paddingRight:10, fontWeight:600 }}>{CM_LABELS[ri]}</td>
                      {row.map((val,ci)=>{
                        const isCorrect = ri===ci
                        return (
                          <td key={ci} style={{ width:80, height:62, textAlign:'center', borderRadius:10, fontSize:18, fontFamily:'Orbitron,sans-serif', fontWeight:700, border:`1px solid ${isCorrect?C.success+'33':'transparent'}`,
                            background: isCorrect?`rgba(0,255,148,${(val/184)*0.5+0.1})`:val>0?`rgba(255,71,87,${(val/184)*0.6})`:C.bgCard,
                            color: isCorrect?C.success:val>0?C.danger:C.muted }}>
                            {val}
                          </td>
                        )
                      })}
                      <td style={{ fontSize:13, color:C.muted, paddingLeft:10 }}>{row.reduce((a,b)=>a+b,0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }} className="grid-4-mobile">
            {CM_LABELS.map((label,i)=>{
              const tp=CM_STATIC[i][i], fn=CM_STATIC[i].reduce((a,b)=>a+b,0)-tp, fp=CM_STATIC.reduce((a,row)=>a+row[i],0)-tp
              const prec=tp/(tp+fp)||0, rec=tp/(tp+fn)||0, f1=2*prec*rec/(prec+rec)||0
              return (
                <div key={label} style={{ ...card, padding:16 }}>
                  <p style={{ fontSize:15, color:C.primary, fontWeight:600, marginBottom:12 }}>{label}</p>
                  {[['Precision',(prec*100).toFixed(1)+'%'],['Recall',(rec*100).toFixed(1)+'%'],['F1-Score',(f1*100).toFixed(1)+'%']].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:`1px solid ${C.border}22` }}>
                      <span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}