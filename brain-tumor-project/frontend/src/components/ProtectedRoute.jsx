import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()

  // Still checking localStorage for saved token
  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#080B1A', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7DB3', fontFamily:'Space Grotesk,sans-serif', fontSize:14 }}>
        Loading...
      </div>
    )
  }

  // Not logged in — redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}
