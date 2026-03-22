import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useLang } from '../context/LangContext.jsx'
import { useColors } from '../context/ThemeContext.jsx'
import axios from 'axios'
import toast from 'react-hot-toast'



const PIPELINE_STEPS_KEYS = ['loadingImage','skullStripping','biasCorrection','segmentation','featureExtraction','cnnClassification','postProcessing']
const PIPELINE_STEPS_EN   = ['Loading image','Skull stripping','Bias correction','Segmentation','Feature extraction','CNN classification','Post-processing']

async function uploadAndAnalyze(file, patientId, onProgress) {
  onProgress(0, 0)
  const fd = new FormData()
  fd.append('file', file)
  if (patientId) fd.append('patient_id', String(patientId))
  const uploadRes = await axios.post('/api/scans/upload', fd, {
    headers:{ 'Content-Type':'multipart/form-data' },
    onUploadProgress: e => { onProgress(Math.round((e.loaded/e.total)*30), 0) },
  })
  const scanId = uploadRes.data.id
  onProgress(35, 1)
  let fakeProgress = 35
  const iv = setInterval(() => {
    fakeProgress += Math.random()*4+1
    if (fakeProgress < 90) {
      const si = Math.floor(((fakeProgress-35)/55)*(PIPELINE_STEPS_EN.length-2))+1
      onProgress(Math.min(fakeProgress, 89), Math.min(si, PIPELINE_STEPS_EN.length-2))
    }
  }, 200)
  const analyzeRes = await axios.post(`/api/scans/${scanId}/analyze`)
  clearInterval(iv)
  onProgress(100, PIPELINE_STEPS_EN.length-1)
  return analyzeRes.data
}

function mapResult(data) {
  let probs = []
  try { probs = typeof data.probabilities==='string' ? JSON.parse(data.probabilities) : (data.probabilities||[]) } catch { probs=[] }
  if (!probs.length) probs=[['Normal',0,'#00FF94'],['Benign',0,'#FFB800'],['Malignant',0,'#FF4757'],['Pituitary',0,'#00D4FF']]
  return {
    status:data.status||'Unknown', confidence:data.confidence||0,
    type:data.tumor_type||'—', grade:data.tumor_grade||'—',
    location:data.tumor_location||'—', size:data.tumor_size||'—',
    volume:data.tumor_volume?`${data.tumor_volume} cm³`:'—',
    edema:data.edema_volume?`${data.edema_volume} cm³`:'—',
    enhancement:data.enhancement||'—',
    recommendation:data.recommendation||'Consult a specialist.',
    probabilities:probs,
    heatmap:data.heatmap_path?`/uploads/${data.heatmap_path.split(/[\\/]/).pop()}`:null,
  }
}

