import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

// ── All CSS variables for both modes ──────────────────────────────────
const THEMES = {
  dark: {
    '--bg':           '#080B1A',
    '--bg-card':      '#0D1128',
    '--bg-card2':     '#111835',
    '--bg-input':     '#080B1A',
    '--border':       'rgba(0,212,255,0.15)',
    '--border-hover': 'rgba(0,212,255,0.35)',
    '--text':         '#E8EEFF',
    '--text-muted':   '#6B7DB3',
    '--text-faint':   '#3D4F7A',
    '--primary':      '#00D4FF',
    '--secondary':    '#7B2FFF',
    '--success':      '#00FF94',
    '--warning':      '#FFB800',
    '--danger':       '#FF4757',
    '--shadow':       '0 4px 24px rgba(0,0,0,0.5)',
    '--shadow-card':  '0 0 40px rgba(123,47,255,0.12)',
    '--grid-line':    'rgba(0,212,255,0.05)',
  },
  light: {
    '--bg':           '#F0F4FF',
    '--bg-card':      '#FFFFFF',
    '--bg-card2':     '#EEF2FF',
    '--bg-input':     '#F8FAFF',
    '--border':       'rgba(0,100,200,0.15)',
    '--border-hover': 'rgba(0,100,200,0.4)',
    '--text':         '#0D1128',
    '--text-muted':   '#4A5580',
    '--text-faint':   '#A0AABF',
    '--primary':      '#0088CC',
    '--secondary':    '#6B22E0',
    '--success':      '#00A86B',
    '--warning':      '#CC8800',
    '--danger':       '#CC2233',
    '--shadow':       '0 4px 24px rgba(0,0,0,0.1)',
    '--shadow-card':  '0 0 30px rgba(0,100,200,0.08)',
    '--grid-line':    'rgba(0,100,200,0.05)',
  },
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('neural_theme') || 'dark'
  )

  // Apply CSS variables to :root whenever theme changes
  useEffect(() => {
    const root = document.documentElement
    const vars = THEMES[theme]
    Object.entries(vars).forEach(([key, val]) => {
      root.style.setProperty(key, val)
    })
    root.setAttribute('data-theme', theme)
    localStorage.setItem('neural_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const isDark = theme === 'dark'

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// ── Helper: get color from current theme ──────────────────────────────
// Usage: const C = useColors()  →  C.primary, C.text, etc.
export function useColors() {
  const { theme } = useTheme()
  const vars = THEMES[theme]
  return {
    primary:   vars['--primary'],
    secondary: vars['--secondary'],
    success:   vars['--success'],
    warning:   vars['--warning'],
    danger:    vars['--danger'],
    bg:        vars['--bg'],
    bgCard:    vars['--bg-card'],
    bgCard2:   vars['--bg-card2'],
    bgInput:   vars['--bg-input'],
    border:    vars['--border'],
    borderH:   vars['--border-hover'],
    text:      vars['--text'],
    muted:     vars['--text-muted'],
    faint:     vars['--text-faint'],
    shadow:    vars['--shadow'],
  }
}
