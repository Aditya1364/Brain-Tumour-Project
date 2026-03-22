import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { useColors } from '../context/ThemeContext.jsx'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import toast from 'react-hot-toast'

export default function Login() {
  const { t }     = useLang()
  const { login } = useAuth()
  const C         = useColors()
  const nav       = useNavigate()
  const [form,    setForm]    = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const onChange = e => setForm(f=>({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email||!form.password){ toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      nav('/')
    } catch(err) {
      toast.error(err?.response?.data?.detail||'Login failed. Check your credentials.')
    }
    setLoading(false)
  }

  const inp = {
    width:'100%', background:C.bgInput,
    border:`1px solid ${C.border}`, borderRadius:12,
    padding:'14px 18px', color:C.text, fontSize:16,
    outline:'none', fontFamily:'Space Grotesk,sans-serif',
    transition:'border-color .2s, background .3s',
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Grotesk,sans-serif', padding:'20px 16px', position:'relative', overflow:'hidden', transition:'background .3s' }}>
      {/* Grid bg */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize:'40px 40px', opacity:0.6 }}/>
      <div style={{ position:'absolute', top:'20%', left:'10%', width:320, height:320, borderRadius:'50%', background:`${C.secondary}15`, filter:'blur(80px)' }}/>
      <div style={{ position:'absolute', bottom:'20%', right:'10%', width:260, height:260, borderRadius:'50%', background:`${C.primary}10`, filter:'blur(80px)' }}/>

      {/* Top right controls */}
      <div style={{ position:'absolute', top:20, right:20, zIndex:10, display:'flex', gap:8 }}>
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="fade-in" style={{ width:'100%', maxWidth:460, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:`linear-gradient(135deg,${C.secondary},${C.primary})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontFamily:'Orbitron,sans-serif', color:'#fff', fontWeight:900, margin:'0 auto 16px' }}>B</div>
          <h1 style={{ fontFamily:'Orbitron,sans-serif', fontSize:24, color:C.text, fontWeight:700, letterSpacing:1, marginBottom:8 }}>NeuralOnco</h1>
          <p style={{ color:C.muted, fontSize:15 }}>Brain Tumor Detection System</p>
        </div>

        {/* Card */}
        <div style={{ background:C.bgCard, borderRadius:22, border:`1px solid ${C.border}`, padding:'36px', boxShadow:C.shadow, transition:'background .3s, border-color .3s' }}>
          <h2 style={{ fontSize:22, color:C.text, fontWeight:600, marginBottom:8 }}>{t('welcomeBack')}</h2>
          <p style={{ color:C.muted, fontSize:15, marginBottom:30 }}>{t('signIn')}</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, color:C.muted, marginBottom:7, letterSpacing:0.5, textTransform:'uppercase' }}>{t('emailAddress')}</label>
              <input name="email" type="email" value={form.email} onChange={onChange} placeholder="doctor@hospital.com" style={inp} autoComplete="email"
                onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>

            <div style={{ marginBottom:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <label style={{ fontSize:13, color:C.muted, letterSpacing:0.5, textTransform:'uppercase' }}>{t('password')}</label>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ background:'none', border:'none', color:C.primary, cursor:'pointer', fontSize:13 }}>{showPw?t('hide'):t('show')}</button>
              </div>
              <input name="password" type={showPw?'text':'password'} value={form.password} onChange={onChange} placeholder="Enter your password" style={inp}
                onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'15px', borderRadius:32, border:'none', background:loading?C.bgCard2:`linear-gradient(135deg,${C.secondary},${C.primary})`, color:loading?C.muted:'#fff', cursor:loading?'not-allowed':'pointer', fontFamily:'Orbitron,sans-serif', fontSize:13, letterSpacing:2, fontWeight:600 }}>
              {loading?t('signingIn'):t('signInBtn')}
            </button>
          </form>

          <div style={{ display:'flex', alignItems:'center', gap:14, margin:'28px 0' }}>
            <div style={{ flex:1, height:1, background:C.border }}/>
            <span style={{ fontSize:14, color:C.muted }}>{t('newToNeural')}</span>
            <div style={{ flex:1, height:1, background:C.border }}/>
          </div>

          <Link to="/signup"
            style={{ display:'block', width:'100%', padding:'14px', borderRadius:32, border:`1px solid ${C.border}`, background:'transparent', color:C.text, textAlign:'center', fontSize:15, textDecoration:'none', transition:'all .2s' }}
            onMouseEnter={e=>{e.target.style.borderColor=C.primary;e.target.style.color=C.primary}}
            onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.text}}>
            {t('createAccount')}
          </Link>
        </div>
        <p style={{ textAlign:'center', color:C.muted, fontSize:12, marginTop:22 }}>NeuralOnco v2.4.1 · AI-assisted diagnosis only</p>
      </div>
    </div>
  )
}
