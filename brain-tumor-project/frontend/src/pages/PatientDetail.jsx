import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext.jsx'
import axios from 'axios'

const C = {
  primary:'#00D4FF', secondary:'#7B2FFF', success:'#00FF94',
  warning:'#FFB800', danger:'#FF4757', bg2:'#111835',
  border:'rgba(0,212,255,0.15)', text:'#E8EEFF', muted:'#6B7DB3',
}
const statusColor = s =>
  s==='Malignant'?C.danger:s==='Benign'?C.warning:s==='Pituitary'?C.primary:C.success

export default function PatientDetail() {
  const { id } = useParams()
  const nav    = useNavigate()
  const { t }  = useLang()

  const [patient,   setPatient]   = useState(null)
  const [scans,     setScans]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    const isNumeric = /^\d+$/.test(id)
    const fetchP = isNumeric
      ? axios.get(`/api/patients/${id}`)
      : axios.get(`/api/patients?search=${id}`)

    fetchP.then(r => {
      const data = Array.isArray(r.data) ? r.data[0] : r.data
      if (!data) { setError('Patient not found'); return }
      setPatient(data)
      return axios.get(`/api/scans?patient_id=${data.id}`)
    }).then(r => {
      if (r) setScans(r.data.filter(s => s.analyzed))
    }).catch(() => setError('Patient not found — ID: ' + id))
    .finally(() => setLoading(false))
  }, [id])

  const exportPDF = async (scanId) => {
    setExporting(scanId)
    try {
      const res = await axios.get(`/api/reports/export/${scanId}`, {
        responseType:'blob', headers:{ Accept:'application/pdf' },
      })
      const blob = new Blob([res.data], { type:'application/pdf' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `NeuralOnco_${patient?.patient_code}_Scan_${scanId}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch(e) {
      alert('PDF export failed: ' + (e.message || 'Unknown error'))
    }
    setExporting(null)
  }

  if (loading) return <div style={{ padding:24, color:C.muted }}>{t('loading')}</div>

  if (error || !patient) return (
    <div className="fade-in" style={{ padding:24 }}>
      <button onClick={() => nav(-1)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:20, padding:'6px 14px', color:C.muted, cursor:'pointer', fontSize:12, marginBottom:20 }}>{t('back2')}</button>
      <div style={{ background:C.bg2, border:`1px solid ${C.danger}33`, borderRadius:14, padding:32, textAlign:'center' }}>
        <p style={{ color:C.danger, fontSize:14, marginBottom:8 }}>Patient Not Found</p>
        <p style={{ color:C.muted, fontSize:12 }}>ID "{id}" does not exist in the database.</p>
        <button onClick={() => nav('/search')} style={{ marginTop:16, padding:'8px 20px', borderRadius:20, border:`1px solid ${C.primary}`, background:'transparent', color:C.primary, cursor:'pointer', fontSize:12 }}>← {t('searchTitle')}</button>
      </div>
    </div>
  )

  const latestScan = scans[0]

  return (
    <div className="fade-in" style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={() => nav(-1)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:20, padding:'6px 14px', color:C.muted, cursor:'pointer', fontSize:12 }}>{t('back2')}</button>
        <span style={{ color:C.muted, fontSize:12 }}>{t('patientRecord')}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Personal Info */}
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg,${C.secondary}55,${C.primary}55)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontFamily:'Orbitron,sans-serif', color:C.primary, fontWeight:700 }}>
              {patient.name?.[0] || 'P'}
            </div>
            <div>
              <p style={{ fontFamily:'Orbitron,sans-serif', color:C.primary, fontSize:11, marginBottom:4 }}>{patient.patient_code}</p>
              <p style={{ fontSize:18, fontWeight:600, color:C.text }}>{patient.name}</p>
            </div>
          </div>
          <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, letterSpacing:1 }}>{t('personalInfoLabel')}</p>
          {[
            [t('age'),         patient.age ? `${patient.age} ${t('years')}` : '—'],
            [t('gender'),      patient.gender    || '—'],
            [t('dateOfBirth'), patient.dob       || '—'],
            [t('phone'),       patient.phone     || '—'],
            [t('email'),       patient.email     || '—'],
            [t('address'),     patient.address   || '—'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'7px 0', borderBottom:`1px solid ${C.border}22` }}>
              <span style={{ color:C.muted }}>{k}</span>
              <span style={{ color:C.text }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Diagnosis */}
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
          <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:12, letterSpacing:1 }}>{t('diagnosis')}</p>
          {latestScan ? (<>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ padding:'4px 16px', borderRadius:20, fontSize:13, fontWeight:700, background:`${statusColor(latestScan.status)}18`, color:statusColor(latestScan.status) }}>
                {latestScan.status}
              </span>
              <span style={{ fontFamily:'Orbitron,sans-serif', color:C.primary, fontSize:18, fontWeight:700 }}>{latestScan.confidence}%</span>
            </div>
            {[
              ['Tumor Type',   latestScan.tumor_type     || '—'],
              ['WHO Stage',    latestScan.tumor_grade    || '—'],
              ['Location',     latestScan.tumor_location || '—'],
              ['Size',         latestScan.tumor_size     || '—'],
              ['MRI Sequence', latestScan.mri_type       || '—'],
              ['Scan Date',    (latestScan.created_at||'').slice(0,10) || '—'],
              [t('priority'),  patient.priority    || 'Normal'],
              [t('referredBy'),patient.referred_by || '—'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0', borderBottom:`1px solid ${C.border}22` }}>
                <span style={{ color:C.muted }}>{k}</span>
                <span style={{ color:C.text }}>{v}</span>
              </div>
            ))}
          </>) : (
            <div style={{ textAlign:'center', padding:'20px 0', color:C.muted }}>
              <p style={{ fontSize:13, marginBottom:8 }}>{t('noScanYet')}</p>
              <button onClick={() => nav('/mri-scan')} style={{ padding:'7px 18px', borderRadius:20, border:`1px solid ${C.primary}`, background:'transparent', color:C.primary, cursor:'pointer', fontSize:12 }}>
                {t('uploadMriBtn')}
              </button>
            </div>
          )}
        </div>

        {/* Symptoms & History */}
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
          <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:10, letterSpacing:1 }}>{t('symptoms2')}</p>
          <p style={{ fontSize:13, color:C.text, lineHeight:1.7, marginBottom:16 }}>{patient.symptoms || t('noSymptoms')}</p>
          <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:10, letterSpacing:1 }}>{t('medHistory2')}</p>
          <p style={{ fontSize:13, color:C.text, lineHeight:1.7 }}>{patient.history || t('noHistory')}</p>
        </div>

        {/* Actions + Scan History */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
            <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:14, letterSpacing:1 }}>{t('actions')}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                [t('newMriScan'),  '/mri-scan'],
                [t('open3d'),      '/3d-view'],
                [t('viewReports'), '/reports'],
              ].map(([label,path]) => (
                <button key={label} onClick={() => nav(path)}
                  style={{ padding:'11px 16px', borderRadius:10, border:`1px solid ${C.border}`, background:'transparent', color:C.text, cursor:'pointer', fontSize:13, textAlign:'left' }}>
                  {label}
                </button>
              ))}
              {/* Timeline button */}
              <button onClick={() => nav(`/patient/${id}/timeline`)}
                style={{ padding:'11px 16px', borderRadius:10, border:`1px solid ${C.primary}44`, background:`${C.primary}0d`, color:C.primary, cursor:'pointer', fontSize:13, textAlign:'left', fontWeight:500 }}>
                ◎ {t('timeline')} ({scans.length} {scans.length===1?'scan':'scans'})
              </button>
            </div>
          </div>

          {scans.length > 0 && (
            <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
              <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:14, letterSpacing:1 }}>{t('scanHistoryLabel')}</p>
              {scans.slice(0,3).map(s => (
                <div key={s.id} style={{ background:'#080B1A', borderRadius:10, padding:'12px 14px', marginBottom:8, border:`1px solid ${C.border}22` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div>
                      <span style={{ fontSize:10, fontFamily:'Orbitron,sans-serif', color:C.primary }}>SC-{s.id}</span>
                      <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>{(s.created_at||'').slice(0,10)}</span>
                    </div>
                    <span style={{ padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:600, background:`${statusColor(s.status)}18`, color:statusColor(s.status) }}>{s.status}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p style={{ fontSize:11, color:C.text, margin:0 }}>{s.tumor_type || '—'}</p>
                      <p style={{ fontSize:10, color:C.muted, margin:'2px 0 0' }}>{s.mri_type} · {s.confidence}%</p>
                    </div>
                    <button onClick={() => exportPDF(s.id)} disabled={exporting===s.id}
                      style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${C.primary}`, background:`${C.primary}11`, color:exporting===s.id?C.muted:C.primary, cursor:exporting===s.id?'not-allowed':'pointer', fontSize:11, fontWeight:600 }}>
                      {exporting===s.id ? '…' : '📄 PDF'}
                    </button>
                  </div>
                </div>
              ))}
              {scans.length > 3 && (
                <button onClick={() => nav(`/patient/${id}/timeline`)}
                  style={{ width:'100%', padding:'9px', borderRadius:10, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer', fontSize:12 }}>
                  View all {scans.length} scans in Timeline →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
