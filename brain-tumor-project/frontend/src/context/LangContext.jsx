import { createContext, useContext, useState, useEffect } from 'react'
import translations, { LANGUAGES } from '../i18n/translations.js'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('neural_lang') || 'en'
  )

  useEffect(() => {
    localStorage.setItem('neural_lang', lang)
  }, [lang])

  const t = (key) => translations[lang]?.[key] ?? translations['en'][key] ?? key

  const changeLang = (code) => setLang(code)

  return (
    <LangContext.Provider value={{ lang, changeLang, t, LANGUAGES }}>
      {children}
    </LangContext.Provider>
  )
}

// Hook — use anywhere: const { t } = useLang()
export const useLang = () => useContext(LangContext)
