import { useTheme, useColors } from '../context/ThemeContext.jsx'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  const C = useColors()

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 14px',
        borderRadius: 30,
        border: `1px solid ${C.border}`,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        color: C.text,
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: 'Space Grotesk, sans-serif',
        transition: 'all .2s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      {/* Animated sun/moon icon */}
      <span style={{ fontSize: 16, lineHeight: 1, transition: 'transform .3s', transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
        {isDark ? '🌙' : '☀️'}
      </span>
      <span style={{ color: C.muted, fontSize: 12 }}>
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}
