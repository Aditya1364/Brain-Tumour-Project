import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
  }
})

// Attach auth token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('neural_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 - redirect to login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('neural_token')
      localStorage.removeItem('neural_doctor')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Patients ──────────────────────────────────────────────────────────
export const getPatients   = (params = {}) => api.get('/patients', { params })
export const getPatient    = (id)          => api.get(`/patients/${id}`)
export const createPatient = (data)        => api.post('/patients', data)
export const updatePatient = (id, data)    => api.put(`/patients/${id}`, data)
export const deletePatient = (id)          => api.delete(`/patients/${id}`)

// ── Scans ─────────────────────────────────────────────────────────────
export const uploadScan = (patientId, file) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('patient_id', patientId)
  return api.post('/scans/upload', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'ngrok-skip-browser-warning': 'true',
    }
  })
}
export const analyzeScan = (scanId) => api.post(`/scans/${scanId}/analyze`)
export const getScan     = (scanId) => api.get(`/scans/${scanId}`)
export const getScans    = (params) => api.get('/scans', { params })

// ── Dashboard ─────────────────────────────────────────────────────────
export const getDashboard   = () => api.get('/dashboard/stats')
export const getMonthlyData = () => api.get('/dashboard/monthly')

// ── Reports ───────────────────────────────────────────────────────────
export const getModelMetrics = ()    => api.get('/reports/model-metrics')
export const exportReport    = (id)  => api.get(`/reports/export/${id}`, { responseType: 'blob' })

export default api