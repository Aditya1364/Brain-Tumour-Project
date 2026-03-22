import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [doctor,  setDoctor]  = useState(null)
  const [loading, setLoading] = useState(true)   // checking saved token

  // On app start — restore session from localStorage
  useEffect(() => {
    const token  = localStorage.getItem('neural_token')
    const saved  = localStorage.getItem('neural_doctor')
    if (token && saved) {
      try {
        setDoctor(JSON.parse(saved))
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch { clearAuth() }
    }
    setLoading(false)
  }, [])

  const clearAuth = () => {
    localStorage.removeItem('neural_token')
    localStorage.removeItem('neural_doctor')
    delete axios.defaults.headers.common['Authorization']
    setDoctor(null)
  }

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { access_token, doctor: doc } = res.data
    localStorage.setItem('neural_token',  access_token)
    localStorage.setItem('neural_doctor', JSON.stringify(doc))
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setDoctor(doc)
    return doc
  }

  const signup = async (formData) => {
    const res = await axios.post('/api/auth/signup', formData)
    const { access_token, doctor: doc } = res.data
    localStorage.setItem('neural_token',  access_token)
    localStorage.setItem('neural_doctor', JSON.stringify(doc))
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setDoctor(doc)
    return doc
  }

  const logout = async () => {
    try { await axios.post('/api/auth/logout') } catch {}
    clearAuth()
  }

  return (
    <AuthContext.Provider value={{ doctor, loading, login, signup, logout, isLoggedIn: !!doctor }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
