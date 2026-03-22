import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth }    from './context/AuthContext.jsx'
import { LangProvider, useLang }    from './context/LangContext.jsx'
import { ThemeProvider, useColors } from './context/ThemeContext.jsx'
import ProtectedRoute               from './components/ProtectedRoute.jsx'
import LanguageSwitcher             from './components/LanguageSwitcher.jsx'
import ThemeToggle                  from './components/ThemeToggle.jsx'

import Login           from './pages/Login.jsx'
import Signup          from './pages/Signup.jsx'
import Dashboard       from './pages/Dashboard.jsx'
import AddPatient      from './pages/AddPatient.jsx'
import MRIScan         from './pages/MRIScan.jsx'
import SearchPatient   from './pages/SearchPatient.jsx'
import MRIView3D       from './pages/MRIView3D.jsx'
import Reports         from './pages/Reports.jsx'
import PatientDetail   from './pages/PatientDetail.jsx'
import PatientTimeline from './pages/PatientTimeline.jsx'

// ── Window size hook ──────────────────────────────────────────────────
function useWindowSize() {
  const [w, setW] = useState(window.innerWidth)
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w
}

// ── Sidebar ────────────────────────────────────────────────────────────
function Sidebar({ mobileOpen, setMobileOpen }) {
  const nav      = useNavigate()
  const loc      = useLocation()
  const { t }    = useLang()
  const C        = useColors()
  const w        = useWindowSize()
  const isMobile = w <= 768
  const active   = loc.pathname

  const NAV = [
    { path: '/',            icon: '⬡', key: 'dashboard'  },
    { path: '/add-patient', icon: '✦', key: 'addPatient'  },
    { path: '/mri-scan',    icon: '◈', key: 'mriScan'    },
    { path: '/search',      icon: '◎', key: 'search'     },
    { path: '/3d-view',     icon: '◉', key: 'view3d'     },
    { path: '/reports',     icon: '≡', key: 'reports'    },
  ]

  const goto = path => { nav(path); if (isMobile) setMobileOpen(false) }

  if (isMobile) {
    if (!mobileOpen) return null
    return (
      <>
        <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200 }} />
        <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 270, background: C.bgCard, borderRight: `1px solid ${C.border}`, zIndex: 201, padding: '24px 0', overflowY: 'auto' }}>
          <div style={{ padding: '0 20px 20px', borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${C.secondary},${C.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: 'Orbitron,sans-serif', color: '#fff', fontWeight: 900 }}>B</div>
              <div>
                <p style={{ fontFamily: 'Orbitron,sans-serif', color: C.primary, fontSize: 14, fontWeight: 700 }}>NeuralOnco</p>
                <p style={{ color: C.muted, fontSize: 12 }}>v2.4.1</p>
              </div>
            </div>
          </div>
          {NAV.map(n => {
            const isActive = active === n.path || (n.path !== '/' && active.startsWith(n.path))
            return (
              <button key={n.path} onClick={() => goto(n.path)}
                style={{ width: '100%', padding: '14px 20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: isActive ? `${C.primary}18` : 'transparent', color: isActive ? C.primary : C.muted, textAlign: 'left', borderLeft: isActive ? `3px solid ${C.primary}` : '3px solid transparent', transition: 'all .2s' }}>
                <span style={{ fontSize: 22 }}>{n.icon}</span>
                <span style={{ fontSize: 16, fontWeight: isActive ? 600 : 400 }}>{t(n.key)}</span>
              </button>
            )
          })}
        </aside>
      </>
    )
  }

  return (
    <aside style={{ width: 80, background: C.bgCard, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 6, flexShrink: 0, transition: 'background .3s' }}>
      <div style={{ marginBottom: 18, cursor: 'pointer' }} onClick={() => nav('/')}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${C.secondary},${C.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: 'Orbitron,sans-serif', color: '#fff', fontWeight: 900 }}>B</div>
      </div>
      {NAV.map(n => {
        const isActive = active === n.path || (n.path !== '/' && active.startsWith(n.path))
        return (
          <button key={n.path} onClick={() => goto(n.path)} title={t(n.key)}
            style={{ width: 58, height: 58, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: isActive ? `${C.primary}22` : 'transparent', color: isActive ? C.primary : C.muted, transition: 'all .2s', outline: isActive ? `1px solid ${C.primary}44` : 'none' }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{t(n.key).split(' ')[0]}</span>
          </button>
        )
      })}
    </aside>
  )
}

// ── Top Bar ────────────────────────────────────────────────────────────
function TopBar({ onMenuClick }) {
  const { doctor, logout } = useAuth()
  const { t }              = useLang()
  const C                  = useColors()
  const w                  = useWindowSize()
  const nav                = useNavigate()
  const isMobile           = w <= 768
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => { await logout(); nav('/login') }

  return (
    <div style={{ height: 58, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', background: C.bgCard, flexShrink: 0, transition: 'background .3s' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && (
          <button onClick={onMenuClick} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', color: C.text, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>☰</button>
        )}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="pulse-dot" style={{ width: 9, height: 9, borderRadius: '50%', background: C.success, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.muted, letterSpacing: 1.5, fontFamily: 'Orbitron,sans-serif' }}>NEURAL-ONCO v2.4.1</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ThemeToggle />
        <LanguageSwitcher />

        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowMenu(!showMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 30, border: `1px solid ${C.border}` }}>
            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, color: C.text, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{doctor?.name || 'Doctor'}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{doctor?.hospital || 'NeuralOnco'}</p>
              </div>
            )}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${C.secondary},${C.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
              {(doctor?.name?.[0] || 'D').toUpperCase()}
            </div>
          </div>

          {showMenu && (
            <div style={{ position: 'absolute', right: 0, top: 48, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 8, minWidth: 200, zIndex: 100, boxShadow: C.shadow }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
                <p style={{ fontSize: 15, color: C.text, fontWeight: 600, margin: 0 }}>{doctor?.name}</p>
                <p style={{ fontSize: 12, color: C.muted, margin: '3px 0 0' }}>{doctor?.email}</p>
                {doctor?.speciality && <p style={{ fontSize: 12, color: C.primary, margin: '3px 0 0' }}>{doctor.speciality}</p>}
              </div>
              <button onClick={handleLogout}
                style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 14, textAlign: 'left', borderRadius: 8 }}>
                ⎋ {t('signOut')}
              </button>
            </div>
          )}
        </div>
      </div>

      {showMenu && <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
    </div>
  )
}

// ── App Layout ─────────────────────────────────────────────────────────
function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const C = useColors()

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden', transition: 'background .3s' }}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/"                     element={<Dashboard />} />
            <Route path="/add-patient"          element={<AddPatient />} />
            <Route path="/mri-scan"             element={<MRIScan />} />
            <Route path="/search"               element={<SearchPatient />} />
            <Route path="/3d-view"              element={<MRIView3D />} />
            <Route path="/reports"              element={<Reports />} />
            <Route path="/patient/:id"          element={<PatientDetail />} />
            <Route path="/patient/:id/timeline" element={<PatientTimeline />} />
            <Route path="*"                     element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontFamily: 'Space Grotesk,sans-serif',
                fontSize: '14px',
              }
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  )
}