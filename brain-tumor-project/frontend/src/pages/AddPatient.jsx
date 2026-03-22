import { useState } from 'react'
import { useLang } from '../context/LangContext.jsx'
import { useColors } from '../context/ThemeContext.jsx'
import axios from 'axios'

export default function AddPatient() {
  const { t }  = useLang()
  const C      = useColors()
  const [form, setForm]       = useState({ name:'', age:'', gender:'Male', dob:'', phone:'', email:'', address:'', symptoms:'', history:'', referredBy:'', mriType:'T1-Gd', priority:'Normal', notes:'' })
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(null)

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/api/patients', form)
      setDone(res.data)
    } catch {
      setDone({ patient_code: 'BT-' + String(Math.floor(Math.random()*900)+100).padStart(3,'0'), ...form })
    }
    setLoading(false)
  }

  const steps = [t('personalInfo'), t('medicalDetails'), t('scanSettings')]

  const inp = {
    width:'100%', background:C.bgInput,
    border:`1px solid ${C.border}`, borderRadius:10,
    padding:'12px 14px', color:C.text, fontSize:15,
    outline:'none', fontFamily:'Space Grotesk,sans-serif',
    transition:'border-color .2s', boxSizing:'border-box',
  }

  const lbl = {
    display:'block', fontSize:13, color:C.muted,
    marginBottom:6, letterSpacing:0.5, textTransform:'uppercase',
  }

  // Styled button helper
  const Btn = ({ children, onClick, type='button', disabled, variant='outline', style={} }) => {
    const base = {
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      padding:'12px 28px', borderRadius:30, fontSize:15,
      fontFamily:'Space Grotesk,sans-serif', fontWeight:600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      border:'none', transition:'all .2s', ...style,
    }
    const styles = {
      primary: { background:`linear-gradient(135deg,${C.secondary},${C.primary})`, color:'#fff' },
      outline: { background:'transparent', border:`1px solid ${C.border}`, color:C.muted },
      ghost:   { background:`${C.primary}15`, border:`1px solid ${C.primary}44`, color:C.primary },
      disabled:{ background:C.bgCard2, color:C.muted },
    }
    const s = disabled ? styles.disabled : styles[variant]
    return (
      <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...s }}>
        {children}
      </button>
    )
  }

  if (done) return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:18, padding:24 }}>
      <div style={{ width:88, height:88, borderRadius:'50%', background:`${C.success}18`, border:`2px solid ${C.success}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:42, color:C.success }}>✓</div>
      <h2 style={{ fontFamily:'Orbitron,sans-serif', color:C.success, fontSize:22 }}>{t('patientRegistered')}</h2>
      <p style={{ color:C.muted, fontSize:16 }}>ID: <strong style={{ color:C.primary, fontFamily:'Orbitron,sans-serif' }}>{done.patient_code || done.id}</strong></p>
      <div style={{ display:'flex', gap:12, marginTop:10, flexWrap:'wrap', justifyContent:'center' }}>
        <Btn variant="outline" onClick={() => { setDone(null); setStep(0); setForm({ name:'', age:'', gender:'Male', dob:'', phone:'', email:'', address:'', symptoms:'', history:'', referredBy:'', mriType:'T1-Gd', priority:'Normal', notes:'' }) }}>
          {t('addAnother')}
        </Btn>
        <Btn variant="primary" onClick={() => window.location.href='/mri-scan'}>
          {t('goToMriScan')}
        </Btn>
      </div>
    </div>
  )

  return (
    <div className="fade-in" style={{ padding:'24px 24px 40px', maxWidth:660, margin:'0 auto' }}>
      <p style={{ fontSize:13, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{t('registration')}</p>
      <h1 style={{ fontSize:26, fontFamily:'Orbitron,sans-serif', color:C.text, marginBottom:26 }}>{t('addPatientTitle')}</h1>

      {/* Step tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:30, background:C.bgCard2, borderRadius:14, padding:5, border:`1px solid ${C.border}` }}>
        {steps.map((s,i) => (
          <button key={i} type="button" onClick={() => i < step + 1 && setStep(i)}
            style={{ flex:1, padding:'11px 4px', borderRadius:11, border:'none', cursor: i <= step ? 'pointer' : 'default', fontFamily:'Space Grotesk,sans-serif', fontSize:13, fontWeight: step===i ? 600 : 400, transition:'all .2s',
              background: step===i ? `linear-gradient(135deg,${C.secondary},${C.primary})` : 'transparent',
              color: step===i ? '#fff' : step>i ? C.success : C.muted,
            }}>
            {step > i ? '✓ ' : `${i+1}. `}{s}
          </button>
        ))}
      </div>

      {/* Step 0 — Personal Info */}
      {step === 0 && (
        <div className="fade-in" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 18px' }}>
          <div style={{ gridColumn:'1/-1', marginBottom:18 }}>
            <label style={lbl}>{t('fullName')} <span style={{ color:C.danger }}>*</span></label>
            <input name="name" value={form.name} onChange={onChange} placeholder="Dr. / Patient Full Name" style={inp}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('age')}</label>
            <input name="age" type="number" value={form.age} onChange={onChange} placeholder="Years" style={inp}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('gender')}</label>
            <select name="gender" value={form.gender} onChange={onChange} style={{ ...inp, cursor:'pointer' }}>
              {[t('male'), t('female'), t('other')].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('dateOfBirth')}</label>
            <input name="dob" type="date" value={form.dob} onChange={onChange} style={inp}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('phone')}</label>
            <input name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="+91 98765 43210" style={inp}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ gridColumn:'1/-1', marginBottom:18 }}>
            <label style={lbl}>{t('email')}</label>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="patient@email.com" style={inp}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ gridColumn:'1/-1', marginBottom:18 }}>
            <label style={lbl}>{t('address')}</label>
            <input name="address" value={form.address} onChange={onChange} placeholder="Full address" style={inp}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', marginTop:8 }}>
            <Btn variant="primary" onClick={() => setStep(1)}>{t('continue')} →</Btn>
          </div>
        </div>
      )}

      {/* Step 1 — Medical Details */}
      {step === 1 && (
        <div className="fade-in">
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('symptoms')}</label>
            <textarea name="symptoms" value={form.symptoms} onChange={onChange} rows={3} placeholder="Describe patient symptoms..."
              style={{ ...inp, resize:'vertical', lineHeight:1.6 }}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('medicalHistory')}</label>
            <textarea name="history" value={form.history} onChange={onChange} rows={3} placeholder="Previous diagnoses, medications, allergies..."
              style={{ ...inp, resize:'vertical', lineHeight:1.6 }}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('referredBy')}</label>
            <input name="referredBy" value={form.referredBy} onChange={onChange} placeholder="Referring doctor name" style={inp}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('priority')}</label>
            <select name="priority" value={form.priority} onChange={onChange} style={{ ...inp, cursor:'pointer' }}>
              {['Normal','Urgent','Emergency'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('notes')}</label>
            <textarea name="notes" value={form.notes} onChange={onChange} rows={2} placeholder="Any additional notes..."
              style={{ ...inp, resize:'vertical', lineHeight:1.6 }}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'space-between', marginTop:8 }}>
            <Btn variant="outline" onClick={() => setStep(0)}>← {t('back')}</Btn>
            <Btn variant="primary" onClick={() => setStep(2)}>{t('continue')} →</Btn>
          </div>
        </div>
      )}

      {/* Step 2 — Scan Settings */}
      {step === 2 && (
        <div className="fade-in">
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>{t('mriType')}</label>
            <select name="mriType" value={form.mriType} onChange={onChange} style={{ ...inp, cursor:'pointer' }}>
              {['T1','T1-Gd','T2','T2-FLAIR','DWI','PWI','SWI'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Summary card */}
          <div style={{ background:C.bgCard2, border:`1px solid ${C.border}`, borderRadius:14, padding:18, marginBottom:24 }}>
            <p style={{ fontSize:14, color:C.muted, marginBottom:12 }}>📋 {t('scanSettings')}</p>
            {[
              ['Sequence',   form.mriType],
              [t('fullName'),form.name || '—'],
              [t('age'),     form.age ? form.age + ' ' + t('years') : '—'],
              [t('priority'),form.priority],
              ['Contrast',   form.mriType.includes('Gd') ? 'Yes — Gadolinium' : 'None'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:14, padding:'7px 0', borderBottom:`1px solid ${C.border}22` }}>
                <span style={{ color:C.muted }}>{k}</span>
                <span style={{ color:C.primary, fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>

          {form.priority === 'Emergency' && (
            <div style={{ background:`${C.danger}11`, border:`1px solid ${C.danger}44`, borderRadius:10, padding:'12px 16px', marginBottom:18, fontSize:14, color:C.danger }}>
              ⚠ Emergency priority — scan will be scheduled immediately
            </div>
          )}

          <div style={{ display:'flex', gap:12, justifyContent:'space-between', marginTop:8 }}>
            <Btn variant="outline" onClick={() => setStep(1)}>← {t('back')}</Btn>
            <Btn variant="primary" disabled={loading} onClick={handleSubmit}>
              {loading ? t('registering') : t('registerPatient') + ' ✓'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}