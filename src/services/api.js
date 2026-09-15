import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fakenix_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fakenix_user')
      localStorage.removeItem('fakenix_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const isDemoMode = () => DEMO_MODE || !BASE_URL

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default api
