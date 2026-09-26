import api, { isDemoMode, delay } from './api'
import { mockUsers, DEMO_CREDENTIALS } from '../data/mockUsers'

export const authService = {
  async login(email, password) {
    if (isDemoMode()) {
      await delay(1200)
      // Accept demo credentials or any reasonable email/password
      const isDemo =
        email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password
      const isAny = email.includes('@') && password.length >= 6
      if (isDemo || isAny) {
        const user = {
          ...mockUsers[0],
          email: email,
          name: isDemo ? mockUsers[0].name : email.split('@')[0]
        }
        localStorage.setItem('fakenix_user', JSON.stringify(user))
        localStorage.setItem('fakenix_token', 'demo_token_' + Date.now())
        localStorage.setItem('fakenix_demo_mode', 'true')
        return { success: true, user }
      } else {
        throw new Error('Invalid email or password')
      }
    }
    // Real backend call
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data
    localStorage.setItem('fakenix_user', JSON.stringify(user))
    localStorage.setItem('fakenix_token', token)
    return { success: true, user }
  },

  async register(name, email, password) {
    if (isDemoMode()) {
      await delay(1500)
      const user = { ...mockUsers[0], name, email }
      localStorage.setItem('fakenix_user', JSON.stringify(user))
      localStorage.setItem('fakenix_token', 'demo_token_' + Date.now())
      localStorage.setItem('fakenix_demo_mode', 'true')
      return { success: true, user }
    }
    const response = await api.post('/auth/register', { name, email, password })
    return response.data
  },

  logout() {
    localStorage.removeItem('fakenix_user')
    localStorage.removeItem('fakenix_token')
    localStorage.removeItem('fakenix_demo_mode')
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('fakenix_user')
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('fakenix_token')
  },

  async updateProfile(data) {
    if (isDemoMode()) {
      await delay(800)
      const currentUser = this.getCurrentUser()
      const updated = { ...currentUser, ...data }
      localStorage.setItem('fakenix_user', JSON.stringify(updated))
      return { success: true, user: updated }
    }
    const response = await api.put('/user/profile', data)
    return response.data
  }
}
