import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { useColors } from '../context/ThemeContext.jsx'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import toast from 'react-hot-toast'

const SPECIALITIES = ['Neurology','Neurosurgery','Oncology','Radiology','Neuroradiology','Pathology','General Medicine','Other']

export default function Signup() {
  const { t }      = useLang()
  const C          = useColors()
  const { signup } = useAuth()
  const nav        = useNavigate()

  const [form,    setForm]    = useState({ name:'', email:'', password:'', confirmPassword:'', hospital:'', speciality:'', license_no:'' })
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const [step,    setStep]    = useState(0)

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const validateStep0 = () => {
    if (!form.name.trim())  { toast.error(t('fullName') + ' is required'); return false }
    if (!form.email.trim()) { toast.error(t('emailAddress') + ' is required'); return false }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false }
    return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateStep0()) return
    setLoading(true)
    try {
      await signup({ name:form.name.trim(), email:form.email.trim().toLowerCase(), password:form.password, hospital:form.hospital, speciality:form.speciality, license_no:form.license_no })
      toast.success('Account created! Welcome to NeuralOnco.')
      nav('/')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Signup failed. Please try again.')
    }
    setLoading(false)
  }

  const pwStrength = () => {
    const p = form.password
    if (!p) return { score:0, label:'', color:C.bgCard2 }
    if (p.length < 6)  return { score:1, label:'Weak',   color:C.danger  }
    if (p.length < 10) return { score:2, label:'Fair',   color:C.warning }
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { score:4, label:'Strong', color:C.success }
    return { score:3, label:'Good', color:C.primary }
  }
  const pw = pwStrength()

  const inp = { width:'100%', background:C.bgInput, border:`1px solid ${C.border}`, borderRadius:12, padding:'13px 16px', color:C.text, fontSize:15, outline:'none', fontFamily:'Space Grotesk,sans-serif', transition:'border-color .2s' }
  const lbl = { display:'block', fontSize:13, color:C.muted, marginBottom:6, letterSpacing:0.5, textTransform:'uppercase' }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Grotesk,sans-serif', padding:'20px 16px', position:'relative', overflow:'hidden', transition:'background .3s' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize:'40px 40px', opacity:0.6 }}/>
      <div style={{ position:'absolute', top:'10%', right:'10%', width:300, height:300, borderRadius:'50%', background:`${C.primary}10`, filter:'blur(80px)' }}/>
      <div style={{ position:'absolute', bottom:'10%', left:'10%', width:260, height:260, borderRadius:'50%', background:`${C.secondary}12`, filter:'blur(80px)' }}/>
      <div style={{ position:'absolute', top:20, right:20, zIndex:10, display:'flex', gap:8 }}>
        <ThemeToggle /><LanguageSwitcher />
      </div>
      <div className="fade-in" style={{ width:'100%', maxWidth:500, position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:30 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:`linear-gradient(135deg,${C.secondary},${C.primary})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontFamily:'Orbitron,sans-serif', color:'#fff', fontWeight:900, margin:'0 auto 16px' }}>B</div>
          <h1 style={{ fontFamily:'Orbitron,sans-serif', fontSize:24, color:C.text, fontWeight:700, letterSpacing:1, marginBottom:6 }}>NeuralOnco</h1>
          <p style={{ color:C.muted, fontSize:15 }}>{t('createDoctorAcc')}</p>
        </div>
        <div style={{ display:'flex', gap:5, marginBottom:26 }}>
          {[t('accountDetails'), t('professionalInfo')].map((s,i) => (
            <div key={i} onClick={() => i < step && setStep(i)}
              style={{ flex:1, padding:'11px 0', borderRadius:12, textAlign:'center', fontSize:14, background:step===i?`linear-gradient(135deg,${C.secondary},${C.primary})`:C.border, color:step===i?'#fff':C.muted, fontWeight:step===i?600:400, cursor:i<step?'pointer':'default', transition:'all .2s' }}>
              {step > i ? '✓ ' : `${i+1}. `}{s}
            </div>
          ))}
        </div>
        <div style={{ background:C.bgCard, borderRadius:22, border:`1px solid ${C.border}`, padding:'36px', boxShadow:C.shadow, transition:'background .3s' }}>
          <form onSubmit={handleSubmit}>
            {step === 0 && (
              <div className="fade-in">
                <div style={{ marginBottom:18 }}><label style={lbl}>{t('fullName')} <span style={{ color:C.danger }}>*</span></label><input name="name" value={form.name} onChange={onChange} placeholder="Dr. Full Name" style={inp} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <div style={{ marginBottom:18 }}><label style={lbl}>{t('emailAddress')} <span style={{ color:C.danger }}>*</span></label><input name="email" type="email" value={form.email} onChange={onChange} placeholder="doctor@hospital.com" style={inp} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <div style={{ marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <label style={lbl}>{t('password')} <span style={{ color:C.danger }}>*</span></label>
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ background:'none', border:'none', color:C.primary, cursor:'pointer', fontSize:13 }}>{showPw?t('hide'):t('show')}</button>
                  </div>
                  <input name="password" type={showPw?'text':'password'} value={form.password} onChange={onChange} placeholder="Min 6 characters" style={inp} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
                  {form.password && (<div style={{ marginTop:8 }}><div style={{ height:4, background:C.bgCard2, borderRadius:2, marginBottom:5 }}><div style={{ height:'100%', width:`${pw.score*25}%`, background:pw.color, borderRadius:2, transition:'width .3s' }}/></div><span style={{ fontSize:12, color:pw.color }}>{pw.label}</span></div>)}
                </div>
                <div style={{ marginBottom:22 }}><label style={lbl}>{t('confirmPassword')} <span style={{ color:C.danger }}>*</span></label><input name="confirmPassword" type={showPw?'text':'password'} value={form.confirmPassword} onChange={onChange} placeholder="Repeat password" style={inp} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <button type="button" onClick={() => validateStep0() && setStep(1)} style={{ width:'100%', padding:'15px', borderRadius:32, border:'none', background:`linear-gradient(135deg,${C.secondary},${C.primary})`, color:'#fff', cursor:'pointer', fontFamily:'Orbitron,sans-serif', fontSize:13, letterSpacing:2, fontWeight:600 }}>{t('continue')}</button>
              </div>
            )}
            {step === 1 && (
              <div className="fade-in">
                <div style={{ marginBottom:18 }}><label style={lbl}>{t('hospital')}</label><input name="hospital" value={form.hospital} onChange={onChange} placeholder="AIIMS Mumbai, Apollo..." style={inp} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <div style={{ marginBottom:18 }}>
                  <label style={lbl}>{t('speciality')}</label>
                  <select name="speciality" value={form.speciality} onChange={onChange} style={{ ...inp, cursor:'pointer' }}>
                    <option value="">— {t('speciality')} —</option>
                    {SPECIALITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:18 }}><label style={lbl}>{t('licenseNo')}</label><input name="license_no" value={form.license_no} onChange={onChange} placeholder="e.g. MCI-12345" style={inp} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <div style={{ background:C.bgCard2, borderRadius:14, padding:'14px 18px', marginBottom:22, border:`1px solid ${C.border}` }}>
                  <p style={{ fontSize:14, color:C.muted, marginBottom:10 }}>{t('accountSummary')}</p>
                  {[[t('fullName'),form.name],[t('emailAddress'),form.email],[t('hospital'),form.hospital||'—'],[t('speciality'),form.speciality||'—']].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:14, padding:'5px 0' }}><span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text }}>{v}</span></div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <button type="button" onClick={() => setStep(0)} style={{ flex:1, padding:'14px', borderRadius:32, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer', fontSize:15 }}>{t('back')}</button>
                  <button type="submit" disabled={loading} style={{ flex:2, padding:'14px', borderRadius:32, border:'none', background:loading?C.bgCard2:`linear-gradient(135deg,${C.secondary},${C.primary})`, color:loading?C.muted:'#fff', cursor:loading?'not-allowed':'pointer', fontFamily:'Orbitron,sans-serif', fontSize:13, letterSpacing:2, fontWeight:600 }}>{loading?t('creating'):t('createAccountBtn')}</button>
                </div>
              </div>
            )}
          </form>
        </div>
        <p style={{ textAlign:'center', color:C.muted, fontSize:14, marginTop:22 }}>
          {t('alreadyHave')}{' '}<Link to="/login" style={{ color:C.primary, textDecoration:'none', fontWeight:600 }}>{t('signInBtn').replace(' →','')}</Link>
        </p>
      </div>
    </div>
  )
}