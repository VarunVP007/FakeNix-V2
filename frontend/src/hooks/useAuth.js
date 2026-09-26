import { useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    setLoading(true)
    try {
      const result = await authService.login(email, password)
      setUser(result.user)
      return result
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    setError(null)
    setLoading(true)
    try {
      const result = await authService.register(name, email, password)
      setUser(result.user)
      return result
    } catch (err) {
      setError(err.message || 'Registration failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (data) => {
    const result = await authService.updateProfile(data)
    setUser(result.user)
    return result
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile
  }
}
