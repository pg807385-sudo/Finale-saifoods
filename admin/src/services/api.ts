import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saifoods-admin-auth')
  if (token) {
    const parsed = JSON.parse(token)
    if (parsed.state?.token) {
      config.headers.Authorization = `Bearer ${parsed.state.token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('saifoods-admin-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api