export default function MRIScan() {
  const { t, lang } = useLang()
  const C = useColors()
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState(null)
  const [phase, setPhase]         = useState('idle')
  const [progress, setProgress]   = useState(0)
  const [stepIdx, setStepIdx]     = useState(0)
  const [result, setResult]       = useState(null)
  const [errorMsg, setErrorMsg]   = useState('')
  const [patientId, setPatientId] = useState('')
  const [patients, setPatients]   = useState([])

  useEffect(() => {
    axios.get('/api/patients?limit=100').then(r=>setPatients(r.data)).catch(()=>{})
  }, [])

  const onDrop = useCallback(accepted => {
    const f = accepted[0]; if (!f) return
    setFile(f); setResult(null); setPhase('idle')
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept:{ 'image/*':[], 'application/dicom':['.dcm'], '': ['.nii','.nii.gz'] }, maxFiles:1,
  })

  const runAnalysis = async () => {
    if (!file)      { toast.error(t('uploadMri')); return }
    if (!patientId) { toast.error(t('selectPatient')); return }
    setPhase('scanning'); setProgress(0); setStepIdx(0); setErrorMsg('')
    try {
      const raw = await uploadAndAnalyze(file, patientId, (pct,si) => { setProgress(Math.round(pct)); setStepIdx(si) })
      setResult(mapResult(raw)); setPhase('result')
      toast.success('Analysis complete!')
    } catch(err) {
      const msg = err?.response?.data?.detail||err.message||'Analysis failed'
      setErrorMsg(msg); setPhase('error')
      toast.error(`Analysis failed: ${msg}`)
    }
  }

  const reset = () => { setFile(null); setPreview(null); setPhase('idle'); setProgress(0); setResult(null); setErrorMsg('') }
  const statusColor = s => s==='Malignant'?C.danger:s==='Benign'?C.warning:s==='Pituitary'?C.primary:C.success

  const selStyle = { width:'100%', background:C.bgInput, border:`1px solid ${patientId?C.primary+'66':C.border}`, borderRadius:10, padding:'12px 14px', color:patientId?C.text:C.muted, fontSize:15, outline:'none', cursor:'pointer' }

  return (
    <div className="fade-in" style={{ padding:'24px 24px 40px' }}>
      <p style={{ fontSize:13, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{t('aiAnalysis')}</p>
      <h1 style={{ fontSize:26, fontFamily:'Orbitron,sans-serif', color:C.text, marginBottom:22 }}>{t('mriScanTitle')}</h1>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }} className="grid-2-mobile">

        {/* LEFT */}
        <div>
          {/* Patient selector */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, color:C.muted, marginBottom:6, letterSpacing:0.5, textTransform:'uppercase' }}>
              {t('selectPatient')} <span style={{ color:C.danger }}>*</span>
            </label>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)} style={selStyle}>
              <option value="">{t('choosePatient')}</option>
              {patients.map(p=>(
                <option key={p.id} value={p.id}>{p.patient_code} — {p.name}{p.age?` (${p.age}y)`:''}</option>
              ))}
            </select>
            {patients.length===0&&<p style={{ fontSize:13, color:C.warning, marginTop:5 }}>{t('noPatientFound')} <a href="/add-patient" style={{ color:C.primary }}>{t('addFirst')}</a></p>}
          </div>

          {/* Dropzone */}
          <div {...getRootProps()} style={{ border:`2px dashed ${isDragActive?C.primary:C.border}`, borderRadius:16, padding:28, textAlign:'center', background:isDragActive?`${C.primary}08`:C.bg2, cursor:'pointer', marginBottom:16, transition:'all .2s' }}>
            <input {...getInputProps()} />
            <div style={{ fontSize:46, marginBottom:12, color:file?C.success:C.muted }}>◈</div>
            {file ? (
              <><p style={{ color:C.success, fontWeight:600, marginBottom:4, fontSize:15 }}>✓ {file.name}</p>
              <p style={{ fontSize:13, color:C.muted }}>{(file.size/1024).toFixed(1)} KB</p></>
            ) : (
              <><p style={{ color:C.primary, fontWeight:600, marginBottom:6, fontSize:16 }}>{isDragActive?t('dropHere'):t('uploadMri')}</p>
              <p style={{ color:C.muted, fontSize:14 }}>DICOM · NIfTI · JPEG · PNG</p></>
            )}
          </div>

          {/* Brain preview */}
          <div style={{ background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, padding:12, marginBottom:16, overflow:'hidden' }}>
            {preview ? (
              <img src={preview} alt="MRI" style={{ width:'100%', borderRadius:10, maxHeight:220, objectFit:'cover' }}/>
            ) : (
              <svg viewBox="0 0 300 180" width="100%" style={{ display:'block' }}>
                {Array.from({length:5},(_,i)=><line key={`h${i}`} x1="0" y1={i*40} x2="300" y2={i*40} stroke="#00D4FF08" strokeWidth="0.5"/>)}
                {Array.from({length:7},(_,i)=><line key={`v${i}`} x1={i*50} y1="0" x2={i*50} y2="180" stroke="#00D4FF08" strokeWidth="0.5"/>)}
                <ellipse cx="150" cy="90" rx="100" ry="75" fill="#0d1f3c" stroke="#00D4FF33" strokeWidth="1"/>
                <ellipse cx="150" cy="90" rx="60" ry="48" fill="none" stroke="#00D4FF15" strokeWidth="0.5"/>
                {phase==='scanning'&&<rect x="50" y="0" width="200" height="2" fill={C.primary} opacity="0.7" style={{animation:'scan 1.5s linear infinite'}}/>}
                {phase==='result'&&result&&result.status!=='Normal'&&<ellipse cx="185" cy="78" rx="20" ry="17" fill={`${statusColor(result.status)}44`} stroke={statusColor(result.status)} strokeWidth="1.5" strokeDasharray="3 2" className="pulse-dot"/>}
                <text x="150" y="170" textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="Space Grotesk,sans-serif">Axial View</text>
              </svg>
            )}

            {phase==='scanning'&&(
              <div style={{ padding:'12px 0 0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.muted, marginBottom:5 }}>
                  <span>{PIPELINE_STEPS_EN[stepIdx]}</span><span>{progress}%</span>
                </div>
                <div style={{ height:5, background:C.bgCard, borderRadius:3 }}>
                  <div style={{ height:'100%', width:`${progress}%`, borderRadius:3, background:`linear-gradient(90deg,${C.secondary},${C.primary})`, transition:'width .2s' }}/>
                </div>
                <div style={{ display:'flex', gap:4, marginTop:10, flexWrap:'wrap' }}>
                  {PIPELINE_STEPS_EN.map((s,i)=>(
                    <span key={i} style={{ fontSize:11, padding:'3px 9px', borderRadius:10, background:i<stepIdx?`${C.success}22`:i===stepIdx?`${C.primary}22`:'#1a2040', color:i<stepIdx?C.success:i===stepIdx?C.primary:C.muted }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {phase==='error'&&<div style={{ background:`${C.danger}11`, border:`1px solid ${C.danger}33`, borderRadius:10, padding:'12px 16px', marginBottom:14, fontSize:14, color:C.danger }}>✗ {errorMsg}</div>}

          <div style={{ display:'flex', gap:12 }}>
            <button onClick={runAnalysis} disabled={phase==='scanning'}
              style={{ flex:1, padding:14, borderRadius:30, border:'none', background:phase==='scanning'?'#1a2040':`linear-gradient(135deg,${C.secondary},${C.primary})`, color:phase==='scanning'?C.muted:'#fff', cursor:phase==='scanning'?'not-allowed':'pointer', fontFamily:'Orbitron,sans-serif', fontSize:12, letterSpacing:1.5 }}>
              {phase==='scanning'?t('analyzing'):t('runAnalysis')}
            </button>
            {(file||result)&&<button onClick={reset} style={{ padding:'14px 18px', borderRadius:30, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer', fontSize:16 }}>↺</button>}
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {phase==='result'&&result ? (
            <div className="fade-in">
              <div style={{ background:`${statusColor(result.status)}0d`, border:`1px solid ${statusColor(result.status)}44`, borderRadius:18, padding:20, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div>
                    <p style={{ fontSize:12, color:C.muted, letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>{t('primaryDiagnosis')}</p>
                    <p style={{ fontSize:24, color:statusColor(result.status), fontFamily:'Orbitron,sans-serif', fontWeight:700 }}>{result.status}</p>
                    <p style={{ fontSize:14, color:C.muted, marginTop:3 }}>{result.type}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:12, color:C.muted, marginBottom:5 }}>{t('aiConfidence')}</p>
                    <p style={{ fontSize:32, color:C.primary, fontFamily:'Orbitron,sans-serif', fontWeight:700 }}>{result.confidence}%</p>
                  </div>
                </div>
                {[[t('whoGrade'),result.grade],[t('location'),result.location],[t('tumorSize'),result.size],[t('tumorVolume'),result.volume],[t('edemaVolume'),result.edema],[t('enhancement'),result.enhancement]].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:14, padding:'8px 0', borderTop:`1px solid ${C.border}22` }}>
                    <span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text, fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ background:C.bgCard2, borderRadius:16, border:`1px solid ${C.border}`, padding:18, marginBottom:16 }}>
                <p style={{ fontSize:15, color:C.muted, marginBottom:14, fontWeight:600 }}>{t('classProbabilities')}</p>
                {result.probabilities.map(([label,val,col])=>(
                  <div key={label} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:5 }}>
                      <span style={{ color:C.muted }}>{label}</span>
                      <span style={{ color:col, fontWeight:600 }}>{typeof val==='number'?val.toFixed(1):val}%</span>
                    </div>
                    <div style={{ height:8, background:C.bgCard, borderRadius:4 }}>
                      <div style={{ width:`${Math.min(val,100)}%`, height:'100%', borderRadius:4, background:col, transition:'width 1s ease' }}/>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background:`${C.warning}0d`, border:`1px solid ${C.warning}33`, borderRadius:14, padding:16, marginBottom:16 }}>
                <p style={{ fontSize:14, color:C.warning, fontWeight:600, marginBottom:6 }}>{t('clinicalRec')}</p>
                <p style={{ fontSize:14, color:C.muted, lineHeight:1.7 }}>{result.recommendation}</p>
              </div>

              {result.heatmap&&(
                <div style={{ background:C.bgCard2, borderRadius:14, border:`1px solid ${C.border}`, padding:14, marginBottom:16 }}>
                  <p style={{ fontSize:14, color:C.muted, marginBottom:10 }}>{t('gradCam')}</p>
                  <img src={result.heatmap} alt="Grad-CAM" style={{ width:'100%', borderRadius:10, maxHeight:200, objectFit:'cover' }} onError={e=>e.target.parentElement.style.display='none'}/>
                </div>
              )}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>window.location.href='/reports'} style={{ flex:1, padding:12, borderRadius:30, border:`1px solid ${C.primary}`, background:'transparent', color:C.primary, cursor:'pointer', fontSize:14 }}>{t('exportReport')}</button>
                <button onClick={()=>window.location.href='/3d-view'} style={{ flex:1, padding:12, borderRadius:30, border:`1px solid ${C.secondary}`, background:'transparent', color:C.secondary, cursor:'pointer', fontSize:14 }}>◉ 3D View</button>
              </div>
            </div>
          ) : (
            <div style={{ background:C.bgCard2, borderRadius:18, border:`1px solid ${C.border}`, padding:36, minHeight:440, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:16, color:C.muted, textAlign:'center' }}>
              <div style={{ fontSize:68, opacity:0.2 }}>◈</div>
              <p style={{ fontSize:17, fontWeight:500 }}>{t('readyForAnalysis')}</p>
              <p style={{ fontSize:15, lineHeight:1.8 }}>1. {t('selectPatient')}<br/>2. {t('uploadMri')}<br/>3. {t('runAnalysis')}</p>
              <div style={{ marginTop:10, fontSize:14, lineHeight:2.2 }}>
                {['ResNet-50 backbone','Grad-CAM visualization','Multi-class detection','DICOM compatible'].map(f=>(
                  <div key={f} style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                    <span style={{ color:C.success }}>✓</span>{f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